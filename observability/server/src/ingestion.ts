import { validateBatch, validateEvent, isUuid, ContractError, type TelemetryEvent, type EventAcknowledgement, type BatchAcknowledgement } from '@observability/contracts';
import { sanitizeEvent, enforceScope, fingerprint, FINGERPRINT_VERSION, sha256, canonicalJson } from '@observability/core';
import { HubDatabase, type DataScope } from './database.js';
import {SelfMonitoringService} from './self-monitoring.js';

export interface IngestionScope extends DataScope {source:'BROWSER'|'SERVER';}
export class IngestionService {
  readonly metrics:SelfMonitoringService;
  constructor(private readonly database:HubDatabase,metrics?:SelfMonitoringService){this.metrics=metrics??new SelfMonitoringService(database);}
  async ingest(body:unknown,scope:IngestionScope):Promise<BatchAcknowledgement>{
    let events:unknown[];try{events=validateBatch(body);}catch(error){this.metrics.record(scope);throw error;}const acknowledgements:EventAcknowledgement[]=[];let persistenceUnavailable=false;
    for(const raw of events){
      let event:TelemetryEvent;
      try{
        const parsed=validateEvent(raw);
        // Server credentials may authorize tenant attribution from the trusted
        // consumer backend; browser attribution can never override its grant.
        const tenant=scope.source==='SERVER'&&scope.tenantAll?parsed.tenantReference??null:scope.tenantReference;
        const actor=scope.source==='SERVER'?parsed.actorReference??scope.actorReference:scope.actorReference;
        event=sanitizeEvent(enforceScope(parsed,{...scope,tenantReference:tenant,actorReference:actor}));
        if(scope.source==='BROWSER'&&event.source!=='BROWSER')throw new ContractError('UNTRUSTED_SOURCE');
      }catch(error){acknowledgements.push({eventId:typeof raw==='object'&&raw!==null&&'eventId' in raw&&isUuid(raw.eventId)?raw.eventId:'invalid',status:'REJECTED',reasonCode:error instanceof ContractError?error.reasonCode:'INVALID_EVENT'});continue;}
      // One storage failure must not multiply a connect timeout by 50 events.
      // Remaining valid entries keep their IDs and are safely retried later.
      if(persistenceUnavailable){acknowledgements.push({eventId:event.eventId,status:'RETRYABLE',reasonCode:'PERSISTENCE_UNAVAILABLE'});continue;}
      try{acknowledgements.push(await this.persist(event,scope));}catch{persistenceUnavailable=true;acknowledgements.push({eventId:event.eventId,status:'RETRYABLE',reasonCode:'PERSISTENCE_UNAVAILABLE'});}
    }
    const result:BatchAcknowledgement={schemaVersion:'1.1',acknowledgements};this.metrics.record(scope,result);return result;
  }
  private async persist(event:TelemetryEvent,scope:IngestionScope):Promise<EventAcknowledgement>{
    const digest=await sha256(canonicalJson(event)),print=await fingerprint(event);
    return this.database.scoped({...scope,tenantReference:event.tenantReference??null},async client=>{
      const eligible=await client.query('SELECT 1 FROM observability.applications a JOIN observability.environments e ON e.application_id=a.id WHERE a.id=$1 AND e.id=$2 AND a.enabled=true AND e.enabled=true',[event.applicationId,event.environmentId]);
      if(!eligible.rowCount)return {eventId:event.eventId,status:'REJECTED',reasonCode:'APPLICATION_UNAVAILABLE'};
      const inserted=await client.query(`INSERT INTO observability.ingestion_receipts(application_id,environment_id,event_id,tenant_reference,actor_reference,payload_hash) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING event_id`,[event.applicationId,event.environmentId,event.eventId,event.tenantReference??null,event.actorReference??null,digest]);
      if(!inserted.rowCount){const receipt=(await client.query<{payload_hash:string}>('SELECT payload_hash FROM observability.ingestion_receipts WHERE application_id=$1 AND environment_id=$2 AND event_id=$3',[event.applicationId,event.environmentId,event.eventId])).rows[0];return {eventId:event.eventId,status:receipt?.payload_hash===digest?'DUPLICATE':'REJECTED',...(receipt?.payload_hash===digest?{}:{reasonCode:'EVENT_ID_CONFLICT'})};}
      const columns=['application_id','environment_id','event_id','schema_version','occurred_at','release_version','source','category','severity','event_code','normalized_message','exception_type','sanitized_stack','fingerprint','fingerprint_version','trace_id','span_id','request_id','actor_reference','tenant_reference','session_correlation_id','operation_name','route_template','http_status','duration_ms','browser_family','browser_version','operating_system','device_class','connectivity_state','safe_metadata','attribution'];
      const values=[event.applicationId,event.environmentId,event.eventId,event.schemaVersion,event.occurredAt,event.releaseVersion,event.source,event.category,event.severity,event.eventCode,event.normalizedMessage,event.exceptionType,event.sanitizedStack,print,FINGERPRINT_VERSION,event.traceId,event.spanId,event.requestId,event.actorReference,event.tenantReference,event.sessionCorrelationId,event.operationName,event.routeTemplate,event.httpStatus,event.durationMs,event.browserFamily,event.browserVersion,event.operatingSystem,event.deviceClass,event.connectivityState,event.safeMetadata??{},event.actorReference?'TRUSTED':'UNATTRIBUTED'];
      await client.query(`INSERT INTO observability.events(${columns.join(',')}) VALUES(${values.map((_,i)=>`$${i+1}`).join(',')})`,values);
      await client.query(`INSERT INTO observability.jobs(application_id,environment_id,tenant_reference,event_id,kind,dedupe_key) VALUES($1,$2,$3,$4,'AGGREGATE',$5)`,[event.applicationId,event.environmentId,event.tenantReference??null,event.eventId,event.eventId]);
      return {eventId:event.eventId,status:'ACCEPTED'};
    });
  }
}
