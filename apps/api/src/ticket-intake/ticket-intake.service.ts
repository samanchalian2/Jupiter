import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiCredentialService } from '../ai/ai-credential.service.js';
import { redactForAi } from '../ai/redactor.js';
import { AttachmentService } from '../attachments/attachment.service.js';
import type { AttachmentStorage, StoredObject } from '../attachments/attachment-storage.js';
import { DatabaseService } from '../database/database.service.js';
import type { TicketActor } from '../tickets/ticket-actor.service.js';
import { TicketService, type CreateDraftData } from '../tickets/ticket.service.js';
import { CommercialService } from '../commercial/commercial.service.js';
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
  smart_action_key:string|null;
  conversation_summary:string|null; primary_issue:Record<string,unknown>|null; secondary_issues:Array<Record<string,unknown>>; clarification_question:string|null; clarification_confidence:string|null;
  expires_at:Date; consumed_at:Date|null; created_at:Date; updated_at:Date;
};

type ProviderConfigurationRow = {
  provider_base_url:string; analysis_model:string; transcription_model:string;
  api_key_ciphertext:Buffer; api_key_iv:Buffer; api_key_auth_tag:Buffer;
};

type IntakeMessageRow = {
  id:string; organization_id:string; intake_session_id:string; sequence_number:number; role:'USER'|'ASSISTANT'; content_type:'TEXT'|'VOICE'|'CLARIFICATION';
  text_content:string|null; transcript:string|null; voice_storage_key:string|null; voice_original_filename:string|null; voice_content_type:string|null;
  voice_byte_size:string|null; voice_duration_seconds:string|null; voice_verified_at:Date|null; discarded_at:Date|null; created_at:Date; updated_at:Date;
};
type ScopedClient = {query:(text:string,values?:unknown[])=>Promise<{rows:any[];rowCount:number|null}>};

