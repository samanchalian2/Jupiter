import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { redactForAi } from './redactor.js';
import { AiProvider } from './ai-provider.js';

@Injectable()
export class AiGatewayService {
 constructor(private readonly database: DatabaseService) {}
 async enqueue(actor: {userId:string;organizationId:string;roles:string[]}, ticketId: string, text: string) {
  return this.database.withOrganization(actor.organizationId, async (client) => {
   const enabled=(await client.query<{enabled:boolean}>('SELECT enabled FROM organization_ai_settings WHERE organization_id=$1',[actor.organizationId])).rows[0]?.enabled;
   if (!enabled) throw new ForbiddenException('AI is not enabled for this organization');
   const request=(await client.query('INSERT INTO ai_requests(organization_id,ticket_id,status,prompt_version,redacted_input,created_by_user_id) VALUES($1,$2,\'QUEUED\',\'v1\',$3,$4) RETURNING id,status,prompt_version,created_at',[actor.organizationId,ticketId,{text:redactForAi(text)},actor.userId])).rows[0];
   await client.query('INSERT INTO outbox_events(organization_id,topic,payload) VALUES($1,\'ai.requested\',$2)',[actor.organizationId,{requestId:request.id}]);
   return request;
  });
 }
 async configurePlatform(actorId: string, organizationId: string, enabled: boolean, model: string) {
  const admin=(await this.database.query<{is_platform_admin:boolean}>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true',[actorId])).rows[0]?.is_platform_admin;
  if (!admin) throw new ForbiddenException();
  return this.database.withOrganization(organizationId, async client => (await client.query('INSERT INTO organization_ai_settings(organization_id,enabled,model,updated_by_user_id) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id) DO UPDATE SET enabled=EXCLUDED.enabled,model=EXCLUDED.model,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now() RETURNING organization_id,enabled,model,updated_at',[organizationId,enabled,model,actorId])).rows[0]);
 }
 async process(requestId: string, provider: AiProvider) {
  const request=(await this.database.query<{id:string;organization_id:string;redacted_input:{text:string};prompt_version:string}>('SELECT id,organization_id,redacted_input,prompt_version FROM ai_requests WHERE id=$1 AND status=\'QUEUED\'',[requestId])).rows[0];
  if (!request) return;
  try {
   const setting=(await this.database.query<{model:string}>('SELECT model FROM organization_ai_settings WHERE organization_id=$1',[request.organization_id])).rows[0];
   if (!setting) throw new Error('AI configuration unavailable');
   await this.database.withOrganization(request.organization_id, async client => { await client.query('UPDATE ai_requests SET status=\'RUNNING\' WHERE id=$1',[requestId]); });
   const answer=await provider.analyze({promptVersion:request.prompt_version,text:request.redacted_input.text,model:setting.model});
   await this.database.withOrganization(request.organization_id, async client => { await client.query('INSERT INTO ai_results(request_id,organization_id,output,usage,provider,model) VALUES($1,$2,$3,$4,\'configured\',$5)',[requestId,request.organization_id,answer.output,answer.usage,setting.model]); await client.query('UPDATE ai_requests SET status=\'SUCCEEDED\',completed_at=now() WHERE id=$1',[requestId]); });
  } catch { await this.database.withOrganization(request.organization_id, async client => { await client.query('UPDATE ai_requests SET status=\'FAILED\',completed_at=now() WHERE id=$1',[requestId]); }); }
 }
}
