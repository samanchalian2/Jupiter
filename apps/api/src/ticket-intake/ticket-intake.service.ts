import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiCredentialService } from '../ai/ai-credential.service.js';
import { redactForAi } from '../ai/redactor.js';
import { AttachmentService } from '../attachments/attachment.service.js';
import type { AttachmentStorage, StoredObject } from '../attachments/attachment-storage.js';
import { DatabaseService } from '../database/database.service.js';
import type { TicketActor } from '../tickets/ticket-actor.service.js';
import { TicketService, type CreateDraftData } from '../tickets/ticket.service.js';
import type { TranscriptionProvider } from '../transcription/transcription-provider.js';
import { TICKET_INTAKE_CONTRACT_VERSION, type IntakeCustomFieldDefinition, type TicketIntakeContext, type TicketIntakeProvider, type TicketIntakeProviderOutput } from './ticket-intake-provider.js';

const allowedVoiceTypes = new Set(['audio/webm','audio/ogg','audio/wav','audio/mpeg','audio/mp4','video/mp4']);
const voiceExtensions: Record<string,string> = { 'audio/webm':'webm','audio/ogg':'ogg','audio/wav':'wav','audio/mpeg':'mp3','audio/mp4':'mp4','video/mp4':'mp4' };
const maximumVoiceBytes = 10 * 1024 * 1024;
const confidenceThreshold = 0.75;
const priorities = new Set(['LOW','NORMAL','HIGH','URGENT']);
const processingStates = new Set(['UPLOADING','TRANSCRIBING','ANALYZING']);

type IntakeRow = {
  id:string; organization_id:string; created_by_user_id:string; status:string; source_description:string;
  transcript:string|null; combined_description:string|null; analysis_contract_version:string; analysis_result:Record<string,unknown>|null;
  provider_usage:Record<string,unknown>; missing_fields:string[]; confidence_by_field:Record<string,number>; rejected_fields:string[];
  voice_storage_key:string|null; voice_original_filename:string|null; voice_content_type:string|null; voice_byte_size:string|null;
  voice_duration_seconds:string|null; voice_verified_at:Date|null; attempt_count:number; last_error_code:string|null; ticket_id:string|null;
  expires_at:Date; consumed_at:Date|null; created_at:Date; updated_at:Date;
};

type ProviderConfigurationRow = {
  provider_base_url:string; analysis_model:string; transcription_model:string;
  api_key_ciphertext:Buffer; api_key_iv:Buffer; api_key_auth_tag:Buffer;
};

@Injectable()
export class TicketIntakeService {
  constructor(
    private readonly database: DatabaseService,
    private readonly tickets: TicketService,
    private readonly attachments: AttachmentService,
    private readonly credentials: AiCredentialService,
    @Inject('AttachmentStorage') private readonly storage: AttachmentStorage,
  ) {}

  async create(actor: TicketActor, input: { description?:string; idempotencyKey?:string }) {
    const description = input.description?.trim() ?? '';
    if (description.length > 10_000) throw new BadRequestException('Ticket intake description is too long');
    const idempotencyKey = input.idempotencyKey?.trim() || null;
    if (idempotencyKey && !/^[a-zA-Z0-9._:-]{8,120}$/.test(idempotencyKey)) throw new BadRequestException('Idempotency key is invalid');
    const row = await this.database.withOrganization(actor.organizationId, async (client) => (await client.query<IntakeRow>(
      `INSERT INTO ticket_intake_sessions(organization_id,created_by_user_id,source_description,combined_description,idempotency_key)
       VALUES($1,$2,$3,$3,$4)
       ON CONFLICT(organization_id,created_by_user_id,idempotency_key) DO UPDATE SET updated_at=ticket_intake_sessions.updated_at
       RETURNING *`, [actor.organizationId,actor.userId,description,idempotencyKey],
    )).rows[0]);
    return this.present(row);
  }

  async get(actor: TicketActor, id: string) {
    const row = await this.database.withOrganization(actor.organizationId, (client) => this.owned(client, actor, id));
    return this.present(row);
  }