@Injectable()
export class TicketIntakeService {
  constructor(
    private readonly database: DatabaseService,
    private readonly tickets: TicketService,
    private readonly attachments: AttachmentService,
    private readonly credentials: AiCredentialService,
    private readonly commercial: CommercialService,
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
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const row = await this.owned(client, actor, id);
      const messages=(await client.query<IntakeMessageRow>('SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 AND discarded_at IS NULL ORDER BY sequence_number',[id])).rows;
      return {...this.present(row),messages:messages.map(message=>this.presentMessage(message))};
    });
  }

  async capabilities(actor: TicketActor) {
    const configured = await this.database.withOrganization(actor.organizationId, async client => {
      const row=(await client.query<{smart_intake_enabled:boolean}>(`SELECT enabled AND smart_intake_enabled
        AND api_key_ciphertext IS NOT NULL
        AND COALESCE(NULLIF(btrim(analysis_model),''),NULLIF(btrim(model),'')) IS NOT NULL AS smart_intake_enabled
        FROM organization_ai_settings WHERE organization_id=$1`,[actor.organizationId])).rows[0];
      return Boolean(row?.smart_intake_enabled);
    });
    const commercial=await this.commercial.resolve(actor.organizationId,'AI_SMART_INTAKE');
    return { smartIntakeEnabled: configured&&commercial.effective, reasonCode: configured ? commercial.reasonCode : 'AI_CONFIGURATION_DISABLED' };
  }

  async addTextMessage(actor:TicketActor,id:string,input:{text:string}) {
    const text=input.text?.trim();
    if(!text || text.length>10_000) throw new BadRequestException('Message text is invalid');
    return this.database.withOrganization(actor.organizationId,async client=>{
      const session=await this.owned(client,actor,id,true);this.assertMutable(session);this.assertNotProcessing(session);
      const sequence=await this.nextMessageSequence(client,id);
      await client.query(`INSERT INTO ticket_intake_messages(organization_id,intake_session_id,sequence_number,role,content_type,text_content)
        VALUES($1,$2,$3,'USER','TEXT',$4)`,[actor.organizationId,id,sequence,text]);
      const source=await this.combinedUserMessageText(client,id);
      const row=(await client.query<IntakeRow>(`UPDATE ticket_intake_sessions SET status='CREATED',source_description=$2,combined_description=$2,transcript=NULL,
        analysis_result=NULL,provider_usage='{}'::jsonb,missing_fields='[]'::jsonb,confidence_by_field='{}'::jsonb,rejected_fields='[]'::jsonb,
        conversation_summary=NULL,secondary_issues='[]'::jsonb,clarification_question=NULL,clarification_confidence=NULL,
        attempt_count=0,last_error_code=NULL,processing_started_at=NULL,next_attempt_at=NULL,updated_at=now() WHERE id=$1 RETURNING *`,[id,source])).rows[0];
      await this.audit(client,actor,'ticket_intake.message_added',id,{kind:'text'});return this.present(row);
    });
  }

  async requestMessageVoiceUpload(actor:TicketActor,id:string,input:{filename:string;contentType:string;byteSize:number;durationSeconds:number}) {
    this.validateVoice(input);const storageKey=`organizations/${actor.organizationId}/ticket-intakes/${id}/messages/${randomUUID()}.${voiceExtensions[input.contentType]}`;const durationMetadata=this.durationMetadata(input.durationSeconds);
    const result=await this.database.withOrganization(actor.organizationId,async client=>{
      const session=await this.owned(client,actor,id,true);this.assertMutable(session);this.assertNotProcessing(session);
      const sequence=await this.nextMessageSequence(client,id);const uploadUrl=await this.storage.createUploadUrl(storageKey,input.contentType,300,{'duration-seconds':durationMetadata});
      const message=(await client.query<IntakeMessageRow>(`INSERT INTO ticket_intake_messages(organization_id,intake_session_id,sequence_number,role,content_type,voice_storage_key,voice_original_filename,voice_content_type,voice_byte_size,voice_duration_seconds)
       VALUES($1,$2,$3,'USER','VOICE',$4,$5,$6,$7,$8) RETURNING *`,[actor.organizationId,id,sequence,storageKey,input.filename.trim(),input.contentType,input.byteSize,input.durationSeconds])).rows[0];
      return {message,uploadUrl};
    });
    return {message:this.presentMessage(result.message),uploadUrl:result.uploadUrl,expiresInSeconds:300,requiredHeaders:{'Content-Type':input.contentType,'x-amz-meta-duration-seconds':durationMetadata}};
  }

  async completeMessageVoiceUpload(actor:TicketActor,id:string,messageId:string) {
    const result=await this.database.withOrganization(actor.organizationId,async client=>{
      const session=await this.owned(client,actor,id,true);this.assertMutable(session);this.assertNotProcessing(session);
      const message=await this.ownedMessage(client,id,messageId,true);if(message.content_type!=='VOICE'||!message.voice_storage_key)throw new BadRequestException('No pending voice upload exists');
      if(!this.voiceMessageMatches(message,await this.storage.head(message.voice_storage_key)))return {bad:true as const,key:message.voice_storage_key};
      const updated=(await client.query<IntakeMessageRow>('UPDATE ticket_intake_messages SET voice_verified_at=now(),updated_at=now() WHERE id=$1 RETURNING *',[messageId])).rows[0];
      await client.query("UPDATE ticket_intake_sessions SET status='CREATED',updated_at=now() WHERE id=$1",[id]);return {bad:false as const,message:updated};
    });
    if(result.bad){await this.storage.delete(result.key).catch(()=>undefined);throw new BadRequestException('Uploaded voice does not match the approved metadata');}
    return this.presentMessage(result.message);
  }

  async discardMessage(actor:TicketActor,id:string,messageId:string) {
    const result=await this.database.withOrganization(actor.organizationId,async client=>{
      const session=await this.owned(client,actor,id,true);this.assertMutable(session);this.assertNotProcessing(session);
      const message=await this.ownedMessage(client,id,messageId,true);await client.query('UPDATE ticket_intake_messages SET discarded_at=now(),updated_at=now() WHERE id=$1',[messageId]);
      const source=await this.combinedUserMessageText(client,id);await client.query("UPDATE ticket_intake_sessions SET status='CREATED',source_description=$2,combined_description=$2,analysis_result=NULL,conversation_summary=NULL,secondary_issues='[]'::jsonb,clarification_question=NULL,clarification_confidence=NULL,updated_at=now() WHERE id=$1",[id,source]);
      return message.voice_storage_key;
    });
    if(result)await this.storage.delete(result).catch(()=>undefined);return this.get(actor,id);
  }

  async cancel(actor:TicketActor,id:string) {
    const result=await this.database.withOrganization(actor.organizationId,async client=>{
      const session=await this.owned(client,actor,id,true);
      this.assertMutable(session);
      const messages=(await client.query<IntakeMessageRow>('SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 FOR UPDATE',[id])).rows;
      const storageKeys=[session.voice_storage_key,...messages.map(message=>message.voice_storage_key)]
        .filter((key):key is string=>Boolean(key));

      // Keep the ownership lock while deleting temporary objects. This prevents a
      // concurrent final submission from transferring a voice attachment after
      // the requester has confirmed cancellation. Object deletion is idempotent;
      // if it fails the transaction rolls back and the requester can retry.
      for(const key of new Set(storageKeys)) await this.storage.delete(key);
      await client.query("UPDATE outbox_events SET processed_at=now() WHERE topic='ticket_intake.process' AND payload->>'sessionId'=$1 AND processed_at IS NULL",[id]);
      await client.query('DELETE FROM ticket_intake_sessions WHERE id=$1',[id]);
      await this.audit(client,actor,'ticket_intake.cancelled',id,{hadVoice:storageKeys.length>0,messageCount:messages.filter(message=>message.role==='USER').length});
      return {cancelled:true,key:session.smart_action_key};
    });
    if(result.key)await this.commercial.releaseSmartAction(actor.organizationId,result.key);
    return {cancelled:true};
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
    const prepared = await this.database.withOrganization(actor.organizationId, async (client) => {
      const session = await this.owned(client, actor, id, true);
      this.assertMutable(session);
      if (session.status === 'SUCCEEDED' || session.status === 'TRANSCRIBING' || session.status === 'ANALYZING') return { row: session, alreadyQueued: true };
      if (session.status === 'UPLOADING') throw new BadRequestException('Voice upload must be completed first');
      if (session.voice_storage_key && !session.voice_verified_at) throw new BadRequestException('Voice upload must be verified first');
      if (!session.source_description.trim() && !session.voice_storage_key) throw new BadRequestException('Text or voice input is required');
      const configured = (await client.query<{configured:boolean}>(
        `SELECT enabled AND smart_intake_enabled AND api_key_ciphertext IS NOT NULL
          AND COALESCE(NULLIF(btrim(analysis_model),''),NULLIF(btrim(model),'')) IS NOT NULL AS configured
         FROM organization_ai_settings WHERE organization_id=$1`, [actor.organizationId],
      )).rows[0]?.configured;
      if (!configured) throw new ForbiddenException('AI is not configured for this organization');
      const status = session.voice_storage_key && !session.transcript ? 'TRANSCRIBING' : 'ANALYZING';
      const updated = (await client.query<IntakeRow>(
        `UPDATE ticket_intake_sessions SET status=$2,smart_action_key=COALESCE(smart_action_key,gen_random_uuid()),attempt_count=0,last_error_code=NULL,processing_started_at=NULL,
         next_attempt_at=now(),analysis_result=NULL,provider_usage='{}'::jsonb,missing_fields='[]'::jsonb,
         confidence_by_field='{}'::jsonb,rejected_fields='[]'::jsonb,updated_at=now() WHERE id=$1 RETURNING *`, [id,status],
      )).rows[0];
      return { row: updated, alreadyQueued: false };
    });
    const { row } = prepared;
    if (prepared.alreadyQueued) return this.present(row);
    if (!row.smart_action_key) return this.present(row);
    try { await this.commercial.reserveSmartAction(actor,'AI_SMART_INTAKE',row.smart_action_key,{type:'ticket_intake',id}); }
    catch (error) { await this.resetUnreservedAnalysis(actor.organizationId,id,row.smart_action_key); throw error; }
    await this.database.withOrganization(actor.organizationId,async client=>{
      await client.query("INSERT INTO outbox_events(organization_id,topic,payload) VALUES($1,'ticket_intake.process',$2)",[actor.organizationId,{sessionId:id}]);
      await this.audit(client,actor,'ticket_intake.analysis_requested',id,{hasVoice:Boolean(row.voice_storage_key)});
    });
    return this.present(row);
  }

  async analyzeConversation(actor:TicketActor,id:string) {
    const prepared=await this.database.withOrganization(actor.organizationId,async client=>{
      const session=await this.owned(client,actor,id,true);this.assertMutable(session);
      if(session.status==='SUCCEEDED'||session.status==='TRANSCRIBING'||session.status==='ANALYZING')return{row:session,alreadyQueued:true};
      this.assertNotProcessing(session);
      const messages=(await client.query<IntakeMessageRow>('SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 AND discarded_at IS NULL ORDER BY sequence_number',[id])).rows;
      const userMessages=messages.filter(message=>message.role==='USER');
      if(!userMessages.length)throw new BadRequestException('A text or voice message is required');
      const pending=userMessages.filter(message=>message.content_type==='VOICE'&&!message.voice_verified_at);
      if(pending.length)throw new BadRequestException('Voice upload must be verified first');
      const configured=(await client.query<{configured:boolean}>(`SELECT enabled AND smart_intake_enabled AND api_key_ciphertext IS NOT NULL
        AND COALESCE(NULLIF(btrim(analysis_model),''),NULLIF(btrim(model),'')) IS NOT NULL AS configured
        FROM organization_ai_settings WHERE organization_id=$1`,[actor.organizationId])).rows[0]?.configured;
      if(!configured)throw new ForbiddenException('AI is not configured for this organization');
      const needsTranscription=userMessages.some(message=>message.content_type==='VOICE'&&!message.transcript);
      const updated=(await client.query<IntakeRow>(`UPDATE ticket_intake_sessions SET status=$2,smart_action_key=COALESCE(smart_action_key,gen_random_uuid()),attempt_count=0,last_error_code=NULL,processing_started_at=NULL,next_attempt_at=now(),
        analysis_result=NULL,provider_usage='{}'::jsonb,missing_fields='[]'::jsonb,confidence_by_field='{}'::jsonb,rejected_fields='[]'::jsonb,
        conversation_summary=NULL,secondary_issues='[]'::jsonb,clarification_question=NULL,clarification_confidence=NULL,updated_at=now() WHERE id=$1 RETURNING *`,[id,needsTranscription?'TRANSCRIBING':'ANALYZING'])).rows[0];
      return {row:updated,alreadyQueued:false};
    });
    const {row}=prepared;
    if(prepared.alreadyQueued)return this.present(row);
    if (!row.smart_action_key) return this.present(row);
    try { await this.commercial.reserveSmartAction(actor,'AI_SMART_INTAKE',row.smart_action_key,{type:'ticket_intake',id}); }
    catch (error) { await this.resetUnreservedAnalysis(actor.organizationId,id,row.smart_action_key); throw error; }
    await this.database.withOrganization(actor.organizationId,async client=>{
      await client.query("INSERT INTO outbox_events(organization_id,topic,payload) VALUES($1,'ticket_intake.process',$2)",[actor.organizationId,{sessionId:id}]);
      await this.audit(client,actor,'ticket_intake.conversation_analysis_requested',id,{hasVoice:Boolean(row.voice_storage_key)});
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
      if (!claimed.smart_action_key) throw new Error('commercial_action_missing');
      const configuration = await this.configuration(organizationId);
      const conversationMessages=await this.database.withOrganization(organizationId,client=>client.query<IntakeMessageRow>('SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 AND discarded_at IS NULL ORDER BY sequence_number',[id]).then(result=>result.rows));
      if(conversationMessages.length){
        if(stage==='TRANSCRIBING'){
          for(const message of conversationMessages.filter(item=>item.role==='USER'&&item.content_type==='VOICE'&&!item.transcript)){
            if(!message.voice_storage_key||!message.voice_content_type||!message.voice_original_filename||!message.voice_verified_at)throw new Error('voice_unavailable');
            if(!this.voiceMessageMatches(message,await this.storage.head(message.voice_storage_key)))throw new Error('voice_metadata_mismatch');
            const bytes=await this.storage.read(message.voice_storage_key);if(!bytes.length||bytes.length>maximumVoiceBytes)throw new Error('voice_content_invalid');
            const buffer=new ArrayBuffer(bytes.byteLength);new Uint8Array(buffer).set(bytes);
            const transcription=await transcriptionProvider.transcribe({audio:new Blob([buffer],{type:message.voice_content_type}),filename:message.voice_original_filename,configuration:{baseUrl:configuration.provider_base_url,apiKey:configuration.apiKey,model:configuration.transcription_model}});
            await this.database.withOrganization(organizationId,client=>client.query('UPDATE ticket_intake_messages SET transcript=$2,updated_at=now() WHERE id=$1',[message.id,transcription.text.trim().slice(0,20_000)]));
            await this.commercial.recordAiTelemetry(organizationId,claimed.smart_action_key!,{operationCode:'AI_SMART_INTAKE',outcome:'SUCCEEDED',provider:'openai-compatible',model:configuration.transcription_model,audioDurationSeconds:Number(message.voice_duration_seconds)});
          }
        }
        const completeMessages=await this.database.withOrganization(organizationId,client=>client.query<IntakeMessageRow>('SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 AND discarded_at IS NULL ORDER BY sequence_number',[id]).then(result=>result.rows));
        const description=this.combineConversation(completeMessages);const context=await this.context(organizationId,description,completeMessages,this.validIssue(claimed.primary_issue)??undefined);
        const answer=await aiProvider.analyzeIntake({context,configuration:{baseUrl:configuration.provider_base_url,apiKey:configuration.apiKey,model:configuration.analysis_model}});const validated=this.validateAnalysis(answer.output,context);
        if(!this.hasUsableSuggestion(validated.result)) throw new Error('analysis_result_unusable');
        const interpretation=this.safeText(answer.output.interpretation,2_000);const primary=this.validIssue(answer.output.primaryIssue);const secondary=this.secondaryProposals(answer.output,context);const question=this.safeText(answer.output.clarificationQuestion,500);const questionConfidence=typeof answer.output.clarificationConfidence==='number'&&Number.isFinite(answer.output.clarificationConfidence)?Math.max(0,Math.min(1,answer.output.clarificationConfidence)):null;
        await this.database.withOrganization(organizationId,async client=>{
          await client.query(`UPDATE ticket_intake_sessions SET status='SUCCEEDED',source_description=$2,combined_description=$2,analysis_contract_version=$3,analysis_result=$4,provider_usage=$5,missing_fields=$6,confidence_by_field=$7,rejected_fields=$8,conversation_summary=$9,primary_issue=$10,secondary_issues=$11,clarification_question=$12,clarification_confidence=$13,attempt_count=0,processing_started_at=NULL,next_attempt_at=NULL,last_error_code=NULL,updated_at=now() WHERE id=$1`,[id,description,TICKET_INTAKE_CONTRACT_VERSION,validated.result,answer.usage,JSON.stringify(validated.missingFields),validated.confidenceByField,JSON.stringify(validated.rejectedFields),interpretation,primary,JSON.stringify(secondary),question,questionConfidence]);
          await client.query("DELETE FROM ticket_intake_messages WHERE intake_session_id=$1 AND role='ASSISTANT'",[id]);
          if(question)await client.query(`INSERT INTO ticket_intake_messages(organization_id,intake_session_id,sequence_number,role,content_type,text_content) VALUES($1,$2,$3,'ASSISTANT','CLARIFICATION',$4)`,[organizationId,id,completeMessages.length+1,question]);
          await client.query("UPDATE outbox_events SET processed_at=now() WHERE topic='ticket_intake.process' AND payload->>'sessionId'=$1 AND processed_at IS NULL",[id]);await this.audit(client,{userId:'',organizationId},'ticket_intake.conversation_succeeded',id,{contractVersion:TICKET_INTAKE_CONTRACT_VERSION,hasClarification:Boolean(question),secondaryIssueCount:secondary.length});
        });
        await this.commercial.recordAiTelemetry(organizationId,claimed.smart_action_key!,{operationCode:'AI_SMART_INTAKE',outcome:'SUCCEEDED',provider:'openai-compatible',model:configuration.analysis_model,inputTokens:Number(answer.usage?.inputTokens)||undefined,outputTokens:Number(answer.usage?.outputTokens)||undefined});
        await this.commercial.settleSmartAction(organizationId,claimed.smart_action_key!,id);
        return;
      }
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
        await this.commercial.recordAiTelemetry(organizationId,claimed.smart_action_key!,{operationCode:'AI_SMART_INTAKE',outcome:'SUCCEEDED',provider:'openai-compatible',model:configuration.transcription_model,audioDurationSeconds:Number(claimed.voice_duration_seconds)});
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
      if (!this.hasUsableSuggestion(validated.result)) throw new Error('analysis_result_unusable');
      await this.database.withOrganization(organizationId, async (client) => {
        await client.query(
          `UPDATE ticket_intake_sessions SET status='SUCCEEDED',analysis_contract_version=$2,analysis_result=$3,provider_usage=$4,missing_fields=$5,
           confidence_by_field=$6,rejected_fields=$7,attempt_count=0,processing_started_at=NULL,next_attempt_at=NULL,last_error_code=NULL,updated_at=now()
           WHERE id=$1`, [id,TICKET_INTAKE_CONTRACT_VERSION,validated.result,answer.usage,JSON.stringify(validated.missingFields),validated.confidenceByField,JSON.stringify(validated.rejectedFields)],
        );
        await client.query("UPDATE outbox_events SET processed_at=now() WHERE topic='ticket_intake.process' AND payload->>'sessionId'=$1 AND processed_at IS NULL",[id]);
        await this.audit(client,{userId:'',organizationId},'ticket_intake.succeeded',id,{contractVersion:TICKET_INTAKE_CONTRACT_VERSION});
      });
      await this.commercial.recordAiTelemetry(organizationId,claimed.smart_action_key!,{operationCode:'AI_SMART_INTAKE',outcome:'SUCCEEDED',provider:'openai-compatible',model:configuration.analysis_model,inputTokens:Number(answer.usage?.inputTokens)||undefined,outputTokens:Number(answer.usage?.outputTokens)||undefined});
      await this.commercial.settleSmartAction(organizationId,claimed.smart_action_key!,id);
    } catch (error) {
      if (stage) { await this.recordFailure(organizationId,id,stage,error); const row=await this.database.withOrganization(organizationId,c=>c.query<IntakeRow>('SELECT * FROM ticket_intake_sessions WHERE id=$1',[id]).then(r=>r.rows[0])); if(row?.status==='FAILED'&&row.smart_action_key){await this.commercial.recordAiTelemetry(organizationId,row.smart_action_key,{operationCode:'AI_SMART_INTAKE',outcome:'RELEASED'});await this.commercial.releaseSmartAction(organizationId,row.smart_action_key);} }
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
      const conversationVoices=(await client.query<IntakeMessageRow>(`SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 AND content_type='VOICE' AND discarded_at IS NULL ORDER BY sequence_number`,[session.id])).rows;
      for(const voice of conversationVoices){
        if(!voice.voice_storage_key||!voice.voice_original_filename||!voice.voice_content_type||!voice.voice_byte_size||!voice.voice_verified_at)throw new BadRequestException('Voice upload is not verified');
        if(!this.voiceMessageMatches(voice,await this.storage.head(voice.voice_storage_key)))throw new BadRequestException('Voice object metadata has changed');
        await this.attachments.attachAvailableWithClient(client,actor,ticket.id,{storageKey:voice.voice_storage_key,filename:voice.voice_original_filename,contentType:voice.voice_content_type,byteSize:Number(voice.voice_byte_size)});
      }
      await client.query(
        `INSERT INTO ticket_intake_provenance(organization_id,ticket_id,intake_session_id,analysis_contract_version,analysis_result,confidence_by_field)
         VALUES($1,$2,$3,$4,$5,$6)`, [actor.organizationId,ticket.id,session.id,session.analysis_contract_version,session.analysis_result,session.confidence_by_field],
      );
      await client.query("UPDATE ticket_intake_sessions SET status='CONSUMED',ticket_id=$2,consumed_at=now(),updated_at=now() WHERE id=$1",[session.id,ticket.id]);
      await this.audit(client,actor,'ticket_intake.consumed',session.id,{ticketId:ticket.id,voiceAttached:Boolean(session.voice_storage_key&&session.voice_verified_at),conversationVoiceCount:conversationVoices.length});
      return {...ticket,intakeSessionId:session.id};
    });
  }

  async createBatch(actor:TicketActor,data:CreateDraftData & {intakeSessionId:string;secondaryProposalIds?:string[]}) {
    if (!data.intakeSessionId) throw new BadRequestException('Ticket intake is required');
    if (!data.title?.trim() || data.title.trim().length<3 || data.title.trim().length>200 || !data.description?.trim() || data.description.length>10_000) throw new BadRequestException('Title and description are required');
    const selected=[...new Set((data.secondaryProposalIds??[]).filter((id):id is string=>typeof id==='string'))].slice(0,2);
    return this.database.withOrganization(actor.organizationId,async client=>{
      const session=await this.owned(client,actor,data.intakeSessionId,true);this.assertMutable(session);
      if(session.status!=='SUCCEEDED')throw new BadRequestException('Ticket intake must finish before batch creation');
      const proposals=(session.secondary_issues??[]) as Array<{id?:string;selectable?:boolean;eligible?:boolean;ticket?:CreateDraftData;summary?:string}>;
      const chosen=selected.map(id=>proposals.find(proposal=>proposal.id===id)).filter((proposal):proposal is {id:string;ticket:CreateDraftData;summary:string}=>Boolean(proposal?.id&&(proposal.selectable??proposal.eligible)&&proposal.ticket&&proposal.summary));
      if(chosen.length!==selected.length)throw new BadRequestException('Selected secondary proposal is unavailable');
      const primary=await this.tickets.createDraftWithClient(client,actor,data);await this.tickets.attachIntakeTagsWithClient(client,actor,primary.id,data.tags??[]);await this.recordTitleCandidate(client,actor,primary.id,data.title);
      if(session.voice_storage_key&&session.voice_original_filename&&session.voice_content_type&&session.voice_byte_size&&session.voice_verified_at){if(!this.voiceObjectMatches(session,await this.storage.head(session.voice_storage_key)))throw new BadRequestException('Voice object metadata has changed');await this.attachments.attachAvailableWithClient(client,actor,primary.id,{storageKey:session.voice_storage_key,filename:session.voice_original_filename,contentType:session.voice_content_type,byteSize:Number(session.voice_byte_size)});}
      const voices=(await client.query<IntakeMessageRow>("SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 AND content_type='VOICE' AND discarded_at IS NULL ORDER BY sequence_number",[session.id])).rows;
      for(const voice of voices){if(!voice.voice_storage_key||!voice.voice_original_filename||!voice.voice_content_type||!voice.voice_byte_size||!voice.voice_verified_at||!this.voiceMessageMatches(voice,await this.storage.head(voice.voice_storage_key)))throw new BadRequestException('Voice upload is not verified');await this.attachments.attachAvailableWithClient(client,actor,primary.id,{storageKey:voice.voice_storage_key,filename:voice.voice_original_filename,contentType:voice.voice_content_type,byteSize:Number(voice.voice_byte_size)});}
      await this.tickets.submitWithClient(client,actor,primary);
      const secondary=[] as Array<{id:string;ticketNumber:number;title:string}>;
      for(const proposal of chosen){const ticket=await this.tickets.createDraftWithClient(client,actor,proposal.ticket);await this.tickets.attachIntakeTagsWithClient(client,actor,ticket.id,proposal.ticket.tags??[]);await this.recordTitleCandidate(client,actor,ticket.id,proposal.ticket.title);await this.tickets.submitWithClient(client,actor,ticket);await client.query('INSERT INTO ticket_intake_secondary_ticket_links(organization_id,intake_session_id,proposal_id,primary_ticket_id,secondary_ticket_id) VALUES($1,$2,$3,$4,$5)',[actor.organizationId,session.id,proposal.id,primary.id,ticket.id]);secondary.push({id:ticket.id,ticketNumber:ticket.ticket_number,title:ticket.title});}
      await client.query(`INSERT INTO ticket_intake_provenance(organization_id,ticket_id,intake_session_id,analysis_contract_version,analysis_result,confidence_by_field) VALUES($1,$2,$3,$4,$5,$6)`,[actor.organizationId,primary.id,session.id,session.analysis_contract_version,session.analysis_result,session.confidence_by_field]);
      await client.query("UPDATE ticket_intake_sessions SET status='CONSUMED',ticket_id=$2,consumed_at=now(),updated_at=now() WHERE id=$1",[session.id,primary.id]);
      await this.audit(client,actor,'ticket_intake.batch_consumed',session.id,{primaryTicketId:primary.id,secondaryTicketIds:secondary.map(item=>item.id),secondaryProposalIds:selected,conversationVoiceCount:voices.length});
      return {primary:{id:primary.id,ticketNumber:primary.ticket_number,title:primary.title},secondary,intakeSessionId:session.id};
    });
  }

  async cleanupExpired(limit=100) {
    const rows = (await this.database.query<{id:string;organization_id:string;voice_storage_key:string|null;smart_action_key:string|null}>(
      `SELECT id,organization_id,voice_storage_key,smart_action_key FROM ticket_intake_sessions
       WHERE expires_at<=now() AND status NOT IN ('CONSUMED','EXPIRED') ORDER BY expires_at LIMIT $1`, [Math.min(500,Math.max(1,limit))],
    )).rows;
    let cleaned=0;
    for (const row of rows) {
      try {
        if (row.voice_storage_key) await this.storage.delete(row.voice_storage_key);
        const messageKeys=(await this.database.withOrganization(row.organization_id,client=>client.query<{voice_storage_key:string}>('SELECT voice_storage_key FROM ticket_intake_messages WHERE intake_session_id=$1 AND voice_storage_key IS NOT NULL',[row.id]).then(result=>result.rows))).map(message=>message.voice_storage_key);
        for(const key of messageKeys)await this.storage.delete(key);
        cleaned += await this.database.withOrganization(row.organization_id, async (client) => (await client.query(
          "UPDATE ticket_intake_sessions SET status='EXPIRED',processing_started_at=NULL,next_attempt_at=NULL,updated_at=now() WHERE id=$1 AND expires_at<=now() AND status NOT IN ('CONSUMED','EXPIRED')",[row.id],
        )).rowCount ?? 0);
        if(row.smart_action_key)await this.commercial.releaseSmartAction(row.organization_id,row.smart_action_key);
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

  private async resetUnreservedAnalysis(organizationId:string,id:string,actionKey:string) {
    await this.database.withOrganization(organizationId,client=>client.query(
      `UPDATE ticket_intake_sessions SET status='CREATED',smart_action_key=NULL,processing_started_at=NULL,next_attempt_at=NULL,updated_at=now()
       WHERE id=$1 AND smart_action_key=$2 AND status IN ('TRANSCRIBING','ANALYZING')`,[id,actionKey],
    ));
  }

  private hasUsableSuggestion(result:Record<string,unknown>) {
    const suggestions=result.suggestions;
    return Boolean(suggestions && typeof suggestions==='object' && Object.keys(suggestions as object).length);
  }

  private async context(organizationId:string,description:string,messages: IntakeMessageRow[]=[],previousPrimaryIssue:TicketIntakeContext['previousPrimaryIssue']=undefined):Promise<TicketIntakeContext> {
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
      return {description:redactForAi(description),messages:messages.map(message=>({role:message.role,contentType:message.content_type,text:redactForAi(message.content_type==='VOICE'?(message.transcript??''):(message.text_content??''))})),previousPrimaryIssue,categories,subcategories,departments,locations,disciplines,customFields,titleLibrary,tags};
    });
  }

  private validateAnalysis(output:TicketIntakeProviderOutput, context:TicketIntakeContext, allowLowConfidence=false) {
    if (output.contractVersion !== TICKET_INTAKE_CONTRACT_VERSION) throw new Error('analysis_contract_invalid');
    const confidenceByField=Object.fromEntries(Object.entries(output.confidenceByField??{}).filter(([,value])=>typeof value==='number'&&Number.isFinite(value)).map(([key,value])=>[key,Math.max(0,Math.min(1,value))]));
    const suggestions:Record<string,unknown>={}; const rejectedFields:string[]=[];
    const accepted=(field:string)=>allowLowConfidence||Number(confidenceByField[field])>=confidenceThreshold;
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
      return allowLowConfidence||Number(confidence)>=confidenceThreshold;
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
  private voiceMessageMatches(message:IntakeMessageRow,object:StoredObject|undefined) {
    if(!object||!message.voice_content_type||!message.voice_byte_size||!message.voice_duration_seconds)return false;
    const actualDuration=Number(object.metadata?.['duration-seconds']??object.metadata?.durationSeconds);
    return object.contentType?.toLowerCase()===message.voice_content_type.toLowerCase()&&object.contentLength===Number(message.voice_byte_size)&&Number.isFinite(actualDuration)&&Math.abs(actualDuration-Number(message.voice_duration_seconds))<0.01;
  }
  private voiceObjectMatches(session:IntakeRow,object:StoredObject|undefined) {
    if (!object||!session.voice_content_type||!session.voice_byte_size||!session.voice_duration_seconds) return false;
    const actualDuration=Number(object.metadata?.['duration-seconds']??object.metadata?.durationSeconds);
    return object.contentType?.toLowerCase()===session.voice_content_type.toLowerCase()
      && object.contentLength===Number(session.voice_byte_size)&&Number.isFinite(actualDuration)
      && Math.abs(actualDuration-Number(session.voice_duration_seconds))<0.01;
  }
  private combine(source:string,transcript:string) { return (source.trim()?`${source.trim()}\n\nمتن پیاده‌سازی‌شده صدا:\n${transcript}`:transcript).slice(0,30_000); }
  private combineConversation(messages:IntakeMessageRow[]) {
    return messages.filter(message=>message.role==='USER').map((message,index)=>{
      const text=message.content_type==='VOICE'?(message.transcript??''):message.text_content??'';
      return `پیام کاربر ${index+1}${message.content_type==='VOICE'?' (متن پیاده‌سازی‌شده صوت)':''}:\n${text}`;
    }).filter(Boolean).join('\n\n').slice(0,30_000);
  }
  private async nextMessageSequence(client:ScopedClient,intakeId:string) {
    const result=(await client.query('SELECT count(*) FILTER (WHERE role=\'USER\')::int AS user_count,COALESCE(max(sequence_number),0)::int AS sequence FROM ticket_intake_messages WHERE intake_session_id=$1 AND discarded_at IS NULL',[intakeId])).rows[0] as {user_count:number;sequence:number}|undefined;
    if((result?.user_count??0)>=5)throw new BadRequestException('An intake supports at most five requester messages');return (result?.sequence??0)+1;
  }
  private async combinedUserMessageText(client:ScopedClient,intakeId:string) { return this.combineConversation((await client.query('SELECT * FROM ticket_intake_messages WHERE intake_session_id=$1 AND discarded_at IS NULL ORDER BY sequence_number',[intakeId])).rows as IntakeMessageRow[]); }
  private async ownedMessage(client:ScopedClient,intakeId:string,messageId:string,lock=false) { const row=(await client.query(`SELECT * FROM ticket_intake_messages WHERE id=$1 AND intake_session_id=$2${lock?' FOR UPDATE':''}`,[messageId,intakeId])).rows[0] as IntakeMessageRow|undefined;if(!row)throw new NotFoundException('Ticket intake message not found');return row; }
  private assertNotProcessing(row:IntakeRow) { if(processingStates.has(row.status))throw new BadRequestException('Ticket intake is being processed'); }
  private safeText(value:unknown,max:number) { return typeof value==='string'&&value.trim()?value.trim().slice(0,max):null; }
  private validIssue(value:unknown) { if(!value||typeof value!=='object')return null;const item=value as {summary?:unknown;serviceAsset?:unknown;issueType?:unknown;confidence?:unknown};const summary=this.safeText(item.summary,500);if(!summary||typeof item.confidence!=='number'||!Number.isFinite(item.confidence))return null;return {summary,serviceAsset:this.safeText(item.serviceAsset,100),issueType:this.safeText(item.issueType,100),confidence:Math.max(0,Math.min(1,item.confidence))}; }
  private validIssues(value:unknown) { return Array.isArray(value)?value.map(item=>{const issue=this.validIssue({...item,serviceAsset:null,issueType:null});return issue?{summary:issue.summary,confidence:issue.confidence}:null;}).filter((item):item is {summary:string;confidence:number}=>Boolean(item)).slice(0,2):[]; }
  private secondaryProposals(output:TicketIntakeProviderOutput,context:TicketIntakeContext) {
    return (output.secondaryIssues??[]).slice(0,2).map(issue=>{
      const summary=this.safeText(issue.summary,500);const description=this.safeText(issue.description,10_000);const confidence=typeof issue.confidence==='number'&&Number.isFinite(issue.confidence)?Math.max(0,Math.min(1,issue.confidence)):0;
       if(!summary||!description||description.length<3)return {id:randomUUID(),summary:summary??'مورد ثانویه',confidence,selectable:false,requiresReview:true};
       const validated=this.validateAnalysis({...output,...issue,contractVersion:TICKET_INTAKE_CONTRACT_VERSION,titleLibraryId:null,customFields:issue.customFields??{},tags:issue.tags??[],confidenceByField:issue.confidenceByField??{},missingFields:[],interpretation:undefined,primaryIssue:undefined,secondaryIssues:[],clarificationQuestion:null,clarificationConfidence:null},context,true);
       const suggestions=validated.result.suggestions as CreateDraftData;const taxonomyFields=new Set(['categoryId','subcategoryId','departmentId','locationId','disciplineId']);const hasInvalidTaxonomy=validated.rejectedFields.some(field=>taxonomyFields.has(field));const selectable=!hasInvalidTaxonomy&&typeof suggestions.title==='string'&&typeof suggestions.priority==='string';
       return {id:randomUUID(),summary,confidence,selectable,requiresReview:confidence<confidenceThreshold,ticket:selectable?{...suggestions,description}:undefined};
     }).filter(Boolean) as Array<{id:string;summary:string;confidence:number;selectable:boolean;requiresReview:boolean;ticket?:CreateDraftData}>;
  }
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
      interpretation:row.conversation_summary,primaryIssue:row.primary_issue,secondaryIssues:row.secondary_issues??[],clarificationQuestion:row.clarification_question,clarificationConfidence:row.clarification_confidence===null?null:Number(row.clarification_confidence),
      attemptCount:row.attempt_count,lastErrorCode:row.last_error_code,ticketId:row.ticket_id,expiresAt:row.expires_at,createdAt:row.created_at,updatedAt:row.updated_at };
  }
  private presentMessage(message:IntakeMessageRow) { return {id:message.id,sequence:message.sequence_number,role:message.role,contentType:message.content_type,text:message.text_content,transcript:message.transcript,voice:message.voice_original_filename?{filename:message.voice_original_filename,contentType:message.voice_content_type,byteSize:Number(message.voice_byte_size),durationSeconds:Number(message.voice_duration_seconds),verified:Boolean(message.voice_verified_at)}:null,createdAt:message.created_at}; }
  private async audit(client:{query:Function},actor:Pick<TicketActor,'userId'|'organizationId'>,action:string,targetId:string,metadata:object) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,NULLIF($2,\'\')::uuid,$3,\'ticket_intake\',$4,$5)',[actor.organizationId,actor.userId,action,targetId,metadata]);
  }
}
