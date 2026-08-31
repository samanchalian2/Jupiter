import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { NotificationService } from '../notifications/notification.service.js';

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
type TransitionInput = { reason?: string; endsAt?: string; graceDays?: number };

const transitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  TRIAL: ['ACTIVE', 'EXPIRED'], ACTIVE: ['PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'], PAST_DUE: ['ACTIVE', 'SUSPENDED', 'CANCELLED'], SUSPENDED: ['ACTIVE', 'CANCELLED'], CANCELLED: [], EXPIRED: ['ACTIVE'],
};

@Injectable()
export class SubscriptionLifecycleService {
  constructor(private readonly database: DatabaseService, private readonly notifications?: NotificationService) {}
  private async platform(userId: string) {
    const user = (await this.database.query<{ is_platform_admin: boolean }>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active', [userId])).rows[0];
    if (!user?.is_platform_admin) throw new ForbiddenException();
  }
  private async notifyOwners(organizationId: string, type: string, subscriptionId: string) {
    const userIds = (await this.database.withOrganization(organizationId, async client => (await client.query<{ user_id: string }>("SELECT DISTINCT m.user_id FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 AND m.status='active' AND u.is_active AND r.code='ORG_OWNER'", [organizationId])))).rows.map(row => row.user_id);
    if (userIds.length) await this.notifications?.publish(organizationId, userIds, { type, occurredAt: new Date().toISOString() });
  }
  private async markedNotice(organizationId: string, alertCode: string, subscriptionId: string) {
    const created = await this.database.withOrganization(organizationId, async client => Boolean((await client.query("INSERT INTO commercial_notification_marks(organization_id,alert_code,capability_code,window_key) VALUES($1,$2,'',$3) ON CONFLICT DO NOTHING RETURNING organization_id", [organizationId, alertCode, subscriptionId])).rowCount));
    if (created) await this.notifyOwners(organizationId, `COMMERCIAL_${alertCode}`, subscriptionId);
  }
  async list(userId: string) {
    await this.platform(userId);
    return (await this.database.query('SELECT s.id,s.organization_id,o.name organization_name,p.name product_name,s.status,s.starts_at,s.ends_at,s.past_due_at,s.grace_ends_at,s.cancelled_at,s.cancellation_reason FROM commercial_subscriptions s JOIN organizations o ON o.id=s.organization_id JOIN commercial_products p ON p.id=s.product_id ORDER BY s.ends_at NULLS LAST')).rows;
  }
  private async transition(userId: string, organizationId: string, subscriptionId: string, next: SubscriptionStatus, input: TransitionInput = {}) {
    await this.platform(userId);
    if (!organizationId) throw new BadRequestException('سازمان هدف الزامی است.');
    if (input.graceDays !== undefined && (!Number.isInteger(input.graceDays) || input.graceDays < 0 || input.graceDays > 90)) throw new BadRequestException('مهلت باید تعداد روز صحیح بین صفر تا ۹۰ باشد.');
    const result = await this.database.withOrganization(organizationId, async client => {
      const row = (await client.query<{ status: SubscriptionStatus; grace_days: number }>("SELECT s.status,COALESCE(a.grace_days,7) grace_days FROM commercial_subscriptions s LEFT JOIN organization_commercial_agreements a ON a.organization_id=s.organization_id WHERE s.id=$1 AND s.organization_id=$2 FOR UPDATE OF s", [subscriptionId, organizationId])).rows[0];
      if (!row) throw new NotFoundException('اشتراک یافت نشد.');
      if (row.status === next) {
        if (next === 'ACTIVE' && input.endsAt) {
          const extended = await client.query<{ id: string }>('UPDATE commercial_subscriptions SET ends_at=$3,lifecycle_updated_at=now() WHERE id=$1 AND organization_id=$2 AND ends_at IS DISTINCT FROM $3 RETURNING id', [subscriptionId, organizationId, input.endsAt]);
          if (extended.rowCount) {
            await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5,$6)', [organizationId, userId, 'SUBSCRIPTION_RENEWED', 'commercial_subscription', subscriptionId, { from: row.status, to: next, renewal: true }]);
            return { id: subscriptionId, idempotent: false, status: next, event: 'SUBSCRIPTION_RENEWED' };
          }
        }
        return { id: subscriptionId, idempotent: true, status: next };
      }
      if (!transitions[row.status].includes(next)) throw new BadRequestException('گذار وضعیت اشتراک مجاز نیست.');
      const graceDays = next === 'PAST_DUE' ? input.graceDays ?? row.grace_days : null;
      const changed = (await client.query<{ id: string; status: SubscriptionStatus }>("UPDATE commercial_subscriptions SET status=$3,past_due_at=CASE WHEN $3='PAST_DUE' THEN now() ELSE past_due_at END,grace_ends_at=CASE WHEN $3='PAST_DUE' THEN now()+($4::text||' days')::interval WHEN $3='ACTIVE' THEN NULL ELSE grace_ends_at END,cancelled_at=CASE WHEN $3='CANCELLED' THEN now() ELSE cancelled_at END,cancelled_by_user_id=CASE WHEN $3='CANCELLED' THEN $5 ELSE cancelled_by_user_id END,cancellation_reason=CASE WHEN $3='CANCELLED' THEN $6 ELSE cancellation_reason END,ends_at=COALESCE($7,ends_at),lifecycle_updated_at=now() WHERE id=$1 AND organization_id=$2 RETURNING id,status", [subscriptionId, organizationId, next, graceDays, userId, input.reason?.trim() || null, input.endsAt ?? null])).rows[0];
      const event = next === 'ACTIVE' ? row.status === 'EXPIRED' ? 'SUBSCRIPTION_REACTIVATED' : row.status === 'PAST_DUE' ? 'SUBSCRIPTION_RENEWED' : 'SUBSCRIPTION_ACTIVATED' : `SUBSCRIPTION_${next}`;
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5,$6)', [organizationId, userId, event, 'commercial_subscription', subscriptionId, { from: row.status, to: next, reason: input.reason?.trim() || null, graceDays }]);
      return { ...changed, idempotent: false, event };
    });
    if (!result.idempotent && 'event' in result) await this.markedNotice(organizationId, result.event, subscriptionId);
    return result;
  }
  activate(userId: string, organizationId: string, subscriptionId: string) { return this.transition(userId, organizationId, subscriptionId, 'ACTIVE'); }
  pastDue(userId: string, organizationId: string, subscriptionId: string, graceDays?: number) { return this.transition(userId, organizationId, subscriptionId, 'PAST_DUE', { graceDays }); }
  suspend(userId: string, organizationId: string, subscriptionId: string, reason: string) { if (!reason.trim()) throw new BadRequestException('دلیل تعلیق الزامی است.'); return this.transition(userId, organizationId, subscriptionId, 'SUSPENDED', { reason }); }
  cancel(userId: string, organizationId: string, subscriptionId: string, reason: string) { if (!reason.trim()) throw new BadRequestException('دلیل لغو الزامی است.'); return this.transition(userId, organizationId, subscriptionId, 'CANCELLED', { reason }); }
  renew(userId: string, organizationId: string | undefined, subscriptionId: string, endsAt: string) { if (!endsAt || new Date(endsAt) <= new Date()) throw new BadRequestException('تاریخ پایان آینده لازم است.'); return this.transition(userId, organizationId ?? '', subscriptionId, 'ACTIVE', { endsAt }); }
  async expireDue() {
    const nearing = (await this.database.query<{ id: string; organization_id: string }>("SELECT id,organization_id FROM commercial_subscriptions WHERE status='PAST_DUE' AND grace_ends_at>now() AND grace_ends_at<=now()+interval '2 days'")).rows;
    for (const row of nearing) await this.markedNotice(row.organization_id, 'SUBSCRIPTION_GRACE_NEAR_END', row.id);
    const due = (await this.database.query<{ id: string; organization_id: string; status: SubscriptionStatus }>("SELECT id,organization_id,status FROM commercial_subscriptions WHERE (status IN ('ACTIVE','TRIAL') AND ends_at<=now()) OR (status='PAST_DUE' AND grace_ends_at<=now())")).rows;
    let processed = 0;
    for (const row of due) {
      const changed = await this.database.withOrganization(row.organization_id, async client => {
        const next = row.status === 'PAST_DUE' ? 'SUSPENDED' : 'EXPIRED';
        const updated = await client.query('UPDATE commercial_subscriptions SET status=$3,lifecycle_updated_at=now() WHERE id=$1 AND organization_id=$2 AND status=$4 RETURNING id', [row.id, row.organization_id, next, row.status]);
        if (updated.rowCount) await client.query('INSERT INTO audit_logs(organization_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5)', [row.organization_id, `SUBSCRIPTION_${next}`, 'commercial_subscription', row.id, { automation: true, from: row.status, to: next }]);
        return Boolean(updated.rowCount);
      });
      if (changed) { processed += 1; await this.markedNotice(row.organization_id, `SUBSCRIPTION_${row.status === 'PAST_DUE' ? 'SUSPENDED' : 'EXPIRED'}`, row.id); }
    }
    return { processed };
  }
}