  async requestVoiceUpload(actor: TicketActor, id: string, input: { filename:string; contentType:string; byteSize:number; durationSeconds:number }) {
    this.validateVoice(input);
    const storageKey = `organizations/${actor.organizationId}/ticket-intakes/${id}/${randomUUID()}.${voiceExtensions[input.contentType]}`;
    const durationMetadata = this.durationMetadata(input.durationSeconds);
    const result = await this.database.withOrganization(actor.organizationId, async (client) => {
      const session = await this.owned(client, actor, id, true);
      this.assertMutable(session);
      if (session.status === 'TRANSCRIBING' || session.status === 'ANALYZING') throw new BadRequestException('Ticket intake is being processed');
      const uploadUrl = await this.storage.createUploadUrl(storageKey,input.contentType,300,{ 'duration-seconds':durationMetadata });
      const row = (await client.query<IntakeRow>(
        `UPDATE ticket_intake_sessions SET status='UPLOADING',voice_storage_key=$2,voice_original_filename=$3,
          voice_content_type=$4,voice_byte_size=$5,voice_duration_seconds=$6,transcript=NULL,combined_description=source_description,
          analysis_result=NULL,provider_usage='{}'::jsonb,missing_fields='[]'::jsonb,confidence_by_field='{}'::jsonb,
          rejected_fields='[]'::jsonb,voice_verified_at=NULL,attempt_count=0,last_error_code=NULL,processing_started_at=NULL,next_attempt_at=NULL,updated_at=now()
         WHERE id=$1 RETURNING *`, [id,storageKey,input.filename.trim(),input.contentType,input.byteSize,input.durationSeconds],
      )).rows[0];
      return { row, oldStorageKey:session.voice_storage_key, uploadUrl };
    });
    if (result.oldStorageKey && result.oldStorageKey !== storageKey) await this.storage.delete(result.oldStorageKey).catch(() => undefined);
    return { session:this.present(result.row), uploadUrl:result.uploadUrl, expiresInSeconds:300, requiredHeaders:{ 'Content-Type':input.contentType, 'x-amz-meta-duration-seconds':durationMetadata } };
  }

  async completeVoiceUpload(actor: TicketActor, id: string) {
    const result = await this.database.withOrganization(actor.organizationId, async (client) => {
      const session = await this.owned(client, actor, id, true);
      this.assertMutable(session);
      if (session.status !== 'UPLOADING' || !session.voice_storage_key || !session.voice_content_type || !session.voice_byte_size || !session.voice_duration_seconds) throw new BadRequestException('No pending voice upload exists');
      const object = await this.storage.head(session.voice_storage_key);
      const matches = this.voiceObjectMatches(session,object);
      if (!matches) {
        await client.query("UPDATE ticket_intake_sessions SET status='FAILED',last_error_code='voice_metadata_mismatch',updated_at=now() WHERE id=$1",[id]);
        return { error:true as const };
      }
      const row = (await client.query<IntakeRow>("UPDATE ticket_intake_sessions SET status='READY',voice_verified_at=now(),last_error_code=NULL,updated_at=now() WHERE id=$1 RETURNING *",[id])).rows[0];
      return { error:false as const, row };
    });
    if (result.error) throw new BadRequestException('Uploaded voice does not match the approved metadata');
    return this.present(result.row);
  }

  async discardVoice(actor: TicketActor, id: string) {
    const session = await this.database.withOrganization(actor.organizationId, (client) => this.owned(client,actor,id));
    this.assertMutable(session);
    if (processingStates.has(session.status)) throw new BadRequestException('Ticket intake is being processed');
    if (session.voice_storage_key) await this.storage.delete(session.voice_storage_key);
    const row = await this.database.withOrganization(actor.organizationId, async (client) => (await client.query<IntakeRow>(
      `UPDATE ticket_intake_sessions SET status='CREATED',voice_storage_key=NULL,voice_original_filename=NULL,
       voice_content_type=NULL,voice_byte_size=NULL,voice_duration_seconds=NULL,voice_verified_at=NULL,transcript=NULL,combined_description=source_description,
       analysis_result=NULL,provider_usage='{}'::jsonb,missing_fields='[]'::jsonb,confidence_by_field='{}'::jsonb,rejected_fields='[]'::jsonb,
       attempt_count=0,last_error_code=NULL,processing_started_at=NULL,next_attempt_at=NULL,updated_at=now()
       WHERE id=$1 AND created_by_user_id=$2 RETURNING *`, [id,actor.userId],
    )).rows[0]);
    if (!row) throw new NotFoundException('Ticket intake not found');
    return this.present(row);
  }

