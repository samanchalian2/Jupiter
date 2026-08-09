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

  async list(actor: Actor) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      if (actor.roles.some((role) => managerRoles.has(role))) return (await client.query('SELECT id,ticket_number,title,status,priority,requester_user_id,created_at FROM tickets ORDER BY created_at DESC')).rows;
      if (actor.roles.includes('EXPERT')) return (await client.query('SELECT t.id,t.ticket_number,t.title,t.status,t.priority,t.requester_user_id,t.created_at FROM tickets t JOIN ticket_assignments a ON a.ticket_id=t.id AND a.ended_at IS NULL WHERE a.assigned_to_user_id=$1 ORDER BY t.created_at DESC', [actor.userId])).rows;
      return (await client.query('SELECT id,ticket_number,title,status,priority,requester_user_id,created_at FROM tickets WHERE requester_user_id=$1 ORDER BY created_at DESC', [actor.userId])).rows;
    });
  }

  async assignees(actor: Actor) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('SELECT DISTINCT u.id,u.display_name,u.email FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id JOIN users u ON u.id=m.user_id WHERE m.status=\'active\' AND r.code IN (\'EXPERT\',\'SUPERVISOR\',\'ORG_ADMIN\') ORDER BY u.display_name')).rows);
  }

  private async ticket(client: PoolClient, id: string) {
    const result = await client.query<{id:string;status:TicketStatus;requester_user_id:string}>('SELECT id,status,requester_user_id FROM tickets WHERE id=$1', [id]);
    if (!result.rows[0]) throw new NotFoundException('Ticket not found');
    return result.rows[0];
  }
  private async activity(client: PoolClient, actor: Actor, ticketId: string, action: string, visibility: 'REQUESTER' | 'STAFF', metadata: object = {}) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,\'ticket\',$4,$5)', [actor.organizationId,actor.userId,action,ticketId,metadata]);
    await client.query('INSERT INTO ticket_activities(organization_id,ticket_id,actor_user_id,activity_type,visibility,metadata) VALUES($1,$2,$3,$4,$5,$6)', [actor.organizationId, ticketId, actor.userId, action, visibility, metadata]);
  }
}
