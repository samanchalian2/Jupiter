import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { TicketActor } from '../tickets/ticket-actor.service.js';

const staffRoles = new Set(['ORG_ADMIN', 'SUPERVISOR', 'EXPERT']);
type Ticket = { id: string; requester_user_id: string };

@Injectable()
export class ConversationService {
  constructor(private readonly database: DatabaseService, private readonly notifications: NotificationService) {}

  async listMessages(actor: TicketActor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.accessibleTicket(client, actor, ticketId);
      return (await client.query('SELECT m.id,m.author_user_id,u.display_name AS author_display_name,m.body,m.created_at FROM ticket_messages m JOIN users u ON u.id=m.author_user_id WHERE m.ticket_id=$1 ORDER BY m.created_at,m.id', [ticketId])).rows;
    });
  }

  async addMessage(actor: TicketActor, ticketId: string, body: string) {
    this.validateBody(body);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const ticket = await this.accessibleTicket(client, actor, ticketId);
      const message = (await client.query('INSERT INTO ticket_messages(organization_id,ticket_id,author_user_id,body) VALUES($1,$2,$3,$4) RETURNING id,author_user_id,body,created_at', [actor.organizationId,ticketId,actor.userId,body.trim()])).rows[0];
      await this.activity(client, actor, ticketId, 'ticket.message_posted', 'REQUESTER');
      const recipients = await this.recipients(client, ticket, actor.userId, true);
      this.notifications.publish(actor.organizationId, recipients, { type: 'ticket.message_posted', ticketId, occurredAt: message.created_at.toISOString() });
      return message;
    });
  }

  async listNotes(actor: TicketActor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.staffTicket(client, actor, ticketId);
      return (await client.query('SELECT n.id,n.author_user_id,u.display_name AS author_display_name,n.body,n.created_at FROM ticket_internal_notes n JOIN users u ON u.id=n.author_user_id WHERE n.ticket_id=$1 ORDER BY n.created_at,n.id', [ticketId])).rows;
    });
  }

  async addNote(actor: TicketActor, ticketId: string, body: string) {
    this.validateBody(body);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const ticket = await this.staffTicket(client, actor, ticketId);
      const note = (await client.query('INSERT INTO ticket_internal_notes(organization_id,ticket_id,author_user_id,body) VALUES($1,$2,$3,$4) RETURNING id,author_user_id,body,created_at', [actor.organizationId,ticketId,actor.userId,body.trim()])).rows[0];
      await this.activity(client, actor, ticketId, 'ticket.internal_note_added', 'STAFF');
      const recipients = await this.recipients(client, ticket, actor.userId, false);
      this.notifications.publish(actor.organizationId, recipients, { type: 'ticket.internal_note_added', ticketId, occurredAt: note.created_at.toISOString() });
      return note;
    });
  }

  async timeline(actor: TicketActor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.accessibleTicket(client, actor, ticketId);
      const staff = actor.roles.some((role) => staffRoles.has(role));
      const visibility = staff ? [] : ['REQUESTER'];
      const query = staff
        ? 'SELECT id,actor_user_id,activity_type,visibility,metadata,created_at FROM ticket_activities WHERE ticket_id=$1 ORDER BY created_at,id'
        : 'SELECT id,actor_user_id,activity_type,visibility,metadata,created_at FROM ticket_activities WHERE ticket_id=$1 AND visibility=$2 ORDER BY created_at,id';
      return (await client.query(query, staff ? [ticketId] : [ticketId, visibility[0]])).rows;
    });
  }

  async unifiedTimeline(actor: TicketActor, ticketId: string) {
    const [activities,messages,notes] = await Promise.all([this.timeline(actor,ticketId),this.listMessages(actor,ticketId),actor.roles.some(role=>staffRoles.has(role)) ? this.listNotes(actor,ticketId) : Promise.resolve([])]);
    return [...activities.map((item:any)=>({...item,kind:'activity'})),...messages.map((item:any)=>({...item,kind:'message'})),...notes.map((item:any)=>({...item,kind:'note'}))].sort((a:any,b:any)=>String(a.created_at).localeCompare(String(b.created_at)));
  }

  private async accessibleTicket(client: PoolClient, actor: TicketActor, ticketId: string): Promise<Ticket> {
    const ticket = (await client.query<Ticket>('SELECT id,requester_user_id FROM tickets WHERE id=$1', [ticketId])).rows[0];
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.requester_user_id === actor.userId || actor.roles.some((role) => role === 'ORG_ADMIN' || role === 'SUPERVISOR')) return ticket;
    if (actor.roles.includes('EXPERT')) {
      const assignment = await client.query('SELECT 1 FROM ticket_assignments WHERE ticket_id=$1 AND assigned_to_user_id=$2 AND ended_at IS NULL', [ticketId, actor.userId]);
      if (assignment.rowCount) return ticket;
    }
    throw new ForbiddenException();
  }

  private async staffTicket(client: PoolClient, actor: TicketActor, ticketId: string) {
    if (!actor.roles.some((role) => staffRoles.has(role))) throw new ForbiddenException();
    return this.accessibleTicket(client, actor, ticketId);
  }

  private async recipients(client: PoolClient, ticket: Ticket, actorId: string, includeRequester: boolean) {
    const assignmentRows = await client.query<{assigned_to_user_id:string}>('SELECT assigned_to_user_id FROM ticket_assignments WHERE ticket_id=$1 AND ended_at IS NULL', [ticket.id]);
    return [actorId, ...assignmentRows.rows.map((row) => row.assigned_to_user_id), ...(includeRequester ? [ticket.requester_user_id] : [])];
  }

  private activity(client: PoolClient, actor: TicketActor, ticketId: string, activityType: string, visibility: 'REQUESTER' | 'STAFF') {
    return client.query('INSERT INTO ticket_activities(organization_id,ticket_id,actor_user_id,activity_type,visibility) VALUES($1,$2,$3,$4,$5)', [actor.organizationId,ticketId,actor.userId,activityType,visibility]);
  }

  private validateBody(body: string) {
    if (typeof body !== 'string' || body.trim().length < 1 || body.trim().length > 10000) throw new ForbiddenException('Message body must be between 1 and 10000 characters');
  }
}
