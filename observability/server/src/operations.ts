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
   if(resource==='incidents')row.activity=(await c.query('SELECT kind,reason,from_status,to_status,actor_principal_id,created_at FROM observability.incident_activity WHERE application_id=$1 AND environment_id=$2 AND incident_id=$3 ORDER BY created_at LIMIT 100',[scope.applicationId,scope.environmentId,id])).rows;
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
