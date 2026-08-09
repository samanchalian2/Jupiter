import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { TicketActor } from '../tickets/ticket-actor.service.js';
import { AttachmentStorage } from './attachment-storage.js';

const allowedTypes = new Set(['application/pdf','text/plain','image/jpeg','image/png','image/webp','audio/mpeg','audio/ogg','audio/wav']);
const audioTypes = new Set(['audio/mpeg','audio/ogg','audio/wav']);
const maximumBytes = 50 * 1024 * 1024;
const standardMaximumBytes = 20 * 1024 * 1024;
type Ticket = { id: string; requester_user_id: string };

@Injectable()
export class AttachmentService {
  constructor(private readonly database: DatabaseService, @Inject('AttachmentStorage') private readonly storage: AttachmentStorage) {}

  async requestUpload(actor: TicketActor, ticketId: string, input: { filename: string; contentType: string; byteSize: number }) {
    this.validate(input);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.accessibleTicket(client, actor, ticketId);
      const id = randomUUID();
      const storageKey = `organizations/${actor.organizationId}/tickets/${ticketId}/${id}`;
      const attachment = (await client.query('INSERT INTO ticket_attachments(id,organization_id,ticket_id,uploaded_by_user_id,storage_key,original_filename,content_type,byte_size) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,original_filename,content_type,byte_size,state,created_at', [id,actor.organizationId,ticketId,actor.userId,storageKey,input.filename.trim(),input.contentType,input.byteSize])).rows[0];
      const uploadUrl = await this.storage.createUploadUrl(storageKey, input.contentType, 300);
      return { attachment, uploadUrl, expiresInSeconds: 300 };
    });
  }

  async completeUpload(actor: TicketActor, ticketId: string, attachmentId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.accessibleTicket(client, actor, ticketId);
      const attachment = await this.pendingAttachment(client, ticketId, attachmentId);
      const object = await this.storage.head(attachment.storage_key);
      if (!object || object.contentLength !== Number(attachment.byte_size) || object.contentType?.toLowerCase() !== attachment.content_type.toLowerCase()) {
        await client.query('UPDATE ticket_attachments SET state=\'REJECTED\' WHERE id=$1', [attachmentId]);
        throw new BadRequestException('Uploaded file does not match the approved media metadata');
      }
      const result = await client.query('UPDATE ticket_attachments SET state=\'AVAILABLE\',available_at=now() WHERE id=$1 RETURNING id,original_filename,content_type,byte_size,state,created_at,available_at', [attachmentId]);
      await client.query('INSERT INTO ticket_activities(organization_id,ticket_id,actor_user_id,activity_type,visibility,metadata) VALUES($1,$2,$3,\'ticket.attachment_available\',\'REQUESTER\',$4)', [actor.organizationId,ticketId,actor.userId,{ attachmentId }]);
      return result.rows[0];
    });
  }

  async list(actor: TicketActor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.accessibleTicket(client, actor, ticketId);
      return (await client.query('SELECT id,original_filename,content_type,byte_size,state,uploaded_by_user_id,created_at,available_at FROM ticket_attachments WHERE ticket_id=$1 AND state=\'AVAILABLE\' ORDER BY created_at,id', [ticketId])).rows;
    });
  }

  async download(actor: TicketActor, ticketId: string, attachmentId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.accessibleTicket(client, actor, ticketId);
      const result = await client.query<{storage_key:string;original_filename:string}>('SELECT storage_key,original_filename FROM ticket_attachments WHERE id=$1 AND ticket_id=$2 AND state=\'AVAILABLE\'', [attachmentId,ticketId]);
      if (!result.rows[0]) throw new NotFoundException('Attachment not found');
      return { downloadUrl: await this.storage.createDownloadUrl(result.rows[0].storage_key, result.rows[0].original_filename, 300), expiresInSeconds: 300 };
    });
  }

  private async pendingAttachment(client: PoolClient, ticketId: string, attachmentId: string) {
    const result = await client.query<{storage_key:string;byte_size:string;content_type:string}>('SELECT storage_key,byte_size,content_type FROM ticket_attachments WHERE id=$1 AND ticket_id=$2 AND state=\'PENDING\'', [attachmentId,ticketId]);
    if (!result.rows[0]) throw new NotFoundException('Pending attachment not found');
    return result.rows[0];
  }

  private async accessibleTicket(client: PoolClient, actor: TicketActor, ticketId: string): Promise<Ticket> {
    const ticket = (await client.query<Ticket>('SELECT id,requester_user_id FROM tickets WHERE id=$1', [ticketId])).rows[0];
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.requester_user_id === actor.userId || actor.roles.some((role) => role === 'ORG_ADMIN' || role === 'SUPERVISOR')) return ticket;
    if (actor.roles.includes('EXPERT') && (await client.query('SELECT 1 FROM ticket_assignments WHERE ticket_id=$1 AND assigned_to_user_id=$2 AND ended_at IS NULL', [ticketId, actor.userId])).rowCount) return ticket;
    throw new ForbiddenException();
  }

  private validate(input: { filename: string; contentType: string; byteSize: number }) {
    if (typeof input.filename !== 'string' || !input.filename.trim() || input.filename.length > 255 || /[\\/\u0000-\u001f]/.test(input.filename)) throw new BadRequestException('Invalid filename');
    if (!allowedTypes.has(input.contentType)) throw new BadRequestException('Unsupported media type');
    if (!Number.isInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > maximumBytes || (!audioTypes.has(input.contentType) && input.byteSize > standardMaximumBytes)) throw new BadRequestException('Invalid file size');
  }
}
