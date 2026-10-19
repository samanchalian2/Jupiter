import {randomUUID} from 'node:crypto';
import {ContractError,validateSdkMetricReport,type BatchAcknowledgement} from '@observability/contracts';
import {canonicalJson,sha256} from '@observability/core';
import {HubDatabase} from './database.js';
import {RegistryService} from './registry.js';
import {HubDiagnosticReporter} from './diagnostics.js';
const fields=['received_events','accepted_events','duplicate_events','rejected_events','retryable_events','failed_batches','dropped_events','recovered_events','recovery_failed_events'] as const;
type Counters=Record<typeof fields[number],number>;
const empty=():Counters=>Object.fromEntries(fields.map(key=>[key,0])) as Counters;
type Report={applicationId:string;environmentId:string;reportId:string;observedAt:string;counters:Counters};
const storageTables=['events','ingestion_receipts','jobs','issues','issue_events','incidents','incident_activity','feedback','feedback_replies','alerts','alert_inbox','aggregates','investigations','ai_attempts','maintenance_state','health_reports','storage_samples'] as const;
/** Metrics never enter the Issue/AI/event ingestion pipeline. */
export class SelfMonitoringService {
 private readonly buffer=new Map<string,Report>();private retry:Report[]=[];private flushing?:Promise<void>;private retryAfter=0;
 private readonly diagnostics:HubDiagnosticReporter;
 constructor(private readonly database:HubDatabase,private readonly registry?:RegistryService,sink:(entry:unknown)=>void=entry=>console.warn(JSON.stringify(entry))){this.diagnostics=new HubDiagnosticReporter(sink);}
 record(scope:{applicationId:string;environmentId:string},ack?:BatchAcknowledgement){
  const key=`${scope.applicationId}:${scope.environmentId}`;let report=this.buffer.get(key);
  if(!report){if(this.buffer.size+this.retry.length>=200){this.diagnostics.report('METRICS_BUFFER_FULL');return;}report={applicationId:scope.applicationId,environmentId:scope.environmentId,reportId:randomUUID(),observedAt:new Date().toISOString(),counters:empty()};this.buffer.set(key,report);}
  const counters=report.counters;if(!ack)counters.failed_batches++;
  else{counters.received_events+=ack.acknowledgements.length;for(const item of ack.acknowledgements)counters[({ACCEPTED:'accepted_events',DUPLICATE:'duplicate_events',REJECTED:'rejected_events',RETRYABLE:'retryable_events'} as const)[item.status]]++;if(ack.acknowledgements.some(a=>a.status==='RETRYABLE'))counters.failed_batches++;}
  for(const field of fields)if(counters[field]>1_000_000_000){counters[field]=1_000_000_000;this.diagnostics.report('METRICS_BUFFER_FULL');}
  void this.flush();
 }
 async flush(){
  if(this.flushing)return this.flushing;if(Date.now()<this.retryAfter||!this.retry.length&&!this.buffer.size)return;
  this.flushing=(async()=>{try{
   if(!this.retry.length){this.retry=[...this.buffer.values()];this.buffer.clear();}
   while(this.retry.length){const report=this.retry[0];await this.insert(report,null,'SERVER_MEASURED',null);this.retry.shift();}
  }catch{this.retryAfter=Date.now()+60_000;this.diagnostics.report('METRICS_STORAGE_UNAVAILABLE');}finally{this.flushing=undefined;}})();return this.flushing;
 }
 private async insert(report:Report,tenant:string|null,provenance:string,actor:string|null){
  const hash=await sha256(canonicalJson({report,tenant,provenance,actor}));
  return this.database.worker(async c=>{
   const result=await c.query(`INSERT INTO observability.health_reports(application_id,environment_id,report_id,tenant_reference,provenance,observed_at,payload_hash,${fields.join(',')}) VALUES(${Array.from({length:7+fields.length},(_,i)=>`$${i+1}`).join(',')}) ON CONFLICT DO NOTHING`,[report.applicationId,report.environmentId,report.reportId,tenant,provenance,report.observedAt,hash,...fields.map(key=>report.counters[key])]);
   if(!result.rowCount){const old=(await c.query('SELECT payload_hash FROM observability.health_reports WHERE application_id=$1 AND environment_id=$2 AND report_id=$3',[report.applicationId,report.environmentId,report.reportId])).rows[0];if(old?.payload_hash!==hash)throw new ContractError('METRIC_ID_CONFLICT');}
   return{accepted:true,duplicate:!result.rowCount};
  });
 }
 async reportSdk(scope:{applicationId:string;environmentId:string;tenantReference:string|null;actorReference:string|null;source:string},raw:unknown){
  const value=validateSdkMetricReport(raw),counters=empty();counters.dropped_events=value.counters.dropped;counters.recovered_events=value.counters.retryDelivered;counters.recovery_failed_events=value.counters.retryDropped;
  return this.insert({applicationId:scope.applicationId,environmentId:scope.environmentId,reportId:value.reportId,observedAt:value.observedAt,counters},scope.tenantReference,scope.source==='BROWSER'?'CLIENT_REPORTED':'SERVER_SDK_REPORTED',scope.actorReference);
 }
 async sampleStorage(limit=10){
  const rows=await this.database.worker(async c=>(await c.query<{application_id:string;id:string}>(`SELECT e.application_id,e.id FROM observability.environments e JOIN observability.applications a ON a.id=e.application_id WHERE a.enabled AND e.enabled AND NOT EXISTS(SELECT 1 FROM observability.storage_samples s WHERE s.application_id=e.application_id AND s.environment_id=e.id AND s.bucket_start=date_trunc('hour',now())) ORDER BY e.application_id,e.id LIMIT $1`,[Math.max(1,Math.min(100,Math.trunc(limit)))])).rows);
  let sampled=0;for(const row of rows)sampled+=await this.database.worker(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`obs-storage:${row.application_id}:${row.id}`]);
   const exists=await c.query("SELECT 1 FROM observability.storage_samples WHERE application_id=$1 AND environment_id=$2 AND bucket_start=date_trunc('hour',now())",[row.application_id,row.id]);if(exists.rowCount)return 0;
   // Table identifiers are a fixed source-code allowlist, never request input.
   const bytes=(await c.query<{total:string}>(`SELECT sum(bytes)::text total FROM (${storageTables.map(table=>`SELECT COALESCE(sum(pg_column_size(t)),0) bytes FROM observability.${table} t WHERE application_id=$1 AND environment_id=$2`).join(' UNION ALL ')}) measured`,[row.application_id,row.id])).rows[0].total;
   await c.query("INSERT INTO observability.storage_samples(application_id,environment_id,bucket_start,logical_bytes) VALUES($1,$2,date_trunc('hour',now()),$3) ON CONFLICT DO NOTHING",[row.application_id,row.id,bytes]);return 1;
  });return{sampled};
 }
 async status(principalId:string,applicationId:string,environmentId:string){
  if(!this.registry)throw new ContractError('REGISTRY_REQUIRED');const registry=this.registry,scope=await registry.dataScope(principalId,{applicationId,environmentId},['ADMIN']);
  return this.database.scoped(scope,async c=>{
   const totals=(await c.query(`SELECT provenance,max(received_at) last_report_at,${fields.map(key=>`COALESCE(sum(${key}),0)::float ${key}`).join(',')} FROM observability.health_reports WHERE application_id=$1 AND environment_id=$2 AND observed_at>now()-interval '1 hour' AND observed_at<=now() GROUP BY provenance`,[applicationId,environmentId])).rows;
   const sources=Object.fromEntries(['SERVER_MEASURED','CLIENT_REPORTED','SERVER_SDK_REPORTED'].map(source=>{const row=totals.find(r=>r.provenance===source),counters=Object.fromEntries(fields.map(key=>[key,Number(row?.[key]??0)])) as Counters;return[source,{...counters,last_report_at:row?.last_report_at??null,ingestion_rate_per_second:counters.accepted_events/3600,recovery_rate:counters.recovered_events+counters.recovery_failed_events?counters.recovered_events/(counters.recovered_events+counters.recovery_failed_events):null}];}));
   const queue=(await c.query("SELECT count(*) FILTER(WHERE status IN ('PENDING','RUNNING'))::int queue_depth,GREATEST(0,EXTRACT(epoch FROM now()-min(created_at) FILTER(WHERE kind='AGGREGATE' AND status IN ('PENDING','RUNNING'))))::float aggregation_lag_seconds,count(*) FILTER(WHERE kind='ALERT_DELIVERY' AND status='FAILED' AND completed_at>now()-interval '1 hour')::int alert_delivery_failures FROM observability.jobs WHERE application_id=$1 AND environment_id=$2",[applicationId,environmentId])).rows[0];
   const ai=(await c.query("SELECT count(*)::int ai_failures FROM observability.investigations WHERE application_id=$1 AND environment_id=$2 AND status='FAILED' AND completed_at>now()-interval '1 hour'",[applicationId,environmentId])).rows[0];
   const issues=(await c.query("SELECT count(*)::int unresolved_issues FROM observability.issues WHERE application_id=$1 AND environment_id=$2 AND status NOT IN ('RESOLVED','IGNORED')",[applicationId,environmentId])).rows[0];
   const samples=(await c.query('SELECT measured_at,logical_bytes::float logical_bytes FROM observability.storage_samples WHERE application_id=$1 AND environment_id=$2 ORDER BY bucket_start DESC LIMIT 2',[applicationId,environmentId])).rows;
   const lag=(await c.query("SELECT COALESCE(max(GREATEST(0,EXTRACT(epoch FROM now()-(e.received_at+a.raw_retention_days*interval '1 day')))),0)::float retention_lag_seconds FROM observability.events e JOIN observability.applications a ON a.id=e.application_id WHERE e.application_id=$1 AND e.environment_id=$2",[applicationId,environmentId])).rows[0];
   return{window_seconds:3600,sources,...queue,...ai,...issues,...lag,storage:{basis:'LOGICAL_ENVIRONMENT_ROWS',latest_at:samples[0]?.measured_at??null,logical_bytes:samples[0]?.logical_bytes??null,growth_bytes:samples.length===2?samples[0].logical_bytes-samples[1].logical_bytes:null,interval_seconds:samples.length===2?(new Date(samples[0].measured_at).getTime()-new Date(samples[1].measured_at).getTime())/1000:null},coverage:'SCOPED_DIAGNOSTIC_METRICS'};
  },c=>registry.authorize(c,principalId,applicationId,['ADMIN'],environmentId));
 }
}
