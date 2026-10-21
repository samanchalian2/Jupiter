import { ContractError, isRecord, isUuid } from '@observability/contracts';
import { RegistryService, type VerifiedPrincipal } from './registry.js';
import { IngestionService } from './ingestion.js';
import { HubDatabase } from './database.js';
import { FeedbackService } from './feedback.js';
import { OperationsService, type OperationScope, type QueryFilter, type Resource } from './operations.js';
import { IssueEngine } from './engine.js';
import { MonitoringEngine } from './rules.js';
import { AlertService } from './alerts.js';
import type { InvestigatorService, InvestigatorConfiguration } from './investigator.js';
import { openApiDocument } from './openapi.js';
import {RetentionService,type RetentionPolicy} from './retention.js';
import {SelfMonitoringService} from './self-monitoring.js';

/** Host-supplied verified identity. Implementations can use JWT/OIDC/session
 * exchange; the core never imports a product's user or membership model. */
export interface OperationalIdentityProvider {verify(bearer:string):Promise<VerifiedPrincipal>;}
export interface HubHttpRequest {method:string;path:string;authorization?:string;origin?:string;expectedApplicationId?:string;expectedEnvironmentId?:string;body?:unknown;clientKey:string;}
export interface HubHttpResponse {status:number;body:unknown;headers?:Record<string,string>;}
export interface IngestionPolicy {allow(credential:{applicationId:string;environmentId:string;actorReference:string|null;tenantReference:string|null;source:string}):Promise<boolean>;}
export class BoundedRateLimiter {
  private readonly buckets=new Map<string,{count:number;expires:number}>();
  constructor(private readonly limit:number,private readonly maxKeys=10_000){}
  allow(key:string,now=Date.now()){
    const existing=this.buckets.get(key);if(existing&&existing.expires>now){existing.count++;return existing.count<=this.limit;}
    if(this.buckets.size>=this.maxKeys){for(const [id,bucket] of this.buckets){if(bucket.expires<=now)this.buckets.delete(id);if(this.buckets.size<this.maxKeys)break;}if(this.buckets.size>=this.maxKeys)return false;}
    this.buckets.set(key,{count:1,expires:now+60_000});return true;
  }
}
export class HubHttpApi {
  private readonly requestLimiter=new BoundedRateLimiter(600);
  private readonly ingestionLimiter=new BoundedRateLimiter(120);
  private readonly mintLimiter=new BoundedRateLimiter(60);
  private readonly operationsLimiter=new BoundedRateLimiter(120);
  private readonly feedbackLimiter=new BoundedRateLimiter(10);
  private readonly metricLimiter=new BoundedRateLimiter(6);
  constructor(private readonly database:HubDatabase,private readonly registry:RegistryService,private readonly ingestion:IngestionService,private readonly identities:OperationalIdentityProvider,private readonly ingestionPolicy?:IngestionPolicy,private readonly investigator?:InvestigatorService){}
  private bearer(request:HubHttpRequest){const match=/^Bearer ([A-Za-z0-9._~-]{16,4096})$/.exec(request.authorization??'');if(!match)throw new ContractError('AUTHENTICATION_REQUIRED');return match[1];}
  private body(request:HubHttpRequest){if(!isRecord(request.body))throw new ContractError('INVALID_REQUEST');return request.body;}
  async dispatch(request:HubHttpRequest):Promise<HubHttpResponse>{
    const origin=request.origin;
    let headers:Record<string,string>={'Cache-Control':'no-store'};
    if(origin){
      let allowed=false;try{allowed=Boolean(await this.database.control(async c=>(await c.query('SELECT 1 FROM observability.applications WHERE enabled=true AND $1=ANY(allowed_origins) LIMIT 1',[origin])).rowCount));}catch{/* Data routes will return their own safe failure. */}
      if(allowed)headers={...headers,'Access-Control-Allow-Origin':origin,Vary:'Origin','Access-Control-Allow-Headers':'authorization,content-type,x-request-id,traceparent,idempotency-key,x-observability-application-id,x-observability-environment-id','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Max-Age':'300'};
      if(request.method==='OPTIONS')return{status:allowed?204:403,body:allowed?null:{reasonCode:'ORIGIN_DENIED'},headers};
    }
    const result=await this.execute(request);return{...result,headers:{...headers,...result.headers,'Cache-Control':'no-store'}};
  }
  private async execute(request:HubHttpRequest):Promise<HubHttpResponse>{
    try{
      const url=new URL(request.path,'http://hub.invalid'),path=url.pathname.replace(/\/$/,'')||'/';
      if(request.method==='GET'&&path==='/health')return{status:200,body:{service:'observability-hub',status:'ok',timestamp:new Date().toISOString()}};
      if(request.method==='GET'&&path==='/ready'){try{await this.database.control(async c=>{await c.query('SELECT 1 FROM observability.applications LIMIT 1');});return{status:200,body:{service:'observability-hub',status:'ready'}};}catch{return{status:503,body:{reasonCode:'STORAGE_UNAVAILABLE'}};}}
      if(!this.requestLimiter.allow(request.clientKey.slice(0,160)))return{status:429,body:{reasonCode:'REQUEST_RATE_LIMIT'},headers:{'Retry-After':'60'}};
      if(request.method==='GET'&&path==='/openapi.json')return{status:200,body:openApiDocument};
      const token=this.bearer(request);
      if(request.method==='POST'&&path==='/sdk-metrics'){
        const credential=await this.registry.credential(token,'events:write');await this.actorAllowed(credential);await this.origin(credential.applicationId,credential.source,request.origin);
        if((request.expectedApplicationId!==undefined||request.expectedEnvironmentId!==undefined)&&(request.expectedApplicationId!==credential.applicationId||request.expectedEnvironmentId!==credential.environmentId))throw new ContractError('METRIC_SCOPE_MISMATCH');
        if(!this.metricLimiter.allow(credential.credentialId))return{status:429,body:{reasonCode:'METRIC_RATE_LIMIT'},headers:{'Retry-After':'60'}};
        return{status:201,body:await this.ingestion.metrics.reportSdk(credential,request.body)};
      }
      if(request.method==='POST'&&path==='/events/batch'){
        const credential=await this.registry.credential(token,'events:write');
        await this.actorAllowed(credential);
        if(!this.ingestionLimiter.allow(credential.credentialId))return{status:429,body:{reasonCode:'INGESTION_RATE_LIMIT'},headers:{'Retry-After':'60'}};
        await this.origin(credential.applicationId,credential.source,request.origin);
        return{status:200,body:await this.ingestion.ingest(request.body,{...credential,source:credential.source})};
      }
      if(request.method==='POST'&&path==='/credentials/browser'){
        const credential=await this.registry.credential(token,'credentials:mint');
        if(!this.mintLimiter.allow(credential.credentialId))return{status:429,body:{reasonCode:'CREDENTIAL_RATE_LIMIT'}};
        const body=this.body(request);if(Object.keys(body).some(k=>!['applicationId','environmentId','actorReference','tenantReference'].includes(k))||!isUuid(body.applicationId)||!isUuid(body.environmentId))throw new ContractError('INVALID_IDENTITY_SCOPE');
        return{status:201,body:await this.registry.mintBrowserCredential(token,{applicationId:body.applicationId,environmentId:body.environmentId,actorReference:body.actorReference===undefined?null:body.actorReference as string|null,tenantReference:body.tenantReference===undefined?null:body.tenantReference as string|null})};
      }
      if(path==='/feedback'&&request.method==='POST'){
        const credential=await this.registry.credential(token,'feedback:write');await this.actorAllowed(credential);await this.origin(credential.applicationId,credential.source,request.origin);
        if(!this.feedbackLimiter.allow(`${credential.applicationId}:${credential.actorReference}`))return{status:429,body:{reasonCode:'FEEDBACK_RATE_LIMIT'},headers:{'Retry-After':'60'}};
        return{status:201,body:await new FeedbackService(this.database,this.registry).submit(credential,request.body)};
      }
      if(request.method==='GET'&&(path==='/feedback/mine'||/^\/feedback\/[0-9a-f-]{36}$/.test(path))){
        const credential=await this.registry.credential(token,'feedback:own:read'),service=new FeedbackService(this.database,this.registry);
        await this.actorAllowed(credential);
        if(request.origin)await this.origin(credential.applicationId,credential.source,request.origin);
        return{status:200,body:path==='/feedback/mine'?await service.mine(credential):await service.ownDetail(credential,path.slice('/feedback/'.length))};
      }
      if(!path.startsWith('/operations/'))return{status:404,body:{reasonCode:'NOT_FOUND'}};
      let verified:VerifiedPrincipal;try{verified=await this.identities.verify(token);}catch{throw new ContractError('AUTHENTICATION_REQUIRED');}
      const principalId=await this.registry.principal(verified);
      if(!this.operationsLimiter.allow(principalId))return{status:429,body:{reasonCode:'OPERATIONS_RATE_LIMIT'},headers:{'Retry-After':'60'}};
      if(path==='/operations/identity'&&request.method==='GET'){if(url.searchParams.size)throw new ContractError('INVALID_QUERY');return{status:200,body:await this.database.control(async c=>{const current=(await c.query('SELECT id AS "principalId",display_name AS "displayName" FROM observability.principals WHERE id=$1 AND active=true',[principalId])).rows[0];if(!current)throw new ContractError('OPERATIONAL_ACCESS_DENIED');return current;})};}
      if(path==='/operations/analytics/products'&&request.method==='POST'){
        const body=this.body(request);if(url.searchParams.size||Object.keys(body).some(key=>!['targets','from','to','q','severity','category','release'].includes(key)))throw new ContractError('INVALID_QUERY');
        const {targets,...filter}=body;return{status:200,body:await new OperationsService(this.database,this.registry).compareProducts(principalId,targets as OperationScope[],filter as QueryFilter)};
      }
      const health=/^\/operations\/applications\/([0-9a-f-]{36})\/self-health$/.exec(path);
      if(health&&request.method==='GET'){
       if([...url.searchParams.keys()].some(k=>k!=='environmentId'||url.searchParams.getAll(k).length!==1))throw new ContractError('INVALID_QUERY');
       return{status:200,body:await new SelfMonitoringService(this.database,this.registry).status(principalId,health[1],url.searchParams.get('environmentId')??'')};
      }
      const maintenance=/^\/operations\/applications\/([0-9a-f-]{36})\/(retention-policy|maintenance)$/.exec(path);
      if(maintenance){const service=new RetentionService(this.database,this.registry);if(maintenance[2]==='retention-policy'&&[...url.searchParams.keys()].length)throw new ContractError('INVALID_QUERY');
       if(maintenance[2]==='retention-policy'&&request.method==='GET')return{status:200,body:await service.policy(principalId,maintenance[1])};
       if(maintenance[2]==='retention-policy'&&request.method==='PUT'){const body=this.body(request);if(Object.keys(body).some(k=>!['rawDays','aggregateDays','incidentDays','feedbackDays','reason'].includes(k)))throw new ContractError('INVALID_RETENTION_POLICY');return{status:200,body:await service.configure(principalId,maintenance[1],body as unknown as RetentionPolicy&{reason:string})};}
       if(maintenance[2]==='maintenance'&&request.method==='GET'){if([...url.searchParams.keys()].some(k=>k!=='environmentId'||url.searchParams.getAll(k).length!==1))throw new ContractError('INVALID_QUERY');return{status:200,body:await service.status(principalId,maintenance[1],url.searchParams.get('environmentId')??'')};}
      }
      const inboxRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/alert-inbox(?:\/([0-9a-f-]{36})\/read)?$/.exec(path);
      if(inboxRoute){
       const body=request.method==='GET'?{}:this.body(request),environmentId=request.method==='GET'?url.searchParams.get('environmentId'):body.environmentId;
       if(!isUuid(environmentId))throw new ContractError('INVALID_DATA_SCOPE');
       if(request.method==='GET'&&[...url.searchParams.keys()].some(k=>!['environmentId','tenantReference'].includes(k)||url.searchParams.getAll(k).length!==1)||request.method!=='GET'&&Object.keys(body).some(k=>!['environmentId','tenantReference'].includes(k)))throw new ContractError('INVALID_QUERY');
       const scope={applicationId:inboxRoute[1],environmentId,...(request.method==='GET'?url.searchParams.has('tenantReference')?{tenantReference:url.searchParams.get('tenantReference')||null}:{}:body.tenantReference!==undefined?{tenantReference:body.tenantReference as string|null}:{})},service=new AlertService(this.database,this.registry);
       if(request.method==='GET'&&!inboxRoute[2])return{status:200,body:await service.inbox(principalId,scope)};
       if(request.method==='POST'&&inboxRoute[2])return{status:200,body:await service.markRead(principalId,scope,inboxRoute[2])};
      }
      const reconciliationRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/ai\/attempts\/([0-9a-f-]{36})\/reconcile$/.exec(path);
      if(reconciliationRoute&&request.method==='POST'){
       if(!this.investigator)return{status:503,body:{reasonCode:'INVESTIGATOR_NOT_CONFIGURED'}};
       const body=this.body(request);if(Object.keys(body).some(key=>!['environmentId','tenantReference','inputTokens','outputTokens','reason'].includes(key))||!isUuid(body.environmentId))throw new ContractError('INVALID_AI_RECONCILIATION');
       return{status:200,body:await this.investigator.reconcile(principalId,{applicationId:reconciliationRoute[1],environmentId:body.environmentId,tenantReference:body.tenantReference as string|null|undefined},reconciliationRoute[2],{inputTokens:body.inputTokens as number,outputTokens:body.outputTokens as number,reason:body.reason as string})};
      }
      const aiRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/ai\/(configuration|investigations|usage|unknown-attempts)$/.exec(path);
      if(aiRoute){
       if(!this.investigator)return{status:503,body:{reasonCode:'INVESTIGATOR_NOT_CONFIGURED'}};
       if(aiRoute[2]==='configuration'){
        if(request.method==='GET')return{status:200,body:await this.investigator.configuration(principalId,aiRoute[1])};
        if(request.method==='PUT'){const body=this.body(request);if(Object.keys(body).some(k=>!['enabled','externalProcessingAllowed','endpoint','model','credential','monthlyTokenBudget','maxOutputTokens','maxContextBytes','maxConcurrent','reviewIntervalSeconds','reason'].includes(k)))throw new ContractError('INVALID_AI_CONFIGURATION');return{status:200,body:await this.investigator.configure(principalId,aiRoute[1],body as unknown as InvestigatorConfiguration)};}
       }
       if(request.method==='GET'){if([...url.searchParams.keys()].some(k=>!['environmentId','tenantReference'].includes(k)||url.searchParams.getAll(k).length!==1))throw new ContractError('INVALID_QUERY');const environmentId=url.searchParams.get('environmentId');if(!isUuid(environmentId))throw new ContractError('INVALID_DATA_SCOPE');const scope={applicationId:aiRoute[1],environmentId,...(url.searchParams.has('tenantReference')?{tenantReference:url.searchParams.get('tenantReference')||null}:{})};return{status:200,body:aiRoute[2]==='unknown-attempts'?await this.investigator.unknownAttempts(principalId,scope):aiRoute[2]==='usage'?await this.investigator.usage(principalId,scope):await this.investigator.list(principalId,scope)};}
       if(request.method==='POST'&&aiRoute[2]==='investigations'){const body=this.body(request);if(Object.keys(body).some(k=>!['environmentId','tenantReference','kind','targetReference','idempotencyKey'].includes(k))||!isUuid(body.environmentId)||typeof body.idempotencyKey!=='string'||typeof body.kind!=='string')throw new ContractError('INVALID_INVESTIGATION_REQUEST');return{status:201,body:await this.investigator.request(principalId,{applicationId:aiRoute[1],environmentId:body.environmentId,tenantReference:body.tenantReference as string|null|undefined},body.kind as 'ISSUE',body.targetReference as string|null??null,body.idempotencyKey)};}
      }
      const configurationRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/origins$/.exec(path);
      const accessRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/access-grants(?:\/([0-9a-f-]{36})\/revoke)?$/.exec(path);
      if(accessRoute){if(request.method==='GET'&&!accessRoute[2]){if([...url.searchParams.keys()].some(key=>key!=='page'||url.searchParams.getAll(key).length!==1))throw new ContractError('INVALID_QUERY');return{status:200,body:await this.registry.accessGrants(principalId,accessRoute[1],url.searchParams.has('page')?Number(url.searchParams.get('page')):1)};}if(request.method==='POST'){if(url.searchParams.size)throw new ContractError('INVALID_QUERY');const body=this.body(request);if(accessRoute[2]){if(Object.keys(body).some(key=>key!=='reason'))throw new ContractError('INVALID_GRANT');return{status:200,body:await this.registry.revokeManagedAccess(principalId,accessRoute[1],accessRoute[2],body.reason as string)};}if(Object.keys(body).some(key=>!['targetPrincipalId','role','environmentId','tenantReference','reason'].includes(key)))throw new ContractError('INVALID_GRANT');return{status:201,body:await this.registry.assignAccess(principalId,accessRoute[1],body as never)};}}
      const credentialCommand=/^\/operations\/applications\/([0-9a-f-]{36})\/credentials\/([0-9a-f-]{36})\/(rotate|revoke)$/.exec(path);
      if(credentialCommand&&request.method==='POST'){if(url.searchParams.size)throw new ContractError('INVALID_QUERY');const body=this.body(request);if(Object.keys(body).some(key=>key!=='reason'))throw new ContractError('INVALID_CREDENTIAL_REQUEST');return{status:200,body:await this.registry.manageIntegrationCredential(principalId,credentialCommand[1],credentialCommand[2],credentialCommand[3]==='rotate'?'ROTATE':'REVOKE',body.reason as string)};}
      const ingestionPolicyRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/ingestion-policy$/.exec(path);
      if(ingestionPolicyRoute){if(url.searchParams.size)throw new ContractError('INVALID_QUERY');if(request.method==='GET')return{status:200,body:await this.registry.ingestionPolicy(principalId,ingestionPolicyRoute[1])};if(request.method==='PUT'){const body=this.body(request);if(Object.keys(body).some(key=>!['policy','reason'].includes(key)))throw new ContractError('INVALID_INGESTION_POLICY');return{status:200,body:await this.registry.configureIngestionPolicy(principalId,ingestionPolicyRoute[1],body.policy,body.reason as string)};}}
      const applicationConfiguration=/^\/operations\/applications\/([0-9a-f-]{36})\/configuration$/.exec(path);
      if(applicationConfiguration){
        if(url.searchParams.size)throw new ContractError('INVALID_QUERY');
        if(request.method==='GET')return{status:200,body:await this.registry.applicationConfiguration(principalId,applicationConfiguration[1])};
        if(request.method==='PUT'){const body=this.body(request);if(Object.keys(body).some(key=>!['name','description','enabled','allowedOrigins','reason'].includes(key)))throw new ContractError('INVALID_APPLICATION');return{status:200,body:await this.registry.updateApplication(principalId,applicationConfiguration[1],body as never)};}
      }
      const environmentConfiguration=/^\/operations\/applications\/([0-9a-f-]{36})\/environments\/([0-9a-f-]{36})$/.exec(path);
      if(environmentConfiguration&&request.method==='PUT'){if(url.searchParams.size)throw new ContractError('INVALID_QUERY');const body=this.body(request);if(Object.keys(body).some(key=>!['enabled','reason'].includes(key)))throw new ContractError('INVALID_ENVIRONMENT');return{status:200,body:await this.registry.configureEnvironment(principalId,environmentConfiguration[1],environmentConfiguration[2],body as never)};}
      if(configurationRoute&&request.method==='PUT'){const body=this.body(request);if(Object.keys(body).some(k=>!['allowedOrigins','reason'].includes(k))||!Array.isArray(body.allowedOrigins)||typeof body.reason!=='string')throw new ContractError('INVALID_ORIGINS');return{status:200,body:await this.registry.configureApplication(principalId,configurationRoute[1],{allowedOrigins:body.allowedOrigins as string[],reason:body.reason})};}
      const correlationRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/events\/([0-9a-f-]{36})\/correlation$/.exec(path);
      if(correlationRoute&&request.method==='GET'){
       if([...url.searchParams.keys()].some(key=>!['environmentId','tenantReference','kind','from','to','page','pageSize'].includes(key)||url.searchParams.getAll(key).length!==1))throw new ContractError('INVALID_QUERY');
       const environmentId=url.searchParams.get('environmentId');if(!isUuid(environmentId))throw new ContractError('INVALID_DATA_SCOPE');
       const filter:{kind?:string;from?:string;to?:string;page?:number;pageSize?:number}={};for(const key of ['kind','from','to'] as const)if(url.searchParams.has(key))filter[key]=url.searchParams.get(key)!;for(const key of ['page','pageSize'] as const)if(url.searchParams.has(key)){const value=url.searchParams.get(key)!;if(!/^\d{1,4}$/.test(value))throw new ContractError('INVALID_PAGINATION');filter[key]=Number(value);}
       return{status:200,body:await new OperationsService(this.database,this.registry).correlation(principalId,{applicationId:correlationRoute[1],environmentId,...(url.searchParams.has('tenantReference')?{tenantReference:url.searchParams.get('tenantReference')||null}:{})},correlationRoute[2],filter)};
      }
      const dataRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/(overview|analytics|events|issues|incidents|feedback|alerts|export)(?:\/([0-9a-f-]{36}))?(?:\/(transition|replies))?$/.exec(path);
      if(dataRoute&&isUuid(dataRoute[1])){
        const issueList=request.method==='GET'&&dataRoute[2]==='issues'&&!dataRoute[3],eventList=request.method==='GET'&&dataRoute[2]==='events'&&!dataRoute[3];
        const allowedQuery=['environmentId','tenantReference','from','to','q','severity','category','release','status','page','pageSize','resource',...(issueList?['sort','groupBy']:[]),...(eventList?['includeIssue']:[])];if([...url.searchParams.keys()].some(k=>!allowedQuery.includes(k)||url.searchParams.getAll(k).length!==1))throw new ContractError('INVALID_QUERY');
        const body=request.method==='GET'?{}:this.body(request);
        const environmentId=request.method==='GET'?url.searchParams.get('environmentId'):body.environmentId;if(!isUuid(environmentId))throw new ContractError('INVALID_DATA_SCOPE');
        const tenantReference=request.method==='GET'?(url.searchParams.has('tenantReference')?url.searchParams.get('tenantReference')||null:undefined):body.tenantReference as string|null|undefined;
        const scope:OperationScope={applicationId:dataRoute[1],environmentId,tenantReference},ops=new OperationsService(this.database,this.registry);
        const filter:QueryFilter={};for(const key of ['from','to','q','severity','category','release','status','sort','groupBy'] as const){const value=url.searchParams.get(key);if(value!==null)filter[key]=value;}for(const key of ['page','pageSize'] as const){const value=url.searchParams.get(key);if(value!==null){if(!/^\d{1,4}$/.test(value))throw new ContractError('INVALID_PAGINATION');filter[key]=Number(value);}}
        if(url.searchParams.has('includeIssue')){const value=url.searchParams.get('includeIssue');if(!['true','false'].includes(value!))throw new ContractError('INVALID_FILTER');filter.includeIssue=value==='true';}
        if(request.method==='GET'){
          if(dataRoute[2]==='overview')return{status:200,body:await ops.overview(principalId,scope,filter)};
          if(dataRoute[2]==='analytics'&&!dataRoute[3])return{status:200,body:await ops.analytics(principalId,scope,filter)};
          if(dataRoute[2]==='export'){const resource=url.searchParams.get('resource');if(!['events','issues','incidents','feedback','alerts'].includes(resource??''))throw new ContractError('INVALID_RESOURCE');return{status:200,body:await ops.exportCsv(principalId,scope,resource as Resource,filter),headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="observability.csv"'}};}
          return{status:200,body:dataRoute[3]?await ops.detail(principalId,scope,dataRoute[2] as Resource,dataRoute[3]):await ops.list(principalId,scope,dataRoute[2] as Resource,filter)};
        }
        if(request.method==='POST'&&dataRoute[2]==='issues'&&dataRoute[3]&&!dataRoute[4]){if(Object.keys(body).some(k=>!['environmentId','tenantReference','status','assignedPrincipalId','note','reason'].includes(k)))throw new ContractError('INVALID_ISSUE_COMMAND');return{status:200,body:await ops.changeIssue(principalId,scope,dataRoute[3],{status:body.status as 'OPEN',assignedPrincipalId:body.assignedPrincipalId as string|null|undefined,note:body.note as string|undefined,reason:body.reason as string})};}
        if(request.method==='POST'&&dataRoute[2]==='incidents'&&dataRoute[3]&&dataRoute[4]==='transition'){if(Object.keys(body).some(k=>!['environmentId','tenantReference','status','reason'].includes(k))||typeof body.status!=='string'||typeof body.reason!=='string')throw new ContractError('INVALID_INCIDENT_COMMAND');const dataScope=await this.registry.dataScope(principalId,scope,['ADMIN','OPERATOR']);return{status:200,body:await new IssueEngine(this.database,this.registry).transitionIncident(principalId,dataScope,dataRoute[3],body.status as 'TRIAGED',body.reason)};}
        if(request.method==='POST'&&dataRoute[2]==='incidents'&&dataRoute[3]&&!dataRoute[4]){if(Object.keys(body).some(k=>!['environmentId','tenantReference','assignedPrincipalId','note','reason'].includes(k)))throw new ContractError('INVALID_INCIDENT_COMMAND');return{status:200,body:await ops.annotateIncident(principalId,scope,dataRoute[3],{assignedPrincipalId:body.assignedPrincipalId as string|null|undefined,note:body.note as string|undefined,reason:body.reason as string})};}
        if(request.method==='POST'&&dataRoute[2]==='feedback'&&dataRoute[3]&&dataRoute[4]==='replies'){if(Object.keys(body).some(k=>!['environmentId','tenantReference','body','internal','status'].includes(k)))throw new ContractError('INVALID_FEEDBACK_RESPONSE');const dataScope=await this.registry.dataScope(principalId,scope,['ADMIN','OPERATOR']);return{status:201,body:await new FeedbackService(this.database,this.registry).respond(principalId,dataScope,dataRoute[3],{body:body.body as string,internal:body.internal as boolean|undefined,status:body.status as 'NEW'})};}
      }
      const ruleRoute=/^\/operations\/applications\/([0-9a-f-]{36})\/rules$/.exec(path);
      if(ruleRoute&&isUuid(ruleRoute[1])){
        if(request.method==='GET')return{status:200,body:await this.database.control(async c=>{await this.registry.authorize(c,principalId,ruleRoute[1],['ADMIN','OPERATOR','ANALYST','VIEWER']);return(await c.query('SELECT code,enabled,threshold,minimum_samples,window_seconds,cooldown_seconds FROM observability.monitoring_rules WHERE application_id=$1 ORDER BY code',[ruleRoute[1]])).rows;})};
        if(request.method==='PUT'){const body=this.body(request);if(Object.keys(body).some(k=>!['code','enabled','threshold','minimum_samples','window_seconds','cooldown_seconds','reason'].includes(k)))throw new ContractError('INVALID_RULE');await new MonitoringEngine(this.database,this.registry).configure(principalId,ruleRoute[1],body as never);return{status:200,body:{updated:true}};}
      }
      if(path==='/operations/applications'&&request.method==='GET')return{status:200,body:await this.database.control(async c=>{
        const all=await this.registry.isSuperAdmin(c,principalId);
        return(await c.query(`SELECT a.id,a.slug,a.name,a.description,a.enabled,a.created_at FROM observability.applications a WHERE $1::boolean OR EXISTS(SELECT 1 FROM observability.access_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.application_id=a.id AND g.principal_id=$2 AND p.active=true AND g.revoked_at IS NULL) ORDER BY a.name LIMIT 100`,[all,principalId])).rows;
      })};
      if(path==='/operations/applications'&&request.method==='POST'){const body=this.body(request);if(Object.keys(body).some(k=>!['slug','name','description','allowedOrigins'].includes(k))||typeof body.slug!=='string'||typeof body.name!=='string'||(body.description!==undefined&&typeof body.description!=='string')||(body.allowedOrigins!==undefined&&(!Array.isArray(body.allowedOrigins)||body.allowedOrigins.some(v=>typeof v!=='string'))))throw new ContractError('INVALID_APPLICATION');return{status:201,body:await this.registry.createApplication(principalId,{slug:body.slug,name:body.name,description:body.description as string|undefined,allowedOrigins:body.allowedOrigins as string[]|undefined})};}
      const match=/^\/operations\/applications\/([0-9a-f-]{36})\/(environments|credentials)$/.exec(path);
      if(match&&isUuid(match[1])){
        const appId=match[1];
        if(request.method==='GET'&&match[2]==='credentials'){if([...url.searchParams.keys()].some(key=>key!=='page'||url.searchParams.getAll(key).length!==1))throw new ContractError('INVALID_QUERY');return{status:200,body:await this.registry.integrationCredentials(principalId,appId,url.searchParams.has('page')?Number(url.searchParams.get('page')):1)};}
        if(request.method==='GET'&&match[2]==='environments')return{status:200,body:await this.database.control(async c=>{const all=await this.registry.isSuperAdmin(c,principalId);return(await c.query(`SELECT e.id,e.key,e.kind,e.enabled FROM observability.environments e WHERE e.application_id=$1 AND ($2::boolean OR EXISTS(SELECT 1 FROM observability.access_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.application_id=e.application_id AND g.principal_id=$3 AND p.active=true AND g.revoked_at IS NULL AND (g.environment_id IS NULL OR g.environment_id=e.id))) ORDER BY e.key`,[appId,all,principalId])).rows;})};
        if(request.method==='POST'&&match[2]==='environments'){const body=this.body(request);if(Object.keys(body).some(k=>!['key','kind'].includes(k))||typeof body.key!=='string'||typeof body.kind!=='string')throw new ContractError('INVALID_ENVIRONMENT');return{status:201,body:await this.registry.createEnvironment(principalId,appId,{key:body.key,kind:body.kind as 'DEVELOPMENT'})};}
        if(request.method==='POST'&&match[2]==='credentials'){const body=this.body(request);if(Object.keys(body).some(k=>!['environmentId','reason'].includes(k))||!isUuid(body.environmentId)||typeof body.reason!=='string')throw new ContractError('INVALID_CREDENTIAL_REQUEST');return{status:201,body:await this.registry.issueServerCredential(principalId,appId,body.environmentId,body.reason)};}
      }
      return{status:404,body:{reasonCode:'NOT_FOUND'}};
    }catch(error){
      if(error instanceof ContractError){const forbidden=/DENIED|REQUIRED|SCOPE_MISMATCH|UNTRUSTED|LAST_SUPER/.test(error.reasonCode),unauthorized=/AUTHENTICATION_REQUIRED|INVALID_INGESTION_CREDENTIAL/.test(error.reasonCode),missing=/NOT_FOUND$/.test(error.reasonCode);return{status:unauthorized?401:forbidden?403:missing?404:400,body:{reasonCode:error.reasonCode}};}
      // SQL/provider messages and credentials never cross this boundary.
      return{status:503,body:{reasonCode:'HUB_UNAVAILABLE'}};
    }
  }
  private async origin(applicationId:string,source:string,origin?:string){if(source!=='BROWSER')return;const allowed=await this.database.control(async c=>(await c.query<{allowed_origins:string[]}>('SELECT allowed_origins FROM observability.applications WHERE id=$1',[applicationId])).rows[0]?.allowed_origins??[]);if(!origin||!allowed.includes(origin))throw new ContractError('BROWSER_ORIGIN_DENIED');}
  private async actorAllowed(credential:Parameters<IngestionPolicy['allow']>[0]){if(this.ingestionPolicy&&!(await this.ingestionPolicy.allow(credential)))throw new ContractError('INVALID_INGESTION_CREDENTIAL');}
}