  async analyze(actor: TicketActor, id: string) {
    const row = await this.database.withOrganization(actor.organizationId, async (client) => {
      const session = await this.owned(client, actor, id, true);
      this.assertMutable(session);
      if (session.status === 'SUCCEEDED' || session.status === 'TRANSCRIBING' || session.status === 'ANALYZING') return session;
      if (session.status === 'UPLOADING') throw new BadRequestException('Voice upload must be completed first');
      if (session.voice_storage_key && !session.voice_verified_at) throw new BadRequestException('Voice upload must be verified first');
      if (!session.source_description.trim() && !session.voice_storage_key) throw new BadRequestException('Text or voice input is required');
      const configured = (await client.query<{configured:boolean}>(
        'SELECT enabled AND api_key_ciphertext IS NOT NULL AS configured FROM organization_ai_settings WHERE organization_id=$1', [actor.organizationId],
      )).rows[0]?.configured;
      if (!configured) throw new ForbiddenException('AI is not configured for this organization');
      const status = session.voice_storage_key && !session.transcript ? 'TRANSCRIBING' : 'ANALYZING';
      const updated = (await client.query<IntakeRow>(
        `UPDATE ticket_intake_sessions SET status=$2,attempt_count=0,last_error_code=NULL,processing_started_at=NULL,
         next_attempt_at=now(),analysis_result=NULL,provider_usage='{}'::jsonb,missing_fields='[]'::jsonb,
         confidence_by_field='{}'::jsonb,rejected_fields='[]'::jsonb,updated_at=now() WHERE id=$1 RETURNING *`, [id,status],
      )).rows[0];
      await client.query("INSERT INTO outbox_events(organization_id,topic,payload) VALUES($1,'ticket_intake.process',$2)",[actor.organizationId,{sessionId:id}]);
      await this.audit(client,actor,'ticket_intake.analysis_requested',id,{hasVoice:Boolean(session.voice_storage_key)});
      return updated;
    });
    return this.present(row);
  }

  async pending(limit=10) {
    return (await this.database.query<{id:string;organization_id:string}>(
      `SELECT id,organization_id FROM ticket_intake_sessions
       WHERE status IN ('TRANSCRIBING','ANALYZING') AND (next_attempt_at IS NULL OR next_attempt_at<=now())
       AND (processing_started_at IS NULL OR processing_started_at<now()-interval '5 minutes')
       ORDER BY updated_at LIMIT $1`, [Math.min(100,Math.max(1,limit))],
    )).rows;
  }

