import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

type Actor = { userId: string; organizationId: string; roles: string[] };

@Injectable()
export class ReportingService {
  constructor(private readonly database: DatabaseService) {}

  async search(actor: Actor, q: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const staff = actor.roles.some((role) => ['ORG_ADMIN', 'SUPERVISOR', 'EXPERT'].includes(role));
      return (await client.query('SELECT id,ticket_number,title,status,priority FROM tickets WHERE ($1 OR requester_user_id=$2) AND (title ILIKE $3 OR description ILIKE $3) ORDER BY created_at DESC', [staff, actor.userId, `%${q}%`])).rows;
    });
  }

  async rate(actor: Pick<Actor, 'userId' | 'organizationId'>, ticket: string, score: number, comment?: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const allowed = await client.query('SELECT 1 FROM tickets WHERE id=$1 AND requester_user_id=$2 AND status IN (\'RESOLVED\',\'CLOSED\')', [ticket, actor.userId]);
      if (!allowed.rowCount) throw new ForbiddenException();
      return (await client.query('INSERT INTO ticket_ratings(organization_id,ticket_id,requester_user_id,score,comment) VALUES($1,$2,$3,$4,$5) RETURNING id,score,comment,created_at', [actor.organizationId, ticket, actor.userId, score, comment ?? null])).rows[0];
    });
  }

  async workload(actor: Pick<Actor, 'organizationId' | 'roles'>) {
    if (!actor.roles.some((role) => ['ORG_ADMIN', 'SUPERVISOR'].includes(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('SELECT status,count(*)::int AS count FROM tickets GROUP BY status ORDER BY status')).rows);
  }

  async overview(actor: Actor) {
    const staff = actor.roles.some((role) => ['ORG_ADMIN', 'SUPERVISOR', 'EXPERT'].includes(role));
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const scope = staff ? '' : ' AND requester_user_id=$1';
      const values = staff ? [] : [actor.userId];
      const metrics = (await client.query<{total:number;active:number;in_progress:number;waiting:number;completed:number;unassigned:number;at_risk:number}>(
        `SELECT count(*)::int AS total,
          count(*) FILTER (WHERE status IN ('OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER'))::int AS active,
          count(*) FILTER (WHERE status='IN_PROGRESS')::int AS in_progress,
          count(*) FILTER (WHERE status='WAITING_FOR_REQUESTER')::int AS waiting,
          count(*) FILTER (WHERE status IN ('RESOLVED','CLOSED'))::int AS completed,
          count(*) FILTER (WHERE status IN ('OPEN','IN_PROGRESS') AND NOT EXISTS(SELECT 1 FROM ticket_assignments assignment WHERE assignment.ticket_id=tickets.id AND assignment.ended_at IS NULL))::int AS unassigned,
          count(*) FILTER (WHERE EXISTS(SELECT 1 FROM ticket_sla_clocks clock WHERE clock.ticket_id=tickets.id AND clock.resolution_due_at <= now()+interval '4 hours' AND clock.breached_at IS NULL) AND status NOT IN ('RESOLVED','CLOSED'))::int AS at_risk
         FROM tickets WHERE true${scope}`, values,
      )).rows[0];
      const recent = (await client.query(
        `SELECT tickets.id,tickets.ticket_number,tickets.title,tickets.status,tickets.priority,tickets.updated_at,
          assignee.display_name AS assignee_display_name
         FROM tickets LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=tickets.id AND assignment.ended_at IS NULL
         LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id
         WHERE true${scope} ORDER BY tickets.updated_at DESC LIMIT 8`, values,
      )).rows;
      return { ...metrics, recent };
    });
  }

  async summary(actor: Pick<Actor, 'organizationId' | 'roles'>, range: ReportRange = {}) {
    if (!actor.roles.some((role) => ['ORG_ADMIN', 'SUPERVISOR'].includes(role))) throw new ForbiddenException();
    const window = reportWindow(range);
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query(`SELECT
      count(*)::int AS total_tickets,
      count(*) FILTER (WHERE status IN ('OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER'))::int AS active_tickets,
      count(*) FILTER (WHERE status IN ('RESOLVED','CLOSED'))::int AS completed_tickets,
      COALESCE((SELECT round(avg(r.score)::numeric,2) FROM ticket_ratings r JOIN tickets rated ON rated.id=r.ticket_id WHERE rated.created_at >= $1 AND rated.created_at < $2),0) AS average_satisfaction,
      (SELECT count(*)::int FROM ticket_sla_clocks clock JOIN tickets clocked ON clocked.id=clock.ticket_id WHERE clock.breached_at IS NOT NULL AND clocked.created_at >= $1 AND clocked.created_at < $2) AS sla_breaches
      FROM tickets WHERE created_at >= $1 AND created_at < $2`, [window.from, window.to])).rows[0]);
  }

  async exportCsv(actor: Pick<Actor, 'organizationId' | 'roles'>, range: ReportRange = {}) {
    if (!actor.roles.some((role) => ['ORG_ADMIN', 'SUPERVISOR'].includes(role))) throw new ForbiddenException();
    const window = reportWindow(range);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const rows = (await client.query<{ticket_number:number;title:string;status:string;priority:string;created_at:Date}>('SELECT ticket_number,title,status,priority,created_at FROM tickets WHERE created_at >= $1 AND created_at < $2 ORDER BY created_at DESC LIMIT 10000', [window.from, window.to])).rows;
      const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"','""')}"`;
      return ['ticket_number,title,status,priority,created_at', ...rows.map(row => [row.ticket_number,row.title,row.status,row.priority,row.created_at.toISOString()].map(quote).join(','))].join('\n');
    });
  }

  async breakdown(actor: Pick<Actor, 'organizationId' | 'roles'>, range: ReportRange = {}) {
    if (!actor.roles.some((role) => ['ORG_ADMIN', 'SUPERVISOR'].includes(role))) throw new ForbiddenException();
    const window = reportWindow(range);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const [status, priority, trend, recent] = await Promise.all([
        client.query<{label:string;count:number}>(`SELECT status AS label,count(*)::int AS count FROM tickets WHERE created_at >= $1 AND created_at < $2 GROUP BY status ORDER BY count DESC`, [window.from,window.to]),
        client.query<{label:string;count:number}>(`SELECT priority AS label,count(*)::int AS count FROM tickets WHERE created_at >= $1 AND created_at < $2 GROUP BY priority ORDER BY count DESC`, [window.from,window.to]),
        client.query<{day:string;created:number;completed:number}>(`SELECT to_char(day,'YYYY-MM-DD') AS day,COALESCE(created,0)::int AS created,COALESCE(completed,0)::int AS completed FROM generate_series($1::date,$2::date-1,interval '1 day') day LEFT JOIN LATERAL (SELECT count(*) AS created FROM tickets WHERE created_at >= day AND created_at < day+interval '1 day') c ON true LEFT JOIN LATERAL (SELECT count(*) AS completed FROM tickets WHERE status IN ('RESOLVED','CLOSED') AND updated_at >= day AND updated_at < day+interval '1 day') d ON true ORDER BY day`, [window.from,window.to]),
        client.query(`SELECT ticket_number,title,status,priority,created_at FROM tickets WHERE created_at >= $1 AND created_at < $2 ORDER BY created_at DESC LIMIT 50`, [window.from,window.to]),
      ]);
      return { status: status.rows, priority: priority.rows, trend: trend.rows, tickets: recent.rows };
    });
  }

  async platformOverview(userId: string) {
    const admin = await this.database.query<{ is_platform_admin: boolean }>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId]);
    if (!admin.rows[0]?.is_platform_admin) throw new ForbiddenException();
    const result = await this.database.query<{ organizations: number; active_memberships: number; open_tickets: number }>(`SELECT
      (SELECT count(*)::int FROM organizations WHERE status='active') AS organizations,
      (SELECT count(*)::int FROM memberships WHERE status='active') AS active_memberships,
      (SELECT count(*)::int FROM tickets WHERE status IN ('OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER')) AS open_tickets`);
    return result.rows[0];
  }
}

type ReportRange = { from?: string; to?: string };
function reportWindow(range: ReportRange) {
  const today = new Date();
  const defaultTo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  const defaultFrom = new Date(defaultTo);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 30);
  const from = parseReportDate(range.from, defaultFrom);
  const to = parseReportDate(range.to, defaultTo, true);
  if (from >= to || to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) throw new BadRequestException('Report date range is invalid');
  return { from, to };
}
function parseReportDate(value: string | undefined, fallback: Date, end = false) {
  if (!value) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('Report dates must use YYYY-MM-DD');
  const result = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(result.getTime())) throw new BadRequestException('Report date is invalid');
  if (end) result.setUTCDate(result.getUTCDate() + 1);
  return result;
}
