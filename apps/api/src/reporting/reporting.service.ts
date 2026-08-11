import { ForbiddenException, Injectable } from '@nestjs/common';
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