  async process(organizationId:string, id:string, aiProvider:TicketIntakeProvider, transcriptionProvider:TranscriptionProvider) {
    let stage = '';
    try {
      const claimed = await this.database.withOrganization(organizationId, async (client) => (await client.query<IntakeRow>(
        `UPDATE ticket_intake_sessions SET processing_started_at=now(),attempt_count=attempt_count+1,updated_at=now()
         WHERE id=$1 AND status IN ('TRANSCRIBING','ANALYZING') AND expires_at>now()
         AND (next_attempt_at IS NULL OR next_attempt_at<=now())
         AND (processing_started_at IS NULL OR processing_started_at<now()-interval '5 minutes') RETURNING *`, [id],
      )).rows[0]);
      if (!claimed) return;
      stage = claimed.status;
      const configuration = await this.configuration(organizationId);
      let description = claimed.combined_description ?? claimed.source_description;
      if (stage === 'TRANSCRIBING') {
        if (!claimed.voice_storage_key || !claimed.voice_content_type || !claimed.voice_original_filename || !claimed.voice_verified_at) throw new Error('voice_unavailable');
        if (!this.voiceObjectMatches(claimed,await this.storage.head(claimed.voice_storage_key))) throw new Error('voice_metadata_mismatch');
        const bytes = await this.storage.read(claimed.voice_storage_key);
        if (!bytes.length || bytes.length > maximumVoiceBytes) throw new Error('voice_content_invalid');
        const audioBuffer=new ArrayBuffer(bytes.byteLength); new Uint8Array(audioBuffer).set(bytes);
        const transcription = await transcriptionProvider.transcribe({
          audio:new Blob([audioBuffer],{type:claimed.voice_content_type}), filename:claimed.voice_original_filename,
          configuration:{baseUrl:configuration.provider_base_url,apiKey:configuration.apiKey,model:configuration.transcription_model},
        });
        const transcript = transcription.text.trim().slice(0,20_000);
        description = this.combine(claimed.source_description,transcript);
        await this.database.withOrganization(organizationId, async (client) => {
          await client.query(
            `UPDATE ticket_intake_sessions SET status='ANALYZING',transcript=$2,combined_description=$3,
             attempt_count=1,processing_started_at=now(),next_attempt_at=NULL,last_error_code=NULL,updated_at=now() WHERE id=$1`, [id,transcript,description],
          );
        });
        stage = 'ANALYZING';
      }
      const context = await this.context(organizationId,description);
      const answer = await aiProvider.analyzeIntake({ context, configuration:{baseUrl:configuration.provider_base_url,apiKey:configuration.apiKey,model:configuration.analysis_model} });
      const validated = this.validateAnalysis(answer.output,context);
      await this.database.withOrganization(organizationId, async (client) => {
        await client.query(
          `UPDATE ticket_intake_sessions SET status='SUCCEEDED',analysis_contract_version=$2,analysis_result=$3,provider_usage=$4,missing_fields=$5,
           confidence_by_field=$6,rejected_fields=$7,attempt_count=0,processing_started_at=NULL,next_attempt_at=NULL,last_error_code=NULL,updated_at=now()
           WHERE id=$1`, [id,TICKET_INTAKE_CONTRACT_VERSION,validated.result,answer.usage,JSON.stringify(validated.missingFields),validated.confidenceByField,JSON.stringify(validated.rejectedFields)],
        );
        await client.query("UPDATE outbox_events SET processed_at=now() WHERE topic='ticket_intake.process' AND payload->>'sessionId'=$1 AND processed_at IS NULL",[id]);
        await this.audit(client,{userId:'',organizationId},'ticket_intake.succeeded',id,{contractVersion:TICKET_INTAKE_CONTRACT_VERSION});
      });
    } catch (error) {
      if (stage) await this.recordFailure(organizationId,id,stage,error);
    }
  }

