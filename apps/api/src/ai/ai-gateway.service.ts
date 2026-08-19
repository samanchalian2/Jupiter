import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { redactForAi } from './redactor.js';
import { AiProvider } from './ai-provider.js';
import { AiCredentialService } from './ai-credential.service.js';
import { aiProviderAllowedHosts } from '../config.js';

type Actor = { userId: string; organizationId: string; roles?: string[] };
const priorities = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

@Injectable()
export class AiGatewayService {
  constructor(private readonly database: DatabaseService, private readonly credentials: AiCredentialService) {}

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

  async configurePlatform(actorId: string, input: {
    organizationId: string;
    enabled: boolean;
    providerBaseUrl: string;
    analysisModel: string;
    transcriptionModel: string;
    apiKey?: string;
    removeApiKey?: boolean;
  }) {
    await this.platformAdmin(actorId);
    const providerBaseUrl = this.validProviderBaseUrl(input.providerBaseUrl);
    const analysisModel = this.validModel(input.analysisModel);
    const transcriptionModel = this.validModel(input.transcriptionModel);
    const apiKey = input.apiKey?.trim() || undefined;
    if (apiKey && input.removeApiKey) throw new BadRequestException('Choose either replacing or removing the API key');
    const encrypted = apiKey ? this.credentials.encrypt(apiKey) : undefined;
    const enabled = input.removeApiKey ? false : input.enabled;
    return this.database.withOrganization(input.organizationId, async (client) => {
      const existing = (await client.query<{ has_api_key: boolean }>(
        'SELECT api_key_ciphertext IS NOT NULL AS has_api_key FROM organization_ai_settings WHERE organization_id=$1',
        [input.organizationId],
      )).rows[0];
      const willHaveKey = input.removeApiKey ? false : Boolean(encrypted || existing?.has_api_key);
      if (enabled && !willHaveKey) throw new BadRequestException('An organization API key is required before AI can be enabled');
      const setting = (await client.query(
        `INSERT INTO organization_ai_settings(
           organization_id,enabled,model,provider_base_url,analysis_model,transcription_model,
           api_key_ciphertext,api_key_iv,api_key_auth_tag,updated_by_user_id
         ) VALUES($1,$2,$3,$4,$3,$5,$6,$7,$8,$9)
         ON CONFLICT(organization_id) DO UPDATE SET
           enabled=EXCLUDED.enabled,model=EXCLUDED.analysis_model,provider_base_url=EXCLUDED.provider_base_url,
           analysis_model=EXCLUDED.analysis_model,transcription_model=EXCLUDED.transcription_model,
           api_key_ciphertext=CASE WHEN $10 THEN NULL WHEN $6::bytea IS NOT NULL THEN $6 ELSE organization_ai_settings.api_key_ciphertext END,
           api_key_iv=CASE WHEN $10 THEN NULL WHEN $7::bytea IS NOT NULL THEN $7 ELSE organization_ai_settings.api_key_iv END,
           api_key_auth_tag=CASE WHEN $10 THEN NULL WHEN $8::bytea IS NOT NULL THEN $8 ELSE organization_ai_settings.api_key_auth_tag END,
           credential_version=CASE WHEN $10 OR $6::bytea IS NOT NULL THEN organization_ai_settings.credential_version+1 ELSE organization_ai_settings.credential_version END,
           updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()
         RETURNING organization_id AS "organizationId",enabled,provider_base_url AS "providerBaseUrl",
           analysis_model AS "analysisModel",transcription_model AS "transcriptionModel",
           api_key_ciphertext IS NOT NULL AS "hasApiKey",updated_at AS "updatedAt"`,
        [input.organizationId, enabled, analysisModel, providerBaseUrl, transcriptionModel,
          encrypted?.ciphertext ?? null, encrypted?.iv ?? null, encrypted?.authTag ?? null, actorId, Boolean(input.removeApiKey)],
      )).rows[0];
      await this.audit(client, { userId: actorId, organizationId: input.organizationId }, 'ai.settings_changed', 'organization', input.organizationId, {
        enabled,
        providerBaseUrl,
        analysisModel,
        transcriptionModel,
        credentialChanged: Boolean(encrypted),
        credentialRemoved: Boolean(input.removeApiKey),
      });
      return setting;
    });
  }

