import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { redactForAi } from './redactor.js';
import { AiProvider } from './ai-provider.js';

type Actor = { userId: string; organizationId: string; roles?: string[] };
const priorities = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

@Injectable()
export class AiGatewayService {
  constructor(private readonly database: DatabaseService) {}

  async enqueue(actor: Actor, ticketId: string, text: string) {
    if (text.trim().length < 3 || text.length > 20_000) throw new BadRequestException('AI input is invalid');
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const ticket = await client.query('SELECT 1 FROM tickets WHERE id=$1 AND requester_user_id=$2', [ticketId, actor.userId]);
      if (!ticket.rowCount) throw new NotFoundException('Ticket not found');
      const enabled = (await client.query<{ enabled: boolean }>('SELECT enabled FROM organization_ai_settings WHERE organization_id=$1', [actor.organizationId])).rows[0]?.enabled;
      if (!enabled) throw new ForbiddenException('AI is not enabled for this organization');
      const request = (await client.query<{ id: string; status: string; prompt_version: string; created_at: Date }>(
        `INSERT INTO ai_requests(organization_id,ticket_id,status,prompt_version,redacted_input,created_by_user_id)
         VALUES($1,$2,'QUEUED','v1',$3,$4) RETURNING id,status,prompt_version,created_at`,
        [actor.organizationId, ticketId, { text: redactForAi(text) }, actor.userId],
      )).rows[0];
      await client.query('INSERT INTO outbox_events(organization_id,topic,payload) VALUES($1,\'ai.requested\',$2)', [actor.organizationId, { requestId: request.id }]);
      await this.audit(client, actor, 'ai.requested', 'ai_request', request.id, { ticketId });
      return request;
    });
  }

  async configurePlatform(actorId: string, organizationId: string, enabled: boolean, model: string) {
    await this.platformAdmin(actorId);
    if (!/^[a-zA-Z0-9._-]{1,120}$/.test(model)) throw new BadRequestException('Model identifier is invalid');
    return this.database.withOrganization(organizationId, async (client) => {
      const setting = (await client.query(
        `INSERT INTO organization_ai_settings(organization_id,enabled,model,updated_by_user_id)
         VALUES($1,$2,$3,$4)
         ON CONFLICT(organization_id) DO UPDATE SET enabled=EXCLUDED.enabled,model=EXCLUDED.model,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()
         RETURNING organization_id,enabled,model,updated_at`,
        [organizationId, enabled, model, actorId],
      )).rows[0];
      await this.audit(client, { userId: actorId, organizationId }, 'ai.settings_changed', 'organization', organizationId, { enabled, model });
      return setting;
    });
  }

  async platformSettings(actorId: string) {
    await this.platformAdmin(actorId);
    return (await this.database.query(
      `SELECT o.id AS organization_id,o.name,o.slug,COALESCE(s.enabled,false) AS enabled,
        COALESCE(s.model,'gpt-4.1-mini') AS model,s.updated_at,
        COALESCE((SELECT count(*)::int FROM ai_requests r WHERE r.organization_id=o.id),0) AS request_count,
        COALESCE((SELECT sum(COALESCE((result.usage->>'inputTokens')::int,0)+COALESCE((result.usage->>'outputTokens')::int,0))::int FROM ai_results result WHERE result.organization_id=o.id),0) AS token_count
       FROM organizations o LEFT JOIN organization_ai_settings s ON s.organization_id=o.id ORDER BY o.name`,
    )).rows;
  }

  async platformAudit(actorId: string) {
    await this.platformAdmin(actorId);
    return (await this.database.query(
      `SELECT audit.id,audit.organization_id,o.name AS organization_name,audit.action,audit.target_type,audit.target_id,audit.metadata,audit.created_at,u.display_name AS actor_display_name
       FROM audit_logs audit LEFT JOIN organizations o ON o.id=audit.organization_id LEFT JOIN users u ON u.id=audit.actor_user_id
       WHERE audit.action LIKE 'ai.%' OR audit.action LIKE 'transcription.%'
       ORDER BY audit.created_at DESC LIMIT 100`,
    )).rows;
  }

  async process(requestId: string, provider: AiProvider) {
    const request = (await this.database.query<{ id: string; organization_id: string; redacted_input: { text: string }; prompt_version: string }>('SELECT id,organization_id,redacted_input,prompt_version FROM ai_requests WHERE id=$1 AND status=\'QUEUED\'', [requestId])).rows[0];
    if (!request) return;
    try {
      const setting = (await this.database.query<{ model: string }>('SELECT model FROM organization_ai_settings WHERE organization_id=$1', [request.organization_id])).rows[0];
      if (!setting) throw new Error('AI configuration unavailable');
      await this.database.withOrganization(request.organization_id, async (client) => { await client.query('UPDATE ai_requests SET status=\'RUNNING\' WHERE id=$1', [requestId]); });
      const answer = await provider.analyze({ promptVersion: request.prompt_version, text: request.redacted_input.text, model: setting.model });
      await this.database.withOrganization(request.organization_id, async (client) => {
        await client.query('INSERT INTO ai_results(request_id,organization_id,output,usage,provider,model) VALUES($1,$2,$3,$4,\'configured\',$5)', [requestId, request.organization_id, answer.output, answer.usage, setting.model]);
        await client.query('UPDATE ai_requests SET status=\'SUCCEEDED\',completed_at=now() WHERE id=$1', [requestId]);
        await this.audit(client, { userId: '', organizationId: request.organization_id }, 'ai.completed', 'ai_request', requestId, { model: setting.model });
      });
    } catch {
      await this.database.withOrganization(request.organization_id, async (client) => {
        await client.query('UPDATE ai_requests SET status=\'FAILED\',completed_at=now() WHERE id=$1', [requestId]);
        await this.audit(client, { userId: '', organizationId: request.organization_id }, 'ai.failed', 'ai_request', requestId, {});
      });
    }
  }

  async requests(actor: Actor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ownedTicket(client, actor, ticketId);
      return (await client.query(
        `SELECT r.id,r.status,r.prompt_version,r.redacted_input,r.created_at,r.completed_at,
          result.output,result.usage,result.provider,result.model
         FROM ai_requests r LEFT JOIN ai_results result ON result.request_id=r.id
         WHERE r.ticket_id=$1 AND r.created_by_user_id=$2 ORDER BY r.created_at DESC`,
        [ticketId, actor.userId],
      )).rows;
    });
  }

  async review(actor: Actor, requestId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const result = await client.query(
        `SELECT r.id,r.status,r.redacted_input,result.output,result.usage,result.provider,result.model
         FROM ai_requests r LEFT JOIN ai_results result ON result.request_id=r.id
         WHERE r.id=$1 AND r.created_by_user_id=$2`,
        [requestId, actor.userId],
      );
      if (!result.rowCount) throw new NotFoundException('AI request not found');
      return result.rows[0];
    });
  }

  async confirm(actor: Actor, requestId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const row = (await client.query<{ ticket_id: string; output: { title?: string; normalizedDescription?: string; priority?: string } }>(
        `SELECT r.ticket_id,result.output FROM ai_requests r JOIN ai_results result ON result.request_id=r.id
         WHERE r.id=$1 AND r.created_by_user_id=$2 AND r.status='SUCCEEDED'`,
        [requestId, actor.userId],
      )).rows[0];
      if (!row) throw new ForbiddenException();
      const priority = row.output.priority && priorities.has(row.output.priority) ? row.output.priority : null;
      await client.query('UPDATE tickets SET title=COALESCE($1,title),description=COALESCE($2,description),priority=COALESCE($3,priority),updated_at=now() WHERE id=$4 AND requester_user_id=$5', [row.output.title ?? null, row.output.normalizedDescription ?? null, priority, row.ticket_id, actor.userId]);
      await this.audit(client, actor, 'ai.confirmed', 'ai_request', requestId, { ticketId: row.ticket_id });
      return { confirmed: true };
    });
  }

  private async ownedTicket(client: { query: Function }, actor: Actor, ticketId: string) {
    const ticket = await client.query('SELECT 1 FROM tickets WHERE id=$1 AND requester_user_id=$2', [ticketId, actor.userId]);
    if (!ticket.rowCount) throw new NotFoundException('Ticket not found');
  }
  private async platformAdmin(userId: string) {
    const admin = (await this.database.query<{ is_platform_admin: boolean }>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId])).rows[0]?.is_platform_admin;
    if (!admin) throw new ForbiddenException();
  }
  private async audit(client: { query: Function }, actor: Actor, action: string, targetType: string, targetId: string, metadata: object) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,NULLIF($2,\'\')::uuid,$3,$4,$5,$6)', [actor.organizationId, actor.userId, action, targetType, targetId, metadata]);
  }
}
