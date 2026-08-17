import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationService } from '../src/conversation/conversation.service.js';
import { DatabaseService } from '../src/database/database.service.js';
import { NotificationService, TicketNotification } from '../src/notifications/notification.service.js';
import { TicketService } from '../src/tickets/ticket.service.js';

const database = new DatabaseService();
const notifications = new NotificationService();
const conversations = new ConversationService(database, notifications);
const tickets = new TicketService(database);
let organizationId = '';
let otherOrganizationId = '';
let requesterId = '';
let expertId = '';
let managerId = '';
let ticketId = '';
const actor = (userId: string, roles: string[], org = organizationId) => ({ userId, organizationId: org, roles });

beforeAll(async () => {
  const organizations = await database.query<{id:string;slug:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2),($3,$4) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id,slug', ['goal5-test','GOAL 5 Test','goal5-other','GOAL 5 Other']);
  organizationId = organizations.rows.find((row) => row.slug === 'goal5-test')!.id;
  otherOrganizationId = organizations.rows.find((row) => row.slug === 'goal5-other')!.id;
  const users = await database.query<{id:string;email:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3),($4,$5,$3),($6,$7,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id,email', ['goal5-requester@jupiter.local','Goal 5 Requester','scrypt$AA$AA','goal5-expert@jupiter.local','Goal 5 Expert','goal5-manager@jupiter.local','Goal 5 Manager']);
  requesterId = users.rows.find((row) => row.email === 'goal5-requester@jupiter.local')!.id;
  expertId = users.rows.find((row) => row.email === 'goal5-expert@jupiter.local')!.id;
  managerId = users.rows.find((row) => row.email === 'goal5-manager@jupiter.local')!.id;
  await database.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2),($1,$3),($1,$4) ON CONFLICT DO NOTHING', [organizationId, requesterId, expertId, managerId]);
  await database.query('INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code=CASE m.user_id WHEN $2 THEN \'REQUESTER\' WHEN $3 THEN \'EXPERT\' ELSE \'ORG_ADMIN\' END WHERE m.organization_id=$1 AND m.user_id IN($2,$3,$4) ON CONFLICT DO NOTHING', [organizationId,requesterId,expertId,managerId]);
  const draft = await tickets.createDraft(actor(requesterId, ['REQUESTER']), { title: 'Conversation validation', description: 'Validate message privacy.' });
  ticketId = draft.id;
  await tickets.submit(actor(requesterId, ['REQUESTER']), ticketId);
  await tickets.assign(actor(managerId, ['ORG_ADMIN']), ticketId, expertId);
});

afterAll(async () => {
  await database.query('DELETE FROM ticket_internal_notes WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_messages WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_activities WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_assignments WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_status_transitions WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM tickets WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM organizations WHERE id IN($1,$2)', [organizationId,otherOrganizationId]);
  await database.query('DELETE FROM users WHERE email IN($1,$2,$3)', ['goal5-requester@jupiter.local','goal5-expert@jupiter.local','goal5-manager@jupiter.local']);
  await database.onModuleDestroy();
});

describe('ConversationService integration', () => {
  it('keeps internal notes secret, preserves append-only history, and routes SSE notifications only to authorized recipients', async () => {
    const requesterEvents: TicketNotification[] = [];
    const subscription = notifications.stream(organizationId, requesterId).subscribe(({ data }) => requesterEvents.push(data));
    try {
      const message = await conversations.addMessage(actor(requesterId, ['REQUESTER']), ticketId, 'Public requester message');
      expect((await conversations.listMessages(actor(expertId, ['EXPERT']), ticketId)).map((row) => row.id)).toContain(message.id);
      const note = await conversations.addNote(actor(expertId, ['EXPERT']), ticketId, 'Private routing detail');
      await expect(conversations.listNotes(actor(requesterId, ['REQUESTER']), ticketId)).rejects.toBeInstanceOf(ForbiddenException);
      expect((await conversations.listMessages(actor(requesterId, ['REQUESTER']), ticketId)).some((row) => row.body === 'Private routing detail')).toBe(false);
      const requesterTimeline = await conversations.timeline(actor(requesterId, ['REQUESTER']), ticketId);
      expect(requesterTimeline.some((row) => row.activity_type === 'ticket.internal_note_added')).toBe(false);
      expect(requesterTimeline.some((row) => row.actor_display_name === 'Goal 5 Requester')).toBe(true);
      expect((await conversations.listNotes(actor(managerId, ['ORG_ADMIN']), ticketId)).map((row) => row.id)).toContain(note.id);
      expect(requesterEvents.map((event) => event.type)).toEqual(['ticket.message_posted']);
      await expect(conversations.listMessages(actor(requesterId, ['REQUESTER'], otherOrganizationId), ticketId)).rejects.toBeInstanceOf(NotFoundException);
      await expect(database.withOrganization(organizationId, (client) => client.query('UPDATE ticket_internal_notes SET body=\'changed\' WHERE id=$1', [note.id]))).rejects.toThrow();
    } finally { subscription.unsubscribe(); }
  });
});