  async platformSettings(actorId: string) {
    await this.platformAdmin(actorId);
    return (await this.database.query(
      `SELECT o.id AS "organizationId",o.name,o.slug,COALESCE(s.enabled,false) AS enabled,
        COALESCE(s.provider_base_url,'https://api.openai.com/v1') AS "providerBaseUrl",
        COALESCE(s.analysis_model,s.model,'gpt-4.1-mini') AS "analysisModel",
        COALESCE(s.transcription_model,'gpt-4o-mini-transcribe') AS "transcriptionModel",
        (s.api_key_ciphertext IS NOT NULL) AS "hasApiKey",s.updated_at AS "updatedAt",
        COALESCE((SELECT count(*)::int FROM ai_requests r WHERE r.organization_id=o.id),0) AS "requestCount",
        COALESCE((SELECT sum(COALESCE((result.usage->>'inputTokens')::int,0)+COALESCE((result.usage->>'outputTokens')::int,0))::int FROM ai_results result WHERE result.organization_id=o.id),0) AS "tokenCount"
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
      const setting = (await this.database.query<{ provider_base_url: string; analysis_model: string; api_key_ciphertext: Buffer | null; api_key_iv: Buffer | null; api_key_auth_tag: Buffer | null }>(
        `SELECT provider_base_url,analysis_model,api_key_ciphertext,api_key_iv,api_key_auth_tag
         FROM organization_ai_settings WHERE organization_id=$1 AND enabled=true`, [request.organization_id],
      )).rows[0];
      if (!setting?.api_key_ciphertext || !setting.api_key_iv || !setting.api_key_auth_tag) throw new Error('AI configuration unavailable');
      const apiKey = this.credentials.decrypt({ ciphertext: setting.api_key_ciphertext, iv: setting.api_key_iv, authTag: setting.api_key_auth_tag });
      await this.database.withOrganization(request.organization_id, async (client) => { await client.query('UPDATE ai_requests SET status=\'RUNNING\' WHERE id=$1', [requestId]); });
      const answer = await provider.analyze({ promptVersion: request.prompt_version, text: request.redacted_input.text, configuration: { baseUrl: setting.provider_base_url, model: setting.analysis_model, apiKey } });
      await this.database.withOrganization(request.organization_id, async (client) => {
        await client.query('INSERT INTO ai_results(request_id,organization_id,output,usage,provider,model) VALUES($1,$2,$3,$4,\'openai-compatible\',$5)', [requestId, request.organization_id, answer.output, answer.usage, setting.analysis_model]);
        await client.query('UPDATE ai_requests SET status=\'SUCCEEDED\',completed_at=now() WHERE id=$1', [requestId]);
        await this.audit(client, { userId: '', organizationId: request.organization_id }, 'ai.completed', 'ai_request', requestId, { model: setting.analysis_model });
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
  private validModel(value: string) {
    const model = value?.trim();
    if (!model || !/^[a-zA-Z0-9._:/-]{1,160}$/.test(model)) throw new BadRequestException('Model identifier is invalid');
    return model;
  }
  private validProviderBaseUrl(value: string) {
    let url: URL;
    try { url = new URL(value); } catch { throw new BadRequestException('Provider base URL is invalid'); }
    if (url.username || url.password || url.search || url.hash || !['http:', 'https:'].includes(url.protocol)) throw new BadRequestException('Provider base URL is invalid');
    const host = url.hostname.toLowerCase();
    const loopback = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && loopback)) throw new BadRequestException('Provider base URL must use HTTPS');
    if (process.env.NODE_ENV === 'production' && !aiProviderAllowedHosts().has(host)) throw new BadRequestException('Provider host is not allowed');
    return url.toString().replace(/\/$/, '');
  }
  private async audit(client: { query: Function }, actor: Actor, action: string, targetType: string, targetId: string, metadata: object) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,NULLIF($2,\'\')::uuid,$3,$4,$5,$6)', [actor.organizationId, actor.userId, action, targetType, targetId, metadata]);
  }
}
