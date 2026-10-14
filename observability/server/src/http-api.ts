import { ContractError, isRecord, isUuid } from '@observability/contracts';
import { RegistryService, type VerifiedPrincipal } from './registry.js';
import { IngestionService } from './ingestion.js';
import { HubDatabase } from './database.js';
import { FeedbackService } from './feedback.js';

/** Host-supplied verified identity. Implementations can use JWT/OIDC/session
 * exchange; the core never imports a product's user or membership model. */
export interface OperationalIdentityProvider {verify(bearer:string):Promise<VerifiedPrincipal>;}
export interface HubHttpRequest {method:string;path:string;authorization?:string;origin?:string;body?:unknown;clientKey:string;}
export interface HubHttpResponse {status:number;body:unknown;headers?:Record<string,string>;}
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
  constructor(private readonly database:HubDatabase,private readonly registry:RegistryService,private readonly ingestion:IngestionService,private readonly identities:OperationalIdentityProvider){}
  private bearer(request:HubHttpRequest){const match=/^Bearer ([A-Za-z0-9._~-]{16,4096})$/.exec(request.authorization??'');if(!match)throw new ContractError('AUTHENTICATION_REQUIRED');return match[1];}
  private body(request:HubHttpRequest){if(!isRecord(request.body))throw new ContractError('INVALID_REQUEST');return request.body;}
  async dispatch(request:HubHttpRequest):Promise<HubHttpResponse>{
    try{
      const path=request.path.split('?')[0].replace(/\/$/,'')||'/';
      if(request.method==='GET'&&path==='/health')return{status:200,body:{service:'observability-hub',status:'ok',timestamp:new Date().toISOString()}};
      if(request.method==='GET'&&path==='/ready'){try{await this.database.control(async c=>{await c.query('SELECT 1 FROM observability.applications LIMIT 1');});return{status:200,body:{service:'observability-hub',status:'ready'}};}catch{return{status:503,body:{reasonCode:'STORAGE_UNAVAILABLE'}};}}
      if(!this.requestLimiter.allow(request.clientKey.slice(0,160)))return{status:429,body:{reasonCode:'REQUEST_RATE_LIMIT'},headers:{'Retry-After':'60'}};
      const token=this.bearer(request);
      if(request.method==='POST'&&path==='/events/batch'){
        const credential=await this.registry.credential(token,'events:write');
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
        const credential=await this.registry.credential(token,'feedback:write');await this.origin(credential.applicationId,credential.source,request.origin);
        if(!this.feedbackLimiter.allow(`${credential.applicationId}:${credential.actorReference}`))return{status:429,body:{reasonCode:'FEEDBACK_RATE_LIMIT'},headers:{'Retry-After':'60'}};
        return{status:201,body:await new FeedbackService(this.database,this.registry).submit(credential,request.body)};
      }
      if(request.method==='GET'&&(path==='/feedback/mine'||/^\/feedback\/[0-9a-f-]{36}$/.test(path))){
        const credential=await this.registry.credential(token,'feedback:own:read'),service=new FeedbackService(this.database,this.registry);
        if(request.origin)await this.origin(credential.applicationId,credential.source,request.origin);
        return{status:200,body:path==='/feedback/mine'?await service.mine(credential):await service.ownDetail(credential,path.slice('/feedback/'.length))};
      }
      if(!path.startsWith('/operations/'))return{status:404,body:{reasonCode:'NOT_FOUND'}};
      let verified:VerifiedPrincipal;try{verified=await this.identities.verify(token);}catch{throw new ContractError('AUTHENTICATION_REQUIRED');}
      const principalId=await this.registry.principal(verified);
      if(!this.operationsLimiter.allow(principalId))return{status:429,body:{reasonCode:'OPERATIONS_RATE_LIMIT'}};
      if(path==='/operations/applications'&&request.method==='GET')return{status:200,body:await this.database.control(async c=>{
        const all=await this.registry.isSuperAdmin(c,principalId);
        return(await c.query(`SELECT a.id,a.slug,a.name,a.description,a.enabled,a.created_at FROM observability.applications a WHERE $1::boolean OR EXISTS(SELECT 1 FROM observability.access_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.application_id=a.id AND g.principal_id=$2 AND p.active=true AND g.revoked_at IS NULL) ORDER BY a.name LIMIT 100`,[all,principalId])).rows;
      })};
      if(path==='/operations/applications'&&request.method==='POST'){const body=this.body(request);if(Object.keys(body).some(k=>!['slug','name','description','allowedOrigins'].includes(k))||typeof body.slug!=='string'||typeof body.name!=='string'||(body.description!==undefined&&typeof body.description!=='string')||(body.allowedOrigins!==undefined&&(!Array.isArray(body.allowedOrigins)||body.allowedOrigins.some(v=>typeof v!=='string'))))throw new ContractError('INVALID_APPLICATION');return{status:201,body:await this.registry.createApplication(principalId,{slug:body.slug,name:body.name,description:body.description as string|undefined,allowedOrigins:body.allowedOrigins as string[]|undefined})};}
      const match=/^\/operations\/applications\/([0-9a-f-]{36})\/(environments|credentials)$/.exec(path);
      if(match&&isUuid(match[1])){
        const appId=match[1];
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
}
