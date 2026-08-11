import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { assertTransition, TicketStatus } from './ticket-lifecycle.js';

type Actor = { userId: string; organizationId: string; roles: string[] };
const managerRoles = new Set(['ORG_ADMIN', 'SUPERVISOR']);
const workerRoles = new Set(['ORG_ADMIN', 'SUPERVISOR', 'EXPERT']);

@Injectable()
export class TicketService {
  constructor(private readonly database: DatabaseService) {}

  async createDraft(actor: Actor, data: { title:string; description:string; priority?:string; departmentId?:string }) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const result = await client.query(
        'INSERT INTO tickets(organization_id,requester_user_id,title,description,priority,department_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,ticket_number,status,title,description,priority,created_at',
        [actor.organizationId, actor.userId, data.title, data.description, data.priority ?? 'NORMAL', data.departmentId ?? null],
      );
      const policy = (await client.query<{id:string;first_response_minutes:number;resolution_minutes:number}>('SELECT id,first_response_minutes,resolution_minutes FROM sla_policies WHERE priority=$1 AND is_active=true ORDER BY id LIMIT 1',[data.priority ?? 'NORMAL'])).rows[0];
      if (policy) await client.query('INSERT INTO ticket_sla_clocks(ticket_id,organization_id,policy_id,first_response_due_at,resolution_due_at) VALUES($1,$2,$3,now()+($4::text||\' minutes\')::interval,now()+($5::text||\' minutes\')::interval)',[result.rows[0].id,actor.organizationId,policy.id,policy.first_response_minutes,policy.resolution_minutes]);
      await this.activity(client, actor, result.rows[0].id, 'ticket.draft_created', 'REQUESTER');
      return result.rows[0];
    });
  }

  async submit(actor: Actor, ticketId: string) { return this.changeStatus(actor, ticketId, 'OPEN'); }

  async changeStatus(actor: Actor, ticketId: string, to: TicketStatus, reason?: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const ticket = await this.ticket(client, ticketId);
      const isOwner = ticket.requester_user_id === actor.userId;
      if (ticket.status === 'DRAFT' && !isOwner) throw new ForbiddenException();
      if (ticket.status !== 'DRAFT' && !isOwner && !actor.roles.some((role) => workerRoles.has(role))) throw new ForbiddenException();
      if (to !== 'OPEN' && isOwner && !['RESOLVED', 'CLOSED'].includes(ticket.status)) throw new ForbiddenException();
      assertTransition(ticket.status, to);
      await client.query('UPDATE tickets SET status=$1,updated_at=now() WHERE id=$2', [to, ticketId]);
      await client.query('INSERT INTO ticket_status_transitions(organization_id,ticket_id,from_status,to_status,changed_by_user_id,reason) VALUES($1,$2,$3,$4,$5,$6)', [actor.organizationId,ticketId,ticket.status,to,actor.userId,reason ?? null]);
      await this.activity(client, actor, ticketId, 'ticket.status_changed', 'REQUESTER', { from: ticket.status, to });
      return { ...ticket, status: to };
    });
  }

  async assign(actor: Actor, ticketId: string, assignedToUserId: string) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ticket(client, ticketId);
      const assignee = await client.query('SELECT 1 FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.user_id=$2 AND m.status=\'active\' AND r.code IN (\'EXPERT\',\'SUPERVISOR\',\'ORG_ADMIN\')', [actor.organizationId,assignedToUserId]);
      if (!assignee.rowCount) throw new NotFoundException('Eligible assignee not found');
      await client.query('UPDATE ticket_assignments SET ended_at=now() WHERE ticket_id=$1 AND ended_at IS NULL', [ticketId]);
      const assignment = await client.query('INSERT INTO ticket_assignments(organization_id,ticket_id,assigned_to_user_id,assigned_by_user_id) VALUES($1,$2,$3,$4) RETURNING id,assigned_to_user_id,assigned_at', [actor.organizationId,ticketId,assignedToUserId,actor.userId]);
      await this.activity(client, actor, ticketId, 'ticket.assigned', 'STAFF', { assignedToUserId });
      return assignment.rows[0];
    });
  }

  async list(actor: Actor, filters: { status?: string; priority?: string; query?: string; sort?: string } = {}) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const conditions = '($1::uuid IS NOT NULL) AND ($2::text IS NULL OR t.status=$2) AND ($3::text IS NULL OR t.priority=$3) AND ($4::text IS NULL OR t.title ILIKE \'%\'||$4||\'%\')';
      const orderBy = filters.sort === 'oldest' ? 't.created_at ASC' : filters.sort === 'priority' ? "CASE t.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END, t.created_at DESC" : 't.created_at DESC';
      const fields = `t.id,t.ticket_number,t.title,t.status,t.priority,t.requester_user_id,t.created_at,
        assignee.id AS assigned_to_user_id, assignee.display_name AS assignee_display_name,
        COALESCE((SELECT json_agg(json_build_object('id',tag.id,'name',tag.name,'color',tag.color) ORDER BY tag.name)
          FROM ticket_tag_links link JOIN ticket_tags tag ON tag.id=link.tag_id WHERE link.ticket_id=t.id), '[]'::json) AS tags`;
      const values = [actor.userId, filters.status ?? null, filters.priority ?? null, filters.query?.trim() || null];
      if (actor.roles.some((role) => managerRoles.has(role))) return (await client.query(`SELECT ${fields} FROM tickets t LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id WHERE ${conditions} ORDER BY ${orderBy}`, values)).rows;
      if (actor.roles.includes('EXPERT')) return (await client.query(`SELECT ${fields} FROM tickets t JOIN ticket_assignments mine ON mine.ticket_id=t.id AND mine.ended_at IS NULL AND mine.assigned_to_user_id=$1 LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id WHERE ${conditions} ORDER BY ${orderBy}`, values)).rows;
      return (await client.query(`SELECT ${fields} FROM tickets t LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id WHERE t.requester_user_id=$1 AND ${conditions} ORDER BY ${orderBy}`, values)).rows;
    });
  }

  async assignees(actor: Actor) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('SELECT DISTINCT u.id,u.display_name,u.email FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id JOIN users u ON u.id=m.user_id WHERE m.status=\'active\' AND r.code IN (\'EXPERT\',\'SUPERVISOR\',\'ORG_ADMIN\') ORDER BY u.display_name')).rows);
  }

  async tags(actor: Actor) { return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('SELECT id,name,color FROM ticket_tags ORDER BY name')).rows); }

  async createTag(actor: Actor, name: string, color = '#1769aa') {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('INSERT INTO ticket_tags(organization_id,name,color) VALUES($1,$2,$3) ON CONFLICT(organization_id,name) DO UPDATE SET color=EXCLUDED.color RETURNING id,name,color', [actor.organizationId,name,color])).rows[0]);
  }

  async watch(actor: Actor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => { await this.accessibleTicket(client, actor, ticketId); return (await client.query('INSERT INTO ticket_watchers(ticket_id,user_id,organization_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING ticket_id,user_id',[ticketId,actor.userId,actor.organizationId])).rows[0]; });
  }

  async linkTag(actor: Actor, ticketId: string, tagId: string) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ticket(client, ticketId);
      const tag = await client.query('SELECT id,name,color FROM ticket_tags WHERE id=$1', [tagId]);
      if (!tag.rowCount) throw new NotFoundException('Tag not found');
      await client.query('INSERT INTO ticket_tag_links(ticket_id,tag_id,organization_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [ticketId, tagId, actor.organizationId]);
      await this.activity(client, actor, ticketId, 'ticket.tagged', 'STAFF', { tagId });
      return tag.rows[0];
    });
  }

  async bulkStatus(actor: Actor, ticketIds: string[], status: TicketStatus) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    const outcomes: { id: string; ok: boolean }[] = [];
    for (const id of [...new Set(ticketIds)].slice(0, 100)) {
      try { await this.changeStatus(actor,id,status,'bulk operation'); outcomes.push({id,ok:true}); } catch { outcomes.push({id,ok:false}); }
    }
    return outcomes;
  }

  private async ticket(client: PoolClient, id: string) {
    const result = await client.query<{id:string;status:TicketStatus;requester_user_id:string}>('SELECT id,status,requester_user_id FROM tickets WHERE id=$1', [id]);
    if (!result.rows[0]) throw new NotFoundException('Ticket not found');
    return result.rows[0];
  }
  private async accessibleTicket(client: PoolClient, actor: Actor, id: string) {
    const ticket = await this.ticket(client, id);
    if (ticket.requester_user_id === actor.userId || actor.roles.some((role) => managerRoles.has(role))) return ticket;
    const assigned = await client.query('SELECT 1 FROM ticket_assignments WHERE ticket_id=$1 AND assigned_to_user_id=$2 AND ended_at IS NULL', [id, actor.userId]);
    if (assigned.rowCount) return ticket;
    throw new ForbiddenException();
  }
  private async activity(client: PoolClient, actor: Actor, ticketId: string, action: string, visibility: 'REQUESTER' | 'STAFF', metadata: object = {}) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,\'ticket\',$4,$5)', [actor.organizationId,actor.userId,action,ticketId,metadata]);
    await client.query('INSERT INTO ticket_activities(organization_id,ticket_id,actor_user_id,activity_type,visibility,metadata) VALUES($1,$2,$3,$4,$5,$6)', [actor.organizationId, ticketId, actor.userId, action, visibility, metadata]);
  }
}
