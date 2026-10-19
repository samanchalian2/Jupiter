import type { PoolClient } from 'pg';
import { ContractError, isUuid, SEVERITIES, CATEGORIES, type IncidentStatus } from '@observability/contracts';
import { redactText } from '@observability/core';
import { HubDatabase, type DataScope } from './database.js';
import { RegistryService } from './registry.js';
export interface OperationScope {applicationId:string;environmentId:string;tenantReference?:string|null;}
export interface QueryFilter {from?:string;to?:string;q?:string;severity?:string;category?:string;release?:string;status?:string;page?:number;pageSize?:number;}
const resources={events:{table:'events',time:'received_at',title:'normalized_message',fields:'event_id AS id,received_at,occurred_at,source,category,severity,event_code,normalized_message,exception_type,fingerprint,trace_id,request_id,operation_name,release_version,http_status,duration_ms,tenant_reference'},issues:{table:'issues',time:'last_seen',title:'title',fields:'id,title,status,severity,first_seen,last_seen,occurrence_count,regression_count,assigned_principal_id,tenant_reference'},incidents:{table:'incidents',time:'created_at',title:'title',fields:'id,issue_id,title,status,severity,impact,assigned_principal_id,rule_code,created_at,updated_at,tenant_reference'},feedback:{table:'feedback',time:'created_at',title:'subject',fields:'id,tracking_id,subject,category,status,created_at,updated_at,tenant_reference'},alerts:{table:'alerts',time:'created_at',title:'title',fields:'id,incident_id,title,created_at,tenant_reference'}} as const;
export type Resource=keyof typeof resources;
export function csvCell(value:unknown):string{let text=value===null||value===undefined?'':typeof value==='object'?JSON.stringify(value):String(value);if(/^[\s]*[=+\-@]/.test(text)&&typeof value!=='number')text=`'${text}`;return `"${text.replaceAll('"','""')}"`;}
export class OperationsService {
 constructor(private readonly database:HubDatabase,private readonly registry:RegistryService){}
 private async scoped<T>(principalId:string,input:OperationScope,work:(c:PoolClient,scope:DataScope)=>Promise<T>,roles:readonly string[]=['ADMIN','OPERATOR','ANALYST','VIEWER'],before?:(c:PoolClient,scope:DataScope)=>Promise<void>){
  const scope=await this.registry.dataScope(principalId,input,roles);
  return this.database.scoped(scope,c=>work(c,scope),async c=>{await this.registry.authorize(c,principalId,scope.applicationId,roles,scope.environmentId,scope.tenantAll?undefined:scope.tenantReference);if(before)await before(c,scope);});
 }
 private filters(resource:Resource,scope:OperationScope,filter:QueryFilter){
  const selected=resources[resource];if(!selected)throw new ContractError('INVALID_RESOURCE');
  const from=filter.from?new Date(filter.from):new Date(Date.now()-86_400_000),to=filter.to?new Date(filter.to):new Date();
  if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||from>to||to.getTime()-from.getTime()>31*86_400_000)throw new ContractError('INVALID_TIME_RANGE');
  if((filter.q?.length??0)>120||(filter.release?.length??0)>160||(filter.status?.length??0)>40)throw new ContractError('INVALID_FILTER');
  if(filter.severity&&!SEVERITIES.includes(filter.severity as 'INFO')||filter.category&&!CATEGORIES.includes(filter.category as 'FRONTEND'))throw new ContractError('INVALID_FILTER');
  const page=filter.page??1,size=filter.pageSize??25;if(!Number.isInteger(page)||page<1||page>400||!Number.isInteger(size)||size<1||size>100)throw new ContractError('INVALID_PAGINATION');
  const values:unknown[]=[scope.applicationId,scope.environmentId,from.toISOString(),to.toISOString()];
  const clauses=[`application_id=$1`,`environment_id=$2`,`${selected.time}>=$3`,`${selected.time}<=$4`];
  const bind=(column:string,value:unknown,operator='=')=>{values.push(value);clauses.push(`${column}${operator}$${values.length}`);};
  if(filter.q)bind(selected.title,`%${filter.q.replace(/[\\%_]/g,'\\$&')}%`,' ILIKE ');
  if(filter.severity&&['events','issues','incidents'].includes(resource))bind('severity',filter.severity);
  if(filter.category&&resource==='events')bind('category',filter.category);
  if(filter.release&&resource==='events')bind('release_version',filter.release);
  if(filter.status&&['issues','incidents','feedback'].includes(resource))bind('status',filter.status);
  return{selected,values,where:clauses.join(' AND '),page,size};
 }
 async list(principalId:string,scope:OperationScope,resource:Resource,filter:QueryFilter={}){
  const query=this.filters(resource,scope,filter);
  return this.scoped(principalId,scope,async c=>{const total=Number((await c.query<{total:string}>(`SELECT count(*) total FROM observability.${query.selected.table} WHERE ${query.where}`,query.values)).rows[0].total);const rows=(await c.query(`SELECT ${query.selected.fields} FROM observability.${query.selected.table} WHERE ${query.where} ORDER BY ${query.selected.time} DESC,${resource==='events'?'event_id':'id'} DESC LIMIT $${query.values.length+1} OFFSET $${query.values.length+2}`,[...query.values,query.size,(query.page-1)*query.size])).rows;return{items:rows,total,page:query.page,pageSize:query.size};});
 }
 async detail(principalId:string,scope:OperationScope,resource:Resource,id:string){
  if(!isUuid(id)||!resources[resource])throw new ContractError('INVALID_REFERENCE');
  return this.scoped(principalId,scope,async c=>{const selected=resources[resource],row=(await c.query(`SELECT ${selected.fields}${resource==='events'?',sanitized_stack,safe_metadata':resource==='feedback'?',description':''} FROM observability.${selected.table} WHERE application_id=$1 AND environment_id=$2 AND ${resource==='events'?'event_id':'id'}=$3`,[scope.applicationId,scope.environmentId,id])).rows[0];if(!row)throw new ContractError('RESOURCE_NOT_FOUND');
   if(resource==='issues'){row.events=(await c.query(`SELECT e.event_id,e.occurred_at,e.normalized_message,e.sanitized_stack,e.trace_id,e.request_id,e.release_version FROM observability.issue_events l JOIN observability.events e ON e.application_id=l.application_id AND e.environment_id=l.environment_id AND e.event_id=l.event_id WHERE l.application_id=$1 AND l.environment_id=$2 AND l.issue_id=$3 ORDER BY e.occurred_at DESC LIMIT 100`,[scope.applicationId,scope.environmentId,id])).rows;row.activity=(await c.query('SELECT kind,body,actor_principal_id,created_at FROM observability.issue_activity WHERE application_id=$1 AND environment_id=$2 AND issue_id=$3 ORDER BY created_at DESC LIMIT 100',[scope.applicationId,scope.environmentId,id])).rows;row.feedback=(await c.query('SELECT f.id,f.tracking_id,f.subject,f.status FROM observability.feedback f JOIN observability.issue_events e ON e.event_id=f.related_event_id AND e.application_id=f.application_id AND e.environment_id=f.environment_id WHERE e.issue_id=$1 LIMIT 100',[id])).rows;}
   if(resource==='incidents'){
    row.activity=(await c.query('SELECT kind,reason,from_status,to_status,actor_principal_id,created_at FROM observability.incident_activity WHERE application_id=$1 AND environment_id=$2 AND incident_id=$3 ORDER BY created_at LIMIT 100',[scope.applicationId,scope.environmentId,id])).rows;
    row.issues=(await c.query('SELECT id,title,status,severity,occurrence_count,first_seen,last_seen FROM observability.issues WHERE application_id=$1 AND environment_id=$2 AND id=$3',[scope.applicationId,scope.environmentId,row.issue_id])).rows;
    row.feedback=(await c.query('SELECT f.id,f.tracking_id,f.subject,f.status FROM observability.feedback f WHERE f.application_id=$1 AND f.environment_id=$2 AND EXISTS(SELECT 1 FROM observability.issue_events l WHERE l.application_id=f.application_id AND l.environment_id=f.environment_id AND l.issue_id=$3 AND l.event_id=f.related_event_id) ORDER BY f.created_at DESC LIMIT 100',[scope.applicationId,scope.environmentId,row.issue_id])).rows;
    row.ai_findings=(await c.query("SELECT id,kind,status,output,evidence_references,created_at FROM observability.investigations WHERE application_id=$1 AND environment_id=$2 AND status='SUCCEEDED' AND (kind='INCIDENT' AND target_reference=$3 OR kind='ISSUE' AND target_reference=$4) ORDER BY created_at DESC LIMIT 20",[scope.applicationId,scope.environmentId,id,row.issue_id])).rows;
   }
   if(resource==='feedback')row.replies=(await c.query('SELECT id,body,internal,actor_principal_id,created_at FROM observability.feedback_replies WHERE application_id=$1 AND environment_id=$2 AND feedback_id=$3 ORDER BY created_at LIMIT 100',[scope.applicationId,scope.environmentId,id])).rows;
   return row;
  });
 }
 async overview(principalId:string,scope:OperationScope,filter:QueryFilter={}){
  const query=this.filters('events',scope,filter);
  return this.scoped(principalId,scope,async c=>{
   const counts=(await c.query(`SELECT (SELECT count(*) FROM observability.issues WHERE application_id=$1 AND environment_id=$2 AND status NOT IN ('RESOLVED','IGNORED')) active_issues,(SELECT count(*) FROM observability.incidents WHERE application_id=$1 AND environment_id=$2 AND status NOT IN ('RESOLVED','IGNORED','FALSE_POSITIVE')) active_incidents,(SELECT count(*) FROM observability.feedback WHERE application_id=$1 AND environment_id=$2 AND status IN ('NEW','TRIAGED','IN_PROGRESS')) pending_feedback`,[scope.applicationId,scope.environmentId])).rows[0];
   const impact=(await c.query(`SELECT count(DISTINCT actor_reference)::int affected_users,count(DISTINCT tenant_reference)::int affected_tenants FROM observability.events WHERE ${query.where} AND severity IN ('ERROR','CRITICAL')`,query.values)).rows[0];
   // Use the same filtered event cohort for numerator, denominator and impact.
   // Pre-aggregated minute counters do not carry severity/category/release,
   // so using them here would silently ignore visible Console filters.
   const measured="event_code IN ('http.operation','api.operation')";
   const trend=(await c.query(`SELECT date_trunc('hour',received_at) bucket_start,count(*)::int events,count(*) FILTER(WHERE severity IN ('ERROR','CRITICAL'))::int errors,count(*) FILTER(WHERE ${measured})::int operations,count(*) FILTER(WHERE ${measured} AND http_status>=500)::int failed_operations FROM observability.events WHERE ${query.where} GROUP BY bucket_start ORDER BY bucket_start LIMIT 750`,query.values)).rows;
   const totals=(await c.query(`SELECT count(*) FILTER(WHERE ${measured})::int operations,count(*) FILTER(WHERE ${measured} AND http_status>=500)::int failures,count(*)::int events FROM observability.events WHERE ${query.where}`,query.values)).rows[0];
   return{...counts,...impact,...totals,errorRate:totals.operations?totals.failures/totals.operations:null,trend,from:query.values[2],to:query.values[3],stateCountersScope:'CURRENT_STATE',metricScope:'FILTERED_EVENTS'};
  });
 }
 async exportCsv(principalId:string,scope:OperationScope,resource:Resource,filter:QueryFilter={}){
  const query=this.filters(resource,scope,filter);
  return this.scoped(principalId,scope,async c=>{const rows=(await c.query(`SELECT ${query.selected.fields} FROM observability.${query.selected.table} WHERE ${query.where} ORDER BY ${query.selected.time} DESC LIMIT 10000`,query.values)).rows;const columns=rows.length?Object.keys(rows[0]):['id'];return '\uFEFF'+[columns.map(csvCell).join(','),...rows.map(row=>columns.map(key=>csvCell(row[key])).join(','))].join('\r\n');},['ADMIN','OPERATOR','ANALYST']);
 }
 async analytics(principalId:string,scope:OperationScope,filter:QueryFilter={}){
  if(filter.status!==undefined||filter.page!==undefined||filter.pageSize!==undefined)throw new ContractError('INVALID_ANALYTICS_FILTER');
  const query=this.filters('events',scope,filter),feedbackSearch=filter.q?`%${filter.q.replace(/[\\%_]/g,'\\$&')}%`:null;
  const values=[...query.values,feedbackSearch,Boolean(filter.severity||filter.category||filter.release)];
  const search=`$${values.length-1}::text`,linkedOnly=`$${values.length}::boolean`;
  return this.scoped(principalId,scope,async c=>{
   // Fixed SQL/columns, parameterized values and current RLS. No payload export.
   const cohort=`WITH cohort AS MATERIALIZED (SELECT application_id,environment_id,event_id,received_at,release_version,severity,event_code,operation_name,http_status,actor_reference,tenant_reference,browser_family,operating_system,device_class,exception_type,fingerprint FROM observability.events WHERE ${query.where}),
    matched_issues AS (SELECT l.issue_id,count(*)::int occurrences FROM observability.issue_events l JOIN cohort e ON e.application_id=l.application_id AND e.environment_id=l.environment_id AND e.event_id=l.event_id GROUP BY l.issue_id),
    scoped_issues AS (SELECT i.id,i.title,i.status,i.regression_count,i.first_seen,i.resolved_at,m.occurrences FROM observability.issues i JOIN matched_issues m ON m.issue_id=i.id WHERE i.application_id=$1 AND i.environment_id=$2),
    scoped_incidents AS (SELECT i.created_at,i.resolved_at FROM observability.incidents i JOIN matched_issues m ON m.issue_id=i.issue_id WHERE i.application_id=$1 AND i.environment_id=$2),
    scoped_feedback AS (SELECT f.created_at FROM observability.feedback f WHERE f.application_id=$1 AND f.environment_id=$2 AND f.created_at>=$3 AND f.created_at<=$4 AND (${search} IS NULL OR f.subject ILIKE ${search}) AND (NOT ${linkedOnly} OR f.related_event_id IN(SELECT event_id FROM cohort))),
    release_totals AS (SELECT release_version,min(received_at) first_seen,count(*)::int events,count(*) FILTER(WHERE severity IN ('ERROR','CRITICAL'))::int errors,count(*) FILTER(WHERE event_code IN ('http.operation','api.operation'))::int operations,count(*) FILTER(WHERE event_code IN ('http.operation','api.operation') AND http_status>=500)::int failures FROM cohort GROUP BY release_version),
    release_rates AS (SELECT *,CASE WHEN operations>0 THEN failures::float8/operations ELSE NULL END error_rate FROM release_totals),
    resolutions AS (SELECT 'ISSUE' kind,extract(epoch FROM resolved_at-first_seen)::float8 seconds FROM scoped_issues WHERE resolved_at BETWEEN $3 AND $4 AND resolved_at>=first_seen UNION ALL SELECT 'INCIDENT',extract(epoch FROM resolved_at-created_at)::float8 FROM scoped_incidents WHERE resolved_at BETWEEN $3 AND $4 AND resolved_at>=created_at)
   SELECT
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT date_trunc('hour',bucket AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' "bucketStart",sum(created)::int incidents,sum(resolved)::int resolved FROM(SELECT created_at bucket,1 created,0 resolved FROM scoped_incidents WHERE created_at BETWEEN $3 AND $4 UNION ALL SELECT resolved_at,0,1 FROM scoped_incidents WHERE resolved_at BETWEEN $3 AND $4) t GROUP BY 1 ORDER BY 1 LIMIT 750) r) "incidentTrend",
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT date_trunc('hour',created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' "bucketStart",count(*)::int reports FROM scoped_feedback GROUP BY 1 ORDER BY 1 LIMIT 750) r) "feedbackTrend",
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT id "issueId",title,status,occurrences,regression_count "lifetimeReopenCount" FROM scoped_issues ORDER BY occurrences DESC,id LIMIT 50) r) "issueRecurrence",
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT operation_name "operationName",count(*)::int errors,count(DISTINCT actor_reference)::int "affectedUsers",count(DISTINCT tenant_reference)::int "affectedTenants" FROM cohort WHERE severity IN ('ERROR','CRITICAL') GROUP BY operation_name ORDER BY errors DESC,operation_name NULLS LAST LIMIT 50) r) "operationImpact",
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT browser_family "browserFamily",operating_system "operatingSystem",device_class "deviceClass",count(*)::int events,count(*) FILTER(WHERE severity IN ('ERROR','CRITICAL'))::int errors FROM cohort GROUP BY 1,2,3 ORDER BY events DESC,browser_family NULLS LAST,operating_system NULLS LAST,device_class NULLS LAST LIMIT 50) r) "browserDevices",
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT release_version "releaseVersion",first_seen "firstSeen",events,errors,operations,failures,error_rate "errorRate",error_rate-lag(error_rate) OVER(ORDER BY first_seen,release_version NULLS LAST) "deltaFromPrevious" FROM release_rates ORDER BY first_seen,release_version NULLS LAST LIMIT 50) r) releases,
    (SELECT jsonb_agg(r) FROM(SELECT k.kind,count(seconds)::int "resolvedCount",avg(seconds)::float8 "averageSeconds",percentile_cont(.5) WITHIN GROUP(ORDER BY seconds) "p50Seconds",percentile_cont(.95) WITHIN GROUP(ORDER BY seconds) "p95Seconds" FROM(VALUES('ISSUE'),('INCIDENT')) k(kind) LEFT JOIN resolutions USING(kind) GROUP BY k.kind ORDER BY k.kind) r) resolution,
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT exception_type "exceptionType",event_code "eventCode",fingerprint,count(*)::int occurrences,count(DISTINCT actor_reference)::int "affectedUsers" FROM cohort WHERE severity IN ('ERROR','CRITICAL') GROUP BY exception_type,event_code,fingerprint ORDER BY occurrences DESC,fingerprint LIMIT 50) r) "recurringCauses",
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT actor_reference "actorReference",count(*)::int errors FROM cohort WHERE severity IN ('ERROR','CRITICAL') AND actor_reference IS NOT NULL GROUP BY actor_reference ORDER BY errors DESC,actor_reference LIMIT 50) r) "userImpact",
    (SELECT COALESCE(jsonb_agg(r),'[]') FROM(SELECT tenant_reference "tenantReference",count(*)::int errors,count(DISTINCT actor_reference)::int "affectedUsers" FROM cohort WHERE severity IN ('ERROR','CRITICAL') AND tenant_reference IS NOT NULL GROUP BY tenant_reference ORDER BY errors DESC,tenant_reference LIMIT 50) r) "tenantImpact"`;
   const report=(await c.query(cohort,values)).rows[0];
   return{...report,from:query.values[2],to:query.values[3],scope:'FILTERED_APPLICATION_ENVIRONMENT',limits:{rankedGroups:50,hourlyBuckets:750},feedbackScope:filter.severity||filter.category||filter.release?'MATCHING_LINKED_EVENTS':'WINDOW_AND_SUBJECT',releaseComparison:'OBSERVED_HTTP_FAILURE_RATE_NOT_CAUSAL'};
  });
 }
 async annotateIncident(principalId:string,input:OperationScope,id:string,command:{assignedPrincipalId?:string|null;note?:string;reason:string}){
  if(!isUuid(id)||typeof command.reason!=='string'||command.reason.trim().length<3||command.reason.length>500||command.note!==undefined&&(typeof command.note!=='string'||command.note.trim().length<3||command.note.length>4000)||command.assignedPrincipalId!==undefined&&command.assignedPrincipalId!==null&&!isUuid(command.assignedPrincipalId))throw new ContractError('INVALID_INCIDENT_COMMAND');
  if(command.note===undefined&&command.assignedPrincipalId===undefined)throw new ContractError('EMPTY_INCIDENT_COMMAND');
  return this.scoped(principalId,input,async(c,scope)=>{
   const row=(await c.query<{tenant_reference:string|null}>('SELECT tenant_reference FROM observability.incidents WHERE application_id=$1 AND environment_id=$2 AND id=$3 FOR UPDATE',[scope.applicationId,scope.environmentId,id])).rows[0];if(!row)throw new ContractError('INCIDENT_NOT_FOUND');
   if(command.assignedPrincipalId!==undefined)await c.query('UPDATE observability.incidents SET assigned_principal_id=$1,updated_at=now() WHERE application_id=$2 AND environment_id=$3 AND id=$4',[command.assignedPrincipalId,scope.applicationId,scope.environmentId,id]);
   for(const kind of [...(command.assignedPrincipalId!==undefined?['ASSIGNED']:[]),...(command.note?['NOTE_ADDED']:[])]){
    await c.query('INSERT INTO observability.incident_activity(application_id,environment_id,tenant_reference,incident_id,actor_principal_id,kind,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',[scope.applicationId,scope.environmentId,row.tenant_reference,id,principalId,kind,redactText(kind==='NOTE_ADDED'?command.note!:command.reason)]);
    await c.query('INSERT INTO observability.audit(application_id,actor_principal_id,action,reason,metadata) VALUES($1,$2,$3,$4,$5)',[scope.applicationId,principalId,`INCIDENT_${kind}`,redactText(command.reason),{incidentId:id,...(kind==='ASSIGNED'?{assignedPrincipalId:command.assignedPrincipalId}: {})}]);
   }
   return{updated:true};
  },['ADMIN','OPERATOR'],async(c,scope)=>{if(command.assignedPrincipalId)await this.registry.authorize(c,command.assignedPrincipalId,scope.applicationId,['ADMIN','OPERATOR'],scope.environmentId,scope.tenantAll?undefined:scope.tenantReference);});
 }
 async changeIssue(principalId:string,input:OperationScope,id:string,command:{status?:'OPEN'|'INVESTIGATING'|'RESOLVED'|'IGNORED';assignedPrincipalId?:string|null;note?:string;reason:string}){
  if(!isUuid(id)||typeof command.reason!=='string'||command.reason.trim().length<3||command.reason.length>500||command.note!==undefined&&(typeof command.note!=='string'||command.note.trim().length<3||command.note.length>4000)||command.status!==undefined&&!['OPEN','INVESTIGATING','RESOLVED','IGNORED'].includes(command.status)||command.assignedPrincipalId!==undefined&&command.assignedPrincipalId!==null&&!isUuid(command.assignedPrincipalId))throw new ContractError('INVALID_ISSUE_COMMAND');
  return this.scoped(principalId,input,async(c,scope)=>{
   const row=(await c.query<{tenant_reference:string|null;status:string}>('SELECT tenant_reference,status FROM observability.issues WHERE application_id=$1 AND environment_id=$2 AND id=$3 FOR UPDATE',[scope.applicationId,scope.environmentId,id])).rows[0];if(!row)throw new ContractError('ISSUE_NOT_FOUND');
   if(command.status===undefined&&command.assignedPrincipalId===undefined&&command.note===undefined)throw new ContractError('EMPTY_ISSUE_COMMAND');
   if(command.status)await c.query("UPDATE observability.issues SET status=$1,resolved_at=CASE WHEN $1='RESOLVED' THEN now() ELSE NULL END WHERE application_id=$2 AND environment_id=$3 AND id=$4",[command.status,scope.applicationId,scope.environmentId,id]);
   if(command.assignedPrincipalId!==undefined)await c.query('UPDATE observability.issues SET assigned_principal_id=$1 WHERE application_id=$2 AND environment_id=$3 AND id=$4',[command.assignedPrincipalId,scope.applicationId,scope.environmentId,id]);
   for(const kind of [...(command.status?['STATUS_CHANGED']:[]),...(command.assignedPrincipalId!==undefined?['ASSIGNED']:[]),...(command.note?['NOTE_ADDED']:[])]){
    await c.query('INSERT INTO observability.issue_activity(application_id,environment_id,tenant_reference,issue_id,actor_principal_id,kind,body) VALUES($1,$2,$3,$4,$5,$6,$7)',[scope.applicationId,scope.environmentId,row.tenant_reference,id,principalId,kind,redactText(kind==='NOTE_ADDED'?command.note!:command.reason)]);
    await c.query('INSERT INTO observability.audit(application_id,actor_principal_id,action,reason,metadata) VALUES($1,$2,$3,$4,$5)',[scope.applicationId,principalId,`ISSUE_${kind}`,redactText(command.reason),{issueId:id,status:command.status??row.status}]);
   }return{updated:true};
  },['ADMIN','OPERATOR'],async(c,scope)=>{if(command.assignedPrincipalId)await this.registry.authorize(c,command.assignedPrincipalId,scope.applicationId,['ADMIN','OPERATOR'],scope.environmentId,scope.tenantAll?undefined:scope.tenantReference);});
 }
}
