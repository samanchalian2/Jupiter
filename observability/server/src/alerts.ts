import { ContractError,isUuid } from '@observability/contracts';
import { HubDatabase } from './database.js';
import { RegistryService } from './registry.js';
import { DurableQueue,type LeasedJob } from './queue.js';
import type { OperationScope } from './operations.js';

export class AlertService {
 readonly queue:DurableQueue;
 constructor(private readonly database:HubDatabase,private readonly registry:RegistryService){this.queue=new DurableQueue(database);}
 /** Bounded repair sweep covers an alert committed before a host crash. */
 async enqueue(limit=100){return this.database.worker(async c=>{
  const rows=(await c.query<{id:string;application_id:string;environment_id:string;tenant_reference:string|null}>(`SELECT a.id,a.application_id,a.environment_id,a.tenant_reference FROM observability.alerts a JOIN observability.applications p ON p.id=a.application_id JOIN observability.environments e ON e.id=a.environment_id WHERE p.enabled AND e.enabled AND NOT EXISTS(SELECT 1 FROM observability.jobs j WHERE j.application_id=a.application_id AND j.environment_id=a.environment_id AND j.kind='ALERT_DELIVERY' AND j.dedupe_key='alert:'||a.id::text) ORDER BY a.created_at,a.id LIMIT $1`,[Math.max(1,Math.min(500,limit))])).rows;
  let count=0;for(const alert of rows.sort((a,b)=>`${a.application_id}:${a.environment_id}`.localeCompare(`${b.application_id}:${b.environment_id}`))){await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`obs-maintenance:${alert.application_id}:${alert.environment_id}`]);const result=await c.query("INSERT INTO observability.jobs(application_id,environment_id,tenant_reference,kind,dedupe_key,available_at) SELECT application_id,environment_id,tenant_reference,'ALERT_DELIVERY',$4,GREATEST(now(),COALESCE((SELECT max(j.available_at)+interval '15 seconds' FROM observability.jobs j WHERE j.application_id=$1 AND j.environment_id=$2 AND j.kind='ALERT_DELIVERY' AND length(j.dedupe_key)=42),now())) FROM observability.alerts WHERE id=$5 AND application_id=$1 AND environment_id=$2 AND tenant_reference IS NOT DISTINCT FROM $3 ON CONFLICT(application_id,environment_id,kind,dedupe_key) DO NOTHING",[alert.application_id,alert.environment_id,alert.tenant_reference,`alert:${alert.id}`,alert.id]);count+=result.rowCount??0;}return{enqueued:count};
 });}
 async deliver(job:LeasedJob){
  const match=/^alert:([0-9a-f-]{36})(?::([0-9a-f-]{36}))?$/.exec(job.dedupe_key);
  if(job.kind!=='ALERT_DELIVERY'||!match)throw new ContractError('INVALID_ALERT_JOB');
  return this.queue.complete(job,async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`obs-maintenance:${job.application_id}:${job.environment_id}`]);
   const alert=(await c.query<{id:string;tenant_reference:string|null;delivery_cursor:string|null;delivery_completed_at:Date|null}>('SELECT id,tenant_reference,delivery_cursor,delivery_completed_at FROM observability.alerts WHERE id=$1 AND application_id=$2 AND environment_id=$3 FOR UPDATE',[match[1],job.application_id,job.environment_id])).rows[0];
   if(!alert||alert.tenant_reference!==job.tenant_reference)throw new ContractError('ALERT_SCOPE_MISMATCH');
   if(alert.delivery_completed_at)return;
   if(alert.delivery_cursor!==(match[2]??null))throw new ContractError('ALERT_CURSOR_MISMATCH');
   // Registry reads occur under the limited control role, never bypassing user
   // authorization. Only scoped active operators are recipients; no tenant users.
   await c.query('SET LOCAL ROLE observability_control');
   const enabled=(await c.query('SELECT 1 FROM observability.applications a JOIN observability.environments e ON e.application_id=a.id WHERE a.id=$1 AND e.id=$2 AND a.enabled AND e.enabled',[job.application_id,job.environment_id])).rowCount;
   if(!enabled)throw new ContractError('APPLICATION_UNAVAILABLE');
   const recipients=(await c.query<{id:string}>(`SELECT p.id FROM observability.principals p WHERE p.active AND ($4::uuid IS NULL OR p.id>$4) AND (EXISTS(SELECT 1 FROM observability.global_grants g WHERE g.principal_id=p.id AND g.permission='HUB_SUPER_ADMIN' AND g.revoked_at IS NULL) OR EXISTS(SELECT 1 FROM observability.access_grants g WHERE g.principal_id=p.id AND g.application_id=$1 AND (g.environment_id IS NULL OR g.environment_id=$2) AND (g.tenant_reference IS NULL OR g.tenant_reference=$3) AND g.role IN ('ADMIN','OPERATOR') AND g.revoked_at IS NULL)) ORDER BY p.id LIMIT 101`,[job.application_id,job.environment_id,job.tenant_reference,alert.delivery_cursor])).rows;
   await c.query('SET LOCAL ROLE observability_worker');
   for(const recipient of recipients.slice(0,100))await c.query('INSERT INTO observability.alert_inbox(application_id,environment_id,tenant_reference,alert_id,recipient_principal_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(alert_id,recipient_principal_id) DO NOTHING',[job.application_id,job.environment_id,job.tenant_reference,alert.id,recipient.id]);
   const cursor=recipients[Math.min(99,recipients.length-1)]?.id??alert.delivery_cursor;
   await c.query('UPDATE observability.alerts SET delivery_cursor=$1,delivery_completed_at=CASE WHEN $2 THEN now() ELSE NULL END WHERE id=$3 AND application_id=$4 AND environment_id=$5',[cursor,recipients.length<=100,alert.id,job.application_id,job.environment_id]);
   if(recipients.length>100)await c.query("INSERT INTO observability.jobs(application_id,environment_id,tenant_reference,kind,dedupe_key) VALUES($1,$2,$3,'ALERT_DELIVERY',$4) ON CONFLICT(application_id,environment_id,kind,dedupe_key) DO NOTHING",[job.application_id,job.environment_id,job.tenant_reference,`alert:${alert.id}:${cursor}`]);
  });
 }
 async inbox(principalId:string,input:OperationScope){
  const scope=await this.registry.dataScope(principalId,input,['ADMIN','OPERATOR']);
  return this.database.scoped(scope,async c=>{await c.query("SELECT set_config('obs.principal',$1,true)",[principalId]);return(await c.query('SELECT i.id,i.alert_id,a.incident_id,a.title,i.delivered_at,i.read_at FROM observability.alert_inbox i JOIN observability.alerts a ON a.id=i.alert_id AND a.application_id=i.application_id AND a.environment_id=i.environment_id WHERE i.application_id=$1 AND i.environment_id=$2 AND i.recipient_principal_id=$3 ORDER BY i.delivered_at DESC,i.id DESC LIMIT 100',[scope.applicationId,scope.environmentId,principalId])).rows;},c=>this.registry.authorize(c,principalId,scope.applicationId,['ADMIN','OPERATOR'],scope.environmentId,scope.tenantAll?undefined:scope.tenantReference));
 }
 async markRead(principalId:string,input:OperationScope,id:string){
  if(!isUuid(id))throw new ContractError('INVALID_ALERT_REFERENCE');const scope=await this.registry.dataScope(principalId,input,['ADMIN','OPERATOR']);
  return this.database.scoped(scope,async c=>{await c.query("SELECT set_config('obs.principal',$1,true)",[principalId]);const row=(await c.query('UPDATE observability.alert_inbox SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND application_id=$2 AND environment_id=$3 AND recipient_principal_id=$4 RETURNING id,read_at',[id,scope.applicationId,scope.environmentId,principalId])).rows[0];if(!row)throw new ContractError('ALERT_NOT_FOUND');return row;},c=>this.registry.authorize(c,principalId,scope.applicationId,['ADMIN','OPERATOR'],scope.environmentId,scope.tenantAll?undefined:scope.tenantReference));
 }
}
