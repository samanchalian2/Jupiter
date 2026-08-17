import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentService } from '../src/attachments/attachment.service.js';
import { AttachmentStorage, StoredObject } from '../src/attachments/attachment-storage.js';
import { DatabaseService } from '../src/database/database.service.js';
import { TicketService } from '../src/tickets/ticket.service.js';

class FakeStorage implements AttachmentStorage {
  readonly objects = new Map<string, StoredObject>();
  async createUploadUrl(key: string) { return `https://storage.test/upload/${key}`; }
  async createDownloadUrl(key: string) { return `https://storage.test/download/${key}`; }
  async createViewUrl(key: string) { return `https://storage.test/view/${key}`; }
  async head(key: string) { return this.objects.get(key); }
}

const database = new DatabaseService();
const storage = new FakeStorage();
const attachments = new AttachmentService(database, storage);
const tickets = new TicketService(database);
let organizationId = '';
let otherOrganizationId = '';
let requesterId = '';
let expertId = '';
let managerId = '';
let ticketId = '';
const actor = (userId: string, roles: string[], organization = organizationId) => ({ userId, organizationId: organization, roles });

beforeAll(async () => {
  const organizations = await database.query<{id:string;slug:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2),($3,$4) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id,slug', ['goal6-test','GOAL 6 Test','goal6-other','GOAL 6 Other']);
  organizationId = organizations.rows.find((row) => row.slug === 'goal6-test')!.id;
  otherOrganizationId = organizations.rows.find((row) => row.slug === 'goal6-other')!.id;
  const users = await database.query<{id:string;email:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3),($4,$5,$3),($6,$7,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id,email', ['goal6-requester@jupiter.local','Goal 6 Requester','scrypt$AA$AA','goal6-expert@jupiter.local','Goal 6 Expert','goal6-manager@jupiter.local','Goal 6 Manager']);
  requesterId = users.rows.find((row) => row.email === 'goal6-requester@jupiter.local')!.id;
  expertId = users.rows.find((row) => row.email === 'goal6-expert@jupiter.local')!.id;
  managerId = users.rows.find((row) => row.email === 'goal6-manager@jupiter.local')!.id;
  await database.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2),($1,$3),($1,$4) ON CONFLICT DO NOTHING', [organizationId,requesterId,expertId,managerId]);
  await database.query('INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code=CASE m.user_id WHEN $2 THEN \'REQUESTER\' WHEN $3 THEN \'EXPERT\' ELSE \'ORG_ADMIN\' END WHERE m.organization_id=$1 AND m.user_id IN($2,$3,$4) ON CONFLICT DO NOTHING', [organizationId,requesterId,expertId,managerId]);
  const ticket = await tickets.createDraft(actor(requesterId, ['REQUESTER']), { title: 'Attachment validation', description: 'Validate safe media handling.' });
  ticketId = ticket.id;
  await tickets.submit(actor(requesterId, ['REQUESTER']), ticketId);
  await tickets.assign(actor(managerId, ['ORG_ADMIN']), ticketId, expertId);
});

afterAll(async () => {
  await database.query('DELETE FROM ticket_attachments WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_activities WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_assignments WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_status_transitions WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM tickets WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM organizations WHERE id IN($1,$2)', [organizationId,otherOrganizationId]);
  await database.query('DELETE FROM users WHERE email IN($1,$2,$3)', ['goal6-requester@jupiter.local','goal6-expert@jupiter.local','goal6-manager@jupiter.local']);
  await database.onModuleDestroy();
});

describe('AttachmentService integration', () => {
  it('requires authorized, allowlisted, size-matched uploads before issuing a secure download', async () => {
    await expect(attachments.requestUpload(actor(requesterId, ['REQUESTER']), ticketId, { filename: '../unsafe.exe', contentType: 'application/octet-stream', byteSize: 10 })).rejects.toBeInstanceOf(BadRequestException);
    const requested = await attachments.requestUpload(actor(requesterId, ['REQUESTER']), ticketId, { filename: 'report.pdf', contentType: 'application/pdf', byteSize: 48 });
    expect(requested.uploadUrl).toContain('/upload/organizations/');
    await expect(attachments.download(actor(requesterId, ['REQUESTER']), ticketId, requested.attachment.id)).rejects.toBeInstanceOf(NotFoundException);
    const pending = await database.withOrganization(organizationId, (client) => client.query<{storage_key:string}>('SELECT storage_key FROM ticket_attachments WHERE id=$1', [requested.attachment.id]));
    storage.objects.set(pending.rows[0].storage_key, { contentType: 'application/pdf', contentLength: 48 });
    const complete = await attachments.completeUpload(actor(expertId, ['EXPERT']), ticketId, requested.attachment.id);
    expect(complete.state).toBe('AVAILABLE');
    const download = await attachments.download(actor(requesterId, ['REQUESTER']), ticketId, requested.attachment.id);
    expect(download.downloadUrl).toContain('/download/organizations/');
    expect((await attachments.list(actor(expertId, ['EXPERT']), ticketId)).map((item) => item.id)).toContain(requested.attachment.id);
    await expect(attachments.list(actor(requesterId, ['REQUESTER'], otherOrganizationId), ticketId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects objects whose actual metadata differs from the approved upload request', async () => {
    const requested = await attachments.requestUpload(actor(requesterId, ['REQUESTER']), ticketId, { filename: 'image.png', contentType: 'image/png', byteSize: 20 });
    const pending = await database.withOrganization(organizationId, (client) => client.query<{storage_key:string}>('SELECT storage_key FROM ticket_attachments WHERE id=$1', [requested.attachment.id]));
    storage.objects.set(pending.rows[0].storage_key, { contentType: 'image/png', contentLength: 19 });
    await expect(attachments.completeUpload(actor(requesterId, ['REQUESTER']), ticketId, requested.attachment.id)).rejects.toBeInstanceOf(BadRequestException);
  });
});
