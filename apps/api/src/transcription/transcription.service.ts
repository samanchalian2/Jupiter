import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { TranscriptionProvider } from './transcription-provider.js';

type Actor = { userId: string; organizationId: string };

@Injectable()
export class TranscriptionService {
  constructor(private readonly database: DatabaseService) {}

  async enqueue(actor: Actor, ticketId: string, attachmentId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const allowed = await client.query(
        `SELECT 1 FROM tickets t JOIN ticket_attachments a ON a.ticket_id=t.id
         WHERE t.id=$1 AND a.id=$2 AND t.requester_user_id=$3`,
        [ticketId, attachmentId, actor.userId],
      );
      if (!allowed.rowCount) throw new NotFoundException('Attachment not found');
      const job = (await client.query(
        `INSERT INTO transcription_jobs(organization_id,ticket_id,attachment_id,status)
         VALUES($1,$2,$3,'QUEUED') RETURNING id,status,attempts,created_at,updated_at`,
        [actor.organizationId, ticketId, attachmentId],
      )).rows[0];
      await this.audit(client, actor, 'transcription.requested', job.id, { ticketId, attachmentId });
      return job;
    });
  }

  async list(actor: Actor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ownedTicket(client, actor, ticketId);
      return (await client.query(
        `SELECT j.id,j.attachment_id,j.status,j.transcript,j.attempts,j.last_error,j.created_at,j.updated_at
         FROM transcription_jobs j WHERE j.ticket_id=$1 ORDER BY j.created_at DESC`,
        [ticketId],
      )).rows;
    });
  }

  async get(actor: Actor, ticketId: string, id: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ownedTicket(client, actor, ticketId);
      const result = await client.query('SELECT id,status,transcript,attempts,last_error,created_at,updated_at FROM transcription_jobs WHERE id=$1 AND ticket_id=$2', [id, ticketId]);
      if (!result.rowCount) throw new NotFoundException('Transcription job not found');
      return result.rows[0];
    });
  }

  async retry(actor: Actor, ticketId: string, id: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ownedTicket(client, actor, ticketId);
      const result = await client.query(
        `UPDATE transcription_jobs SET status='QUEUED',attempts=0,last_error=NULL,updated_at=now()
         WHERE id=$1 AND ticket_id=$2 AND status IN ('RETRY','DEAD_LETTER')
         RETURNING id,status,attempts,updated_at`,
        [id, ticketId],
      );
      if (!result.rowCount) throw new NotFoundException('Retryable transcription job not found');
      await this.audit(client, actor, 'transcription.retried', id, { ticketId });
      return result.rows[0];
    });
  }

  async process(organizationId: string, id: string, provider: TranscriptionProvider) {
    return this.database.withOrganization(organizationId, async (client) => {
      const job = (await client.query<{ id: string; attachment_id: string; attempts: number }>('SELECT id,attachment_id,attempts FROM transcription_jobs WHERE id=$1 AND status IN (\'QUEUED\',\'RETRY\')', [id])).rows[0];
      if (!job) throw new NotFoundException();
      await client.query('UPDATE transcription_jobs SET status=\'RUNNING\',attempts=attempts+1 WHERE id=$1', [id]);
      try {
        const result = await provider.transcribe({ attachmentId: job.attachment_id });
        const completed = (await client.query('UPDATE transcription_jobs SET status=\'SUCCEEDED\',transcript=$2,updated_at=now() WHERE id=$1 RETURNING id,status,transcript', [id, result.text])).rows[0];
        await this.audit(client, { userId: '', organizationId }, 'transcription.completed', id, {});
        return completed;
      } catch {
        const status = job.attempts + 1 >= 3 ? 'DEAD_LETTER' : 'RETRY';
        const failed = (await client.query('UPDATE transcription_jobs SET status=$2,last_error=\'provider failure\',updated_at=now() WHERE id=$1 RETURNING id,status,attempts,last_error', [id, status])).rows[0];
        await this.audit(client, { userId: '', organizationId }, 'transcription.failed', id, { status });
        return failed;
      }
    });
  }

  private async ownedTicket(client: { query: Function }, actor: Actor, ticketId: string) {
    const allowed = await client.query('SELECT 1 FROM tickets WHERE id=$1 AND requester_user_id=$2', [ticketId, actor.userId]);
    if (!allowed.rowCount) throw new NotFoundException('Ticket not found');
  }
  private async audit(client: { query: Function }, actor: Actor, action: string, targetId: string, metadata: object) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,NULLIF($2,\'\')::uuid,$3,\'transcription_job\',$4,$5)', [actor.organizationId, actor.userId, action, targetId, metadata]);
  }
}