  async createDraft(actor:TicketActor, data:CreateDraftData & { intakeSessionId?:string }) {
    if (!data.title?.trim() || data.title.trim().length < 3 || data.title.trim().length > 200 || !data.description?.trim() || data.description.length > 10_000) throw new BadRequestException('Title and description are required');
    if (!data.intakeSessionId) return this.tickets.createDraft(actor,data);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const session = await this.owned(client,actor,data.intakeSessionId!,true);
      this.assertMutable(session);
      if (processingStates.has(session.status)) throw new BadRequestException('Ticket intake is still being processed');
      if (session.voice_storage_key && !session.voice_verified_at) throw new BadRequestException('Voice upload is not verified');
      if (session.voice_storage_key && !this.voiceObjectMatches(session,await this.storage.head(session.voice_storage_key))) throw new BadRequestException('Voice object metadata has changed');
      const ticket = await this.tickets.createDraftWithClient(client,actor,data);
      const intakeTags=data.tags ?? (session.analysis_result?.suggestions as {tags?:Array<{id?:string;name?:string;kind?:'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER'}>} | null)?.tags ?? [];
      await this.tickets.attachIntakeTagsWithClient(client,actor,ticket.id,intakeTags);
      await this.recordTitleCandidate(client,actor,ticket.id,data.title);
      if (session.voice_storage_key && session.voice_original_filename && session.voice_content_type && session.voice_byte_size && session.voice_verified_at) {
        await this.attachments.attachAvailableWithClient(client,actor,ticket.id,{storageKey:session.voice_storage_key,filename:session.voice_original_filename,contentType:session.voice_content_type,byteSize:Number(session.voice_byte_size)});
      }
      await client.query(
        `INSERT INTO ticket_intake_provenance(organization_id,ticket_id,intake_session_id,analysis_contract_version,analysis_result,confidence_by_field)
         VALUES($1,$2,$3,$4,$5,$6)`, [actor.organizationId,ticket.id,session.id,session.analysis_contract_version,session.analysis_result,session.confidence_by_field],
      );
      await client.query("UPDATE ticket_intake_sessions SET status='CONSUMED',ticket_id=$2,consumed_at=now(),updated_at=now() WHERE id=$1",[session.id,ticket.id]);
      await this.audit(client,actor,'ticket_intake.consumed',session.id,{ticketId:ticket.id,voiceAttached:Boolean(session.voice_storage_key&&session.voice_verified_at)});
      return {...ticket,intakeSessionId:session.id};
    });
  }

  async cleanupExpired(limit=100) {
    const rows = (await this.database.query<{id:string;organization_id:string;voice_storage_key:string|null}>(
      `SELECT id,organization_id,voice_storage_key FROM ticket_intake_sessions
       WHERE expires_at<=now() AND status NOT IN ('CONSUMED','EXPIRED') ORDER BY expires_at LIMIT $1`, [Math.min(500,Math.max(1,limit))],
    )).rows;
    let cleaned=0;
    for (const row of rows) {
      try {
        if (row.voice_storage_key) await this.storage.delete(row.voice_storage_key);
        cleaned += await this.database.withOrganization(row.organization_id, async (client) => (await client.query(
          "UPDATE ticket_intake_sessions SET status='EXPIRED',processing_started_at=NULL,next_attempt_at=NULL,updated_at=now() WHERE id=$1 AND expires_at<=now() AND status NOT IN ('CONSUMED','EXPIRED')",[row.id],
        )).rowCount ?? 0);
      } catch { /* Object deletion is retried on the next worker cycle. */ }
    }
    return cleaned;
  }

  private async configuration(organizationId:string) {
    const row = await this.database.withOrganization(organizationId, async (client) => (await client.query<ProviderConfigurationRow>(
      `SELECT provider_base_url,analysis_model,transcription_model,api_key_ciphertext,api_key_iv,api_key_auth_tag
       FROM organization_ai_settings WHERE organization_id=$1 AND enabled=true AND api_key_ciphertext IS NOT NULL`,[organizationId],
    )).rows[0]);
    if (!row) throw new Error('ai_configuration_unavailable');
    return {...row,apiKey:this.credentials.decrypt({ciphertext:row.api_key_ciphertext,iv:row.api_key_iv,authTag:row.api_key_auth_tag})};
  }

  private async context(organizationId:string,description:string):Promise<TicketIntakeContext> {
    return this.database.withOrganization(organizationId, async (client) => {
      const categories=(await client.query<{id:string;name:string}>('SELECT id,name FROM categories ORDER BY name')).rows;
      const subcategories=(await client.query<{id:string;name:string;category_id:string}>('SELECT id,name,category_id FROM subcategories ORDER BY name')).rows.map((item)=>({id:item.id,name:item.name,categoryId:item.category_id}));
      const departments=(await client.query<{id:string;name:string}>('SELECT id,name FROM departments ORDER BY name')).rows;
      const locations=(await client.query<{id:string;name:string}>('SELECT id,name FROM locations ORDER BY name')).rows;
      const disciplines=(await client.query<{id:string;name:string}>('SELECT id,name FROM disciplines ORDER BY name')).rows;
      const customFields=(await client.query<{field_key:string;label:string;field_type:string;options:unknown[];is_required:boolean}>(
        'SELECT field_key,label,field_type,options,is_required FROM ticket_custom_field_definitions WHERE is_active=true ORDER BY sort_order,label',
      )).rows.map<IntakeCustomFieldDefinition>((item)=>({key:item.field_key,label:item.label,type:item.field_type,options:item.options??[],required:item.is_required}));
      const titleLibrary=(await client.query<{id:string;title:string}>('SELECT id,title FROM ticket_title_library WHERE status=\'ACTIVE\' ORDER BY usage_count DESC,title LIMIT 20')).rows;
      const tags=(await client.query<{id:string;name:string;kind:'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER'}>('SELECT id,name,kind FROM ticket_tags WHERE status=\'ACTIVE\' ORDER BY usage_count DESC,name LIMIT 80')).rows;
      return {description:redactForAi(description),categories,subcategories,departments,locations,disciplines,customFields,titleLibrary,tags};
    });
  }

  private validateAnalysis(output:TicketIntakeProviderOutput, context:TicketIntakeContext) {
    if (output.contractVersion !== TICKET_INTAKE_CONTRACT_VERSION) throw new Error('analysis_contract_invalid');
    const confidenceByField=Object.fromEntries(Object.entries(output.confidenceByField??{}).filter(([,value])=>typeof value==='number'&&Number.isFinite(value)).map(([key,value])=>[key,Math.max(0,Math.min(1,value))]));
    const suggestions:Record<string,unknown>={}; const rejectedFields:string[]=[];
    const accepted=(field:string)=>Number(confidenceByField[field])>=confidenceThreshold;
    if (accepted('title') && typeof output.title==='string' && output.title.trim().length>=3 && output.title.trim().length<=200) suggestions.title=output.title.trim(); else rejectedFields.push('title');
    if (output.titleLibraryId!==null && (!accepted('title') || !context.titleLibrary.some(item=>item.id===output.titleLibraryId && item.title===output.title.trim()))) rejectedFields.push('titleLibraryId');
    else if (output.titleLibraryId) suggestions.titleLibraryId=output.titleLibraryId;
    if (accepted('priority') && priorities.has(output.priority)) suggestions.priority=output.priority; else rejectedFields.push('priority');
    const catalogs = {categoryId:context.categories,subcategoryId:context.subcategories,departmentId:context.departments,locationId:context.locations,disciplineId:context.disciplines};
    for (const [field,items] of Object.entries(catalogs)) {
      const value=output[field as keyof TicketIntakeProviderOutput];
      if (value===null) continue;
      if (accepted(field) && typeof value==='string' && items.some((item)=>item.id===value)) suggestions[field]=value; else rejectedFields.push(field);
    }
    if (suggestions.subcategoryId) {
      const sub=context.subcategories.find((item)=>item.id===suggestions.subcategoryId);
      if (!suggestions.categoryId || sub?.categoryId!==suggestions.categoryId) { delete suggestions.subcategoryId; rejectedFields.push('subcategoryId'); }
    }
    const customFields:Record<string,unknown>={};
    for (const [key,value] of Object.entries(output.customFields??{})) {
      const definition=context.customFields.find((item)=>item.key===key); const field=`customFields.${key}`;
      const normalized=definition ? this.validCustomValue(definition,value) : undefined;
      if (definition && accepted(field) && normalized!==undefined) customFields[key]=normalized; else rejectedFields.push(field);
    }
    if (Object.keys(customFields).length) suggestions.customFields=customFields;
    const tags:Array<{id?:string;name?:string;kind?:'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER'}>=[];
    const acceptedKinds=new Set(['DOMAIN','SERVICE_ASSET','ISSUE_TYPE','IMPACT_SCOPE','CONTEXT','OTHER']);
    const tagConfidenceFields:Record<string,string>={DOMAIN:'domainTag',SERVICE_ASSET:'serviceAssetTag',ISSUE_TYPE:'issueTypeTag',IMPACT_SCOPE:'impactScopeTag',CONTEXT:'contextTag',OTHER:'otherTag'};
    const acceptedTag=(proposal:{kind:string},index:number)=>{
      const confidence=confidenceByField.tags ?? confidenceByField[`tags.${proposal.kind}`] ?? confidenceByField[`tag:${proposal.kind}`] ?? confidenceByField[tagConfidenceFields[proposal.kind] ?? ''] ?? confidenceByField[`tags.${index}`];
      return Number(confidence)>=confidenceThreshold;
    };
    if (Array.isArray(output.tags)) for(const [index,proposal] of output.tags.slice(0,5).entries()) {
      if (!proposal || !acceptedKinds.has(proposal.kind) || typeof proposal.name!=='string') { rejectedFields.push('tags'); continue; }
      if (!acceptedTag(proposal,index)) { rejectedFields.push('tags'); continue; }
      const existing=proposal.tagId ? context.tags.find(item=>item.id===proposal.tagId && item.kind===proposal.kind && item.name===proposal.name) : undefined;
      const name=proposal.name.trim().replace(/\s+/g,' ');
      if(existing) tags.push({id:existing.id,name:existing.name,kind:existing.kind});
      else if(proposal.tagId===null && name.length>=2 && name.length<=50) tags.push({name,kind:proposal.kind});
      else rejectedFields.push('tags');
    }
    if(tags.length) suggestions.tags=tags;
    const missingFields=[...new Set([...(Array.isArray(output.missingFields)?output.missingFields.filter((item):item is string=>typeof item==='string'):[]),...rejectedFields])].slice(0,100);
    const rejected=[...new Set(rejectedFields)];
    return { result:{contractVersion:TICKET_INTAKE_CONTRACT_VERSION,suggestions,missingFields,confidenceByField,rejectedFields:rejected},missingFields,confidenceByField,rejectedFields:rejected };
  }

  private validCustomValue(definition:IntakeCustomFieldDefinition,value:unknown) {
    if (value===null || value===undefined || value==='') return undefined;
    if (definition.type==='TEXT') return typeof value==='string'&&value.length<=2000?value:undefined;
    if (definition.type==='NUMBER') { const number=typeof value==='number'?value:Number(value); return Number.isFinite(number)?number:undefined; }
    if (definition.type==='BOOLEAN') return typeof value==='boolean'?value:undefined;
    if (definition.type==='DATE') return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`))?value:undefined;
    if (definition.type==='SELECT') return (definition.options??[]).includes(value)?value:undefined;
    return undefined;
  }

  private async recordTitleCandidate(client:{query:Function},actor:TicketActor,ticketId:string,title:string) {
    const normalized=title.trim().replace(/\s+/g,' ').toLocaleLowerCase('fa-IR');
    const existing=(await client.query('SELECT id,status FROM ticket_title_library WHERE normalized_title=$1',[normalized])).rows[0] as {id:string;status:string}|undefined;
    if(existing?.status==='ACTIVE') { await client.query('UPDATE ticket_title_library SET usage_count=usage_count+1,updated_at=now() WHERE id=$1',[existing.id]); return; }
    if(!existing) await client.query(`INSERT INTO ticket_title_library(organization_id,title,normalized_title,status,created_from_ticket_id,created_by_user_id)
      VALUES($1,$2,$3,'PENDING',$4,$5)`,[actor.organizationId,title.trim(),normalized,ticketId,actor.userId]);
  }

  private async recordFailure(organizationId:string,id:string,stage:string,error:unknown) {
    const code=this.errorCode(error);
    await this.database.withOrganization(organizationId, async (client) => {
      const current=(await client.query<{attempt_count:number}>('SELECT attempt_count FROM ticket_intake_sessions WHERE id=$1',[id])).rows[0];
      if (!current) return;
      const failed=current.attempt_count>=3; const delay=Math.min(60,5*(2**Math.max(0,current.attempt_count-1)));
      await client.query(
        `UPDATE ticket_intake_sessions SET status=$2,processing_started_at=NULL,next_attempt_at=CASE WHEN $2='FAILED' THEN NULL ELSE now()+($3||' seconds')::interval END,
         last_error_code=$4,updated_at=now() WHERE id=$1`,[id,failed?'FAILED':stage,delay,code],
      );
      await this.audit(client,{userId:'',organizationId},failed?'ticket_intake.failed':'ticket_intake.retry_scheduled',id,{stage,errorCode:code,attempt:current.attempt_count});
    });
  }

  private errorCode(error:unknown) {
    const message=error instanceof Error?error.message:'';
    const providerCode=message.match(/\(([a-z0-9_.-]{1,80})\)$/i)?.[1];
    if (providerCode) return providerCode;
    if (/^[a-z0-9_.-]{1,80}$/i.test(message)) return message;
    return 'provider_failure';
  }

  private validateVoice(input:{filename:string;contentType:string;byteSize:number;durationSeconds:number}) {
    if (typeof input.filename!=='string'||!input.filename.trim()||input.filename.length>255||/[\\/\u0000-\u001f]/.test(input.filename)) throw new BadRequestException('Invalid voice filename');
    if (!allowedVoiceTypes.has(input.contentType)) throw new BadRequestException('Unsupported voice media type');
    if (!Number.isInteger(input.byteSize)||input.byteSize<1||input.byteSize>maximumVoiceBytes) throw new BadRequestException('Voice file must not exceed 10 MB');
    if (!Number.isFinite(input.durationSeconds)||input.durationSeconds<=0||input.durationSeconds>60) throw new BadRequestException('Voice duration must not exceed 60 seconds');
  }

  private durationMetadata(value:number) { return Number(value.toFixed(3)).toString(); }
  private voiceObjectMatches(session:IntakeRow,object:StoredObject|undefined) {
    if (!object||!session.voice_content_type||!session.voice_byte_size||!session.voice_duration_seconds) return false;
    const actualDuration=Number(object.metadata?.['duration-seconds']??object.metadata?.durationSeconds);
    return object.contentType?.toLowerCase()===session.voice_content_type.toLowerCase()
      && object.contentLength===Number(session.voice_byte_size)&&Number.isFinite(actualDuration)
      && Math.abs(actualDuration-Number(session.voice_duration_seconds))<0.01;
  }
  private combine(source:string,transcript:string) { return (source.trim()?`${source.trim()}\n\nمتن پیاده‌سازی‌شده صدا:\n${transcript}`:transcript).slice(0,30_000); }
  private assertMutable(row:IntakeRow) {
    if (row.status==='CONSUMED') throw new BadRequestException('Ticket intake has already been consumed');
    if (row.status==='EXPIRED'||new Date(row.expires_at).getTime()<=Date.now()) throw new BadRequestException('Ticket intake has expired');
  }
  private async owned(client:{query:Function},actor:TicketActor,id:string,lock=false):Promise<IntakeRow> {
    const row=(await client.query(`SELECT * FROM ticket_intake_sessions WHERE id=$1 AND created_by_user_id=$2${lock?' FOR UPDATE':''}`,[id,actor.userId])).rows[0] as IntakeRow|undefined;
    if (!row) throw new NotFoundException('Ticket intake not found');
    return row;
  }
  private present(row:IntakeRow) {
    return { id:row.id,status:row.status,description:row.source_description,transcript:row.transcript,combinedDescription:row.combined_description,
      contractVersion:row.analysis_contract_version,suggestions:(row.analysis_result?.suggestions as Record<string,unknown>|undefined)??null,
      missingFields:row.missing_fields,confidenceByField:row.confidence_by_field,rejectedFields:row.rejected_fields,
      voice:row.voice_original_filename?{filename:row.voice_original_filename,contentType:row.voice_content_type,byteSize:Number(row.voice_byte_size),durationSeconds:Number(row.voice_duration_seconds)}:null,
      attemptCount:row.attempt_count,lastErrorCode:row.last_error_code,ticketId:row.ticket_id,expiresAt:row.expires_at,createdAt:row.created_at,updatedAt:row.updated_at };
  }
  private async audit(client:{query:Function},actor:Pick<TicketActor,'userId'|'organizationId'>,action:string,targetId:string,metadata:object) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,NULLIF($2,\'\')::uuid,$3,\'ticket_intake\',$4,$5)',[actor.organizationId,actor.userId,action,targetId,metadata]);
  }
}
