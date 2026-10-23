import { ContractError } from '@observability/contracts';
import { redactText } from '@observability/core';
import { HubDatabase } from './database.js';
import { RegistryService } from './registry.js';
const defaults=[['WORKER_FAILURE',1,1],['CRITICAL_EVENT',1,1],['ISSUE_REOPENED',1,1],['ERROR_BURST',5,5],['ERROR_RATE',0.2,20],['RELEASE_REGRESSION',2,10],['BUSINESS_FAILURE',3,5],['SLOW_OPERATION',1000,5],['CONNECTIVITY_FAILURE',5,5],['USER_IMPACT',5,5]] as const;
type Rule={code:typeof defaults[number][0];threshold:number;minimum_samples:number;window_seconds:number;cooldown_seconds:number;};
export class MonitoringEngine {
 constructor(private readonly database:HubDatabase,private readonly registry:RegistryService){}
 async ensureDefaults(applicationId:string){return this.database.control(async c=>{for(const [code,threshold,min] of defaults)await c.query('INSERT INTO observability.monitoring_rules(application_id,code,threshold,minimum_samples) VALUES($1,$2,$3,$4) ON CONFLICT(application_id,code) DO NOTHING',[applicationId,code,threshold,min]);});}
 async configure(principalId:string,applicationId:string,input:Rule&{enabled:boolean;reason:string}){
  if(!defaults.some(d=>d[0]===input.code)||!Number.isFinite(input.threshold)||input.threshold<=0||input.code==='ERROR_RATE'&&input.threshold>1||!Number.isInteger(input.minimum_samples)||input.minimum_samples<1||input.minimum_samples>10000||!Number.isInteger(input.window_seconds)||input.window_seconds<60||input.window_seconds>86400||!Number.isInteger(input.cooldown_seconds)||input.cooldown_seconds<60||input.cooldown_seconds>86400||typeof input.enabled!=='boolean'||typeof input.reason!=='string'||input.reason.trim().length<3||input.reason.length>500)throw new ContractError('INVALID_RULE');
  return this.database.control(async c=>{await this.registry.authorize(c,principalId,applicationId,['ADMIN']);await c.query('INSERT INTO observability.monitoring_rules(application_id,code,threshold,minimum_samples,window_seconds,cooldown_seconds,enabled) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(application_id,code) DO UPDATE SET threshold=EXCLUDED.threshold,minimum_samples=EXCLUDED.minimum_samples,window_seconds=EXCLUDED.window_seconds,cooldown_seconds=EXCLUDED.cooldown_seconds,enabled=EXCLUDED.enabled',[applicationId,input.code,input.threshold,input.minimum_samples,input.window_seconds,input.cooldown_seconds,input.enabled]);await c.query('INSERT INTO observability.audit(application_id,actor_principal_id,action,reason,metadata) VALUES($1,$2,$3,$4,$5)',[applicationId,principalId,'MONITORING_RULE_CHANGED',redactText(input.reason),{code:input.code,enabled:input.enabled}]);});
 }
 async evaluate(limit=100){return this.database.worker(async c=>{
  const issues=(await c.query<{id:string;application_id:string;environment_id:string;tenant_reference:string|null;title:string;severity:string;status:string;last_seen:Date}>(`SELECT i.* FROM observability.issues i JOIN observability.applications a ON a.id=i.application_id WHERE a.enabled AND i.status NOT IN ('RESOLVED','IGNORED') AND i.last_seen>now()-interval '24 hours' ORDER BY i.last_seen DESC LIMIT $1`,[Math.min(500,Math.max(1,limit))])).rows;
  let created=0;
  for(const issue of issues){
   const rules=(await c.query<Rule>('SELECT * FROM observability.monitoring_rules WHERE application_id=$1 AND enabled=true',[issue.application_id])).rows.sort((a,b)=>defaults.findIndex(d=>d[0]===a.code)-defaults.findIndex(d=>d[0]===b.code));
   for(const rule of rules){
    const stat=(await c.query<{samples:number;errors:number;users:number;average:number;workers:number;business:number;connectivity:number;release_count:number}>(`SELECT count(*)::int samples,count(*) FILTER(WHERE e.severity IN ('ERROR','CRITICAL') AND (e.http_status IS NULL OR e.http_status>=500))::int errors,count(DISTINCT e.actor_reference)::int users,COALESCE(avg(e.duration_ms),0)::float average,count(*) FILTER(WHERE e.source='WORKER' AND (e.severity='CRITICAL' OR e.safe_metadata->>'retryExhausted'='true'))::int workers,count(*) FILTER(WHERE e.category='BUSINESS_OPERATION')::int business,count(*) FILTER(WHERE e.category='CONNECTIVITY')::int connectivity,count(DISTINCT e.release_version)::int release_count FROM observability.issue_events l JOIN observability.events e ON e.application_id=l.application_id AND e.environment_id=l.environment_id AND e.event_id=l.event_id WHERE l.issue_id=$1 AND l.application_id=$2 AND l.environment_id=$3 AND e.occurred_at>now()-($4::int*interval '1 second')`,[issue.id,issue.application_id,issue.environment_id,rule.window_seconds])).rows[0];
    if(stat.samples<rule.minimum_samples&&rule.code!=='ERROR_RATE')continue;
    let triggered=false;
    switch(rule.code){
     case 'CRITICAL_EVENT':{const critical=(await c.query<{total:number}>(`SELECT count(*)::int total FROM observability.issue_events l JOIN observability.events e ON e.application_id=l.application_id AND e.environment_id=l.environment_id AND e.event_id=l.event_id WHERE l.issue_id=$1 AND l.application_id=$2 AND l.environment_id=$3 AND e.occurred_at>now()-($4::int*interval '1 second') AND e.source IN ('SERVER','WORKER') AND e.severity='CRITICAL' AND (e.http_status IS NULL OR e.http_status>=500)`,[issue.id,issue.application_id,issue.environment_id,rule.window_seconds])).rows[0];triggered=critical.total>=rule.threshold;break;}
     case 'ERROR_BURST':triggered=stat.errors>=rule.threshold;break;
     case 'BUSINESS_FAILURE':triggered=stat.business>=rule.threshold&&stat.errors>=rule.threshold;break;
     case 'SLOW_OPERATION':triggered=stat.average>=rule.threshold;break;
     case 'CONNECTIVITY_FAILURE':triggered=stat.connectivity>=rule.threshold;break;
     case 'USER_IMPACT':triggered=stat.users>=rule.threshold;break;
     case 'WORKER_FAILURE':triggered=stat.workers>=rule.threshold;break;
     case 'ISSUE_REOPENED':triggered=issue.status==='REOPENED';break;
     case 'ERROR_RATE':{const sums=(await c.query<{total:string;failed:string}>('SELECT COALESCE(sum(operation_count),0) total,COALESCE(sum(operation_failure_count),0) failed FROM observability.aggregates WHERE application_id=$1 AND environment_id=$2 AND tenant_scope_key=$3 AND bucket_start>now()-($4::int*interval \'1 second\')',[issue.application_id,issue.environment_id,issue.tenant_reference??'',rule.window_seconds])).rows[0];triggered=Number(sums.total)>=rule.minimum_samples&&Number(sums.failed)/Math.max(1,Number(sums.total))>=rule.threshold;break;}
     case 'RELEASE_REGRESSION':{
      const releases=(await c.query<{current_release:string|null;previous_release:string|null;baseline:number}>(`SELECT (array_agg(e.release_version ORDER BY e.occurred_at DESC) FILTER(WHERE e.occurred_at>now()-($2::int*interval '1 second')))[1] current_release,(array_agg(e.release_version ORDER BY e.occurred_at DESC) FILTER(WHERE e.occurred_at<=now()-($2::int*interval '1 second')))[1] previous_release,count(*) FILTER(WHERE e.occurred_at<=now()-($2::int*interval '1 second') AND e.severity IN ('ERROR','CRITICAL'))::int baseline FROM observability.issue_events l JOIN observability.events e ON e.application_id=l.application_id AND e.environment_id=l.environment_id AND e.event_id=l.event_id WHERE l.issue_id=$1 AND e.occurred_at>now()-($2::int*interval '2 seconds')`,[issue.id,rule.window_seconds])).rows[0];
      triggered=Boolean(releases.current_release&&releases.previous_release&&releases.current_release!==releases.previous_release&&releases.baseline>=rule.minimum_samples&&stat.errors/releases.baseline>=rule.threshold);break;
     }
    }
    if(!triggered)continue;
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`incident:${issue.id}`]);
    const prior=await c.query(`SELECT 1 FROM observability.incidents WHERE application_id=$1 AND environment_id=$2 AND issue_id=$3 AND (status NOT IN ('RESOLVED','IGNORED','FALSE_POSITIVE') OR updated_at>now()-($4::int*interval '1 second') OR updated_at>=$5)`,[issue.application_id,issue.environment_id,issue.id,rule.cooldown_seconds,issue.last_seen]);
    if(prior.rowCount)break;
    // Snapshot observed evidence, never a cross-tenant union or inferred downtime.
    const observed=(await c.query<{occurrences:number;users:number;tenants:number;tenant_free:number;feature_count:number;unknown_features:number;first_at:Date|null;last_at:Date|null;features:string[]}>(`WITH cohort AS (
     SELECT e.actor_reference,e.tenant_reference,e.occurred_at,CASE WHEN jsonb_typeof(e.safe_metadata->'featureCode')='string' THEN NULLIF(btrim(e.safe_metadata->>'featureCode'),'') END feature
     FROM observability.issue_events l JOIN observability.events e ON e.application_id=l.application_id AND e.environment_id=l.environment_id AND e.event_id=l.event_id
     WHERE l.issue_id=$1 AND l.application_id=$2 AND l.environment_id=$3 AND e.tenant_reference IS NOT DISTINCT FROM $4 AND e.occurred_at>now()-($5::int*interval '1 second')
    ) SELECT count(*)::int occurrences,count(DISTINCT actor_reference)::int users,count(DISTINCT tenant_reference)::int tenants,
     count(*) FILTER(WHERE tenant_reference IS NULL)::int tenant_free,count(DISTINCT feature)::int feature_count,
     count(*) FILTER(WHERE feature IS NULL)::int unknown_features,min(occurred_at) first_at,max(occurred_at) last_at,
     ARRAY(SELECT DISTINCT feature FROM cohort WHERE feature IS NOT NULL ORDER BY feature LIMIT 20) features FROM cohort`,[issue.id,issue.application_id,issue.environment_id,issue.tenant_reference,rule.window_seconds])).rows[0];
    const impact={occurrences:observed.occurrences,affectedUsers:observed.users,windowSeconds:rule.window_seconds,affectedTenants:observed.tenants,tenantFreeEvents:observed.tenant_free,affectedFeatureCount:observed.feature_count,affectedFeatures:observed.features,unknownFeatureEvents:observed.unknown_features,observedFirstAt:observed.first_at?.toISOString()??null,observedLastAt:observed.last_at?.toISOString()??null,observedDurationMs:observed.first_at&&observed.last_at?observed.last_at.getTime()-observed.first_at.getTime():null};
    const incident=(await c.query<{id:string}>(`INSERT INTO observability.incidents(application_id,environment_id,tenant_reference,issue_id,title,severity,rule_code,impact) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[issue.application_id,issue.environment_id,issue.tenant_reference,issue.id,issue.title,rule.code==='CRITICAL_EVENT'?'CRITICAL':issue.severity,rule.code,impact])).rows[0];
    await c.query('INSERT INTO observability.incident_activity(application_id,environment_id,tenant_reference,incident_id,kind,reason,to_status) VALUES($1,$2,$3,$4,$5,$6,$7)',[issue.application_id,issue.environment_id,issue.tenant_reference,incident.id,'RULE_DETECTED',`Monitoring rule: ${rule.code}`,'NEW']);
    await c.query('INSERT INTO observability.alerts(application_id,environment_id,tenant_reference,incident_id,title,dedupe_key) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',[issue.application_id,issue.environment_id,issue.tenant_reference,incident.id,issue.title,`incident:${incident.id}`]);created++;break;
   }
  }return{evaluated:issues.length,created};
 });}
}
