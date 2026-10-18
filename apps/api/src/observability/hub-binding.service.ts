import { Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HubDatabase, RegistryService, IngestionService, HubHttpApi, IssueEngine, MonitoringEngine, AlertService, InvestigatorService, AesCredentialVault, JsonInvestigationProvider, type HubHttpRequest } from '@observability/server';
import { NodeSdk, type NodeContext } from '@observability/node-sdk';
import { ContractError, isUuid, type IdentityScope } from '@observability/contracts';
import { AuthService } from '../auth/auth.service.js';
import { DatabaseService } from '../database/database.service.js';
import { databaseUrl, loadLocalEnvironment, aiCredentialEncryptionKey } from '../config.js';
import { observeSessionRevocation } from './security-events.js';
import { NotificationService } from '../notifications/notification.service.js';
export interface HubBindingConfiguration {applicationId:string;environmentId:string;enabled:boolean;}
export function hubBindingConfiguration():HubBindingConfiguration|undefined{
 loadLocalEnvironment();if(process.env.OBSERVABILITY_ENABLED==='false')return;
 let config:Partial<HubBindingConfiguration>={applicationId:process.env.OBSERVABILITY_APPLICATION_ID,environmentId:process.env.OBSERVABILITY_ENVIRONMENT_ID};
 if(process.env.NODE_ENV!=='production'&&!config.applicationId){const file=resolve(process.cwd(),'../../.local/observability.json');if(existsSync(file)){try{config=JSON.parse(readFileSync(file,'utf8')) as HubBindingConfiguration;}catch{return;}}}
 if(process.env.NODE_ENV==='production'&&process.env.OBSERVABILITY_ENABLED!=='true')return;
 if(!isUuid(config.applicationId)||!isUuid(config.environmentId))return;
 return {applicationId:config.applicationId,environmentId:config.environmentId,enabled:true};
}
@Injectable()
export class HubBindingService implements OnModuleInit,OnModuleDestroy {
 private readonly logger=new Logger(HubBindingService.name);
 private hub?:HubDatabase;private registry?:RegistryService;private api?:HubHttpApi;private configuration?:HubBindingConfiguration;private servicePrincipal?:string;
 private sdk?:NodeSdk;private timer?:NodeJS.Timeout;private working=false;private lastRules=0;private unsubscribe?:()=>void;
 private investigator?:InvestigatorService;
 private unregisterNotifications?:()=>void;
 constructor(private readonly auth:AuthService,private readonly productDatabase:DatabaseService,private readonly notifications:NotificationService){}
 async onModuleInit(){
  this.configuration=hubBindingConfiguration();if(!this.configuration)return;
  try{
   this.hub=new HubDatabase({connectionString:databaseUrl(),max:4});this.registry=new RegistryService(this.hub);const config=this.configuration;
   this.servicePrincipal=await this.registry.principal({issuer:'jupiter-adapter',subject:config.applicationId,displayName:'Jupiter host adapter'});
   const vaultKey=aiCredentialEncryptionKey();
   if(vaultKey){
    let allowedHosts=(process.env.OBSERVABILITY_AI_ALLOWED_HOSTS??'api.openai.com').split(',').map(value=>value.trim()).filter(Boolean);
    const file=resolve(process.cwd(),'../../.local/observability-ai.json');if(process.env.NODE_ENV!=='production'&&existsSync(file)){try{const value=JSON.parse(readFileSync(file,'utf8'));if(Array.isArray(value.allowedHosts)&&value.allowedHosts.every((host:unknown)=>typeof host==='string'))allowedHosts=value.allowedHosts;}catch{/* Keep explicit environment policy. */}}
    const policy={allowedHosts,allowLoopback:process.env.NODE_ENV!=='production'&&process.env.OBSERVABILITY_AI_ALLOW_LOCAL_FAKE==='true'};
    this.investigator=new InvestigatorService(this.hub,this.registry,new AesCredentialVault(vaultKey),new JsonInvestigationProvider(policy),policy);
   }
   this.api=new HubHttpApi(this.hub,this.registry,new IngestionService(this.hub),{verify:async bearer=>{
    const user=await this.user(`Bearer ${bearer}`);const identity={issuer:'jupiter',subject:user.id,displayName:user.display_name};const principalId=await this.registry!.principal(identity);
    await this.registry!.synchronizeExternalAdmin(principalId,config.applicationId,'jupiter-platform-admin',user.is_platform_admin,this.servicePrincipal!);return identity;
   }},{allow:async credential=>{
    if(credential.applicationId!==config.applicationId||credential.source!=='BROWSER')return true;
    if(!credential.actorReference)return false;
    try{await this.auth.profile(credential.actorReference);if(credential.tenantReference)await this.membership(credential.actorReference,credential.tenantReference);return true;}catch{return false;}
   }},this.investigator);
   let cached:{token:string;expiresAt:string}|undefined;
   const endpoint=`http://127.0.0.1:${Number(process.env.API_PORT??3000)}/api/v1/observability`;
   this.sdk=new NodeSdk({applicationId:config.applicationId,environmentId:config.environmentId,endpoint,release:process.env.JUPITER_RELEASE_VERSION??'development',credentialProvider:async()=>{if(!cached||Date.parse(cached.expiresAt)<Date.now()+60_000)cached=await this.registry!.mintForTrustedHost({...config,actorReference:null,tenantReference:null},'SERVER',this.servicePrincipal!);return cached.token;}}).start();
   this.unsubscribe=observeSessionRevocation(userId=>this.registry!.revokeActorCredentials(config.applicationId,userId));
   const alerts=new AlertService(this.hub,this.registry);
   this.unregisterNotifications=this.notifications.registerOperationalSource('jupiter-observability',async userId=>{
    const user=await this.auth.profile(userId);
    const principal=await this.registry!.principal({issuer:'jupiter',subject:user.id,displayName:user.display_name});
    await this.registry!.synchronizeExternalAdmin(principal,config.applicationId,'jupiter-platform-admin',user.is_platform_admin,this.servicePrincipal!);
    try{return(await alerts.inbox(principal,config)).map(row=>({id:row.id,type:'observability.alert' as const,title:row.title,href:'/operations#alerts' as const,occurredAt:new Date(row.delivered_at).toISOString(),read:Boolean(row.read_at)}));}
    catch(error){if(error instanceof ContractError&&error.reasonCode==='OPERATIONAL_ACCESS_DENIED')return[];throw error;}
   });
   if(process.env.JUPITER_WORKER_ENABLED==='true'||process.env.OBSERVABILITY_WORKER_ENABLED==='true'){
    const engine=new IssueEngine(this.hub,this.registry),rules=new MonitoringEngine(this.hub,this.registry),workerId=crypto.randomUUID();
    const drain=async()=>{if(this.working)return;this.working=true;try{const jobs=await engine.queue.claim(workerId,25,['AGGREGATE']);for(const job of jobs){try{await engine.aggregate(job);}catch{await engine.queue.fail(job,'AGGREGATION_FAILED');}}if(Date.now()-this.lastRules>=60_000){await rules.evaluate();await alerts.enqueue();await this.investigator?.schedule();this.lastRules=Date.now();}for(const job of await engine.queue.claim(workerId,5,['ALERT_DELIVERY'])){try{await alerts.deliver(job);}catch{await engine.queue.fail(job,'ALERT_DELIVERY_FAILED');}}if(this.investigator){for(const job of await engine.queue.claim(workerId,1,['INVESTIGATE'])){try{await this.investigator.execute(job);}catch{await engine.queue.fail(job,'INVESTIGATION_FAILED');}}}}catch{this.logger.warn('OBSERVABILITY_WORKER_UNAVAILABLE');}finally{this.working=false;}};
    this.timer=setInterval(()=>void drain(),2_000);this.timer.unref();void drain();
   }
  }catch{this.api=undefined;this.logger.warn('OBSERVABILITY_NOT_READY');}
 }
 enabled(){return Boolean(this.api&&this.configuration);}
 publicConfiguration(){return this.enabled()?{enabled:true,applicationId:this.configuration!.applicationId,environmentId:this.configuration!.environmentId,releaseVersion:process.env.JUPITER_RELEASE_VERSION??'development'}:{enabled:false};}
 private async user(authorization?:string){const token=authorization?.replace(/^Bearer\s+/i,'');if(!token)throw new ContractError('AUTHENTICATION_REQUIRED');try{const identity=await this.auth.verify(token);return await this.auth.profile(identity.sub);}catch{throw new ContractError('AUTHENTICATION_REQUIRED');}}
 private async membership(userId:string,organizationId:string){if(!isUuid(organizationId))throw new ContractError('INVALID_TENANT_SCOPE');const result=await this.productDatabase.query("SELECT 1 FROM memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=$1 AND m.organization_id=$2 AND m.status='active' AND o.status IN ('active','setup')",[userId,organizationId]);if(!result.rowCount)throw new ContractError('TENANT_ACCESS_DENIED');}
 async browserCredential(authorization?:string,organizationId?:string){
  if(!this.api||!this.registry||!this.configuration||!this.servicePrincipal)throw new ContractError('HUB_NOT_CONFIGURED');
  const user=await this.user(authorization);if(organizationId)await this.membership(user.id,organizationId);
  const scope:IdentityScope={applicationId:this.configuration.applicationId,environmentId:this.configuration.environmentId,actorReference:user.id,tenantReference:organizationId||null};
  const credential=await this.registry.mintForTrustedHost(scope,'BROWSER',this.servicePrincipal);return {...credential,endpoint:'/api/v1/observability'};
 }
 async dispatch(request:HubHttpRequest){if(!this.api)return{status:503,body:{reasonCode:'HUB_NOT_CONFIGURED'}};return this.api.dispatch(request);}
 async requestContext(request:{headers?:Record<string,string|undefined>}):Promise<NodeContext>{
  if(!this.configuration)throw new Error('HUB_NOT_CONFIGURED');let actorReference:string|null=null,tenantReference:string|null=null;
  try{const user=await this.user(request.headers?.authorization);actorReference=user.id;const tenant=request.headers?.['x-organization-id'];if(tenant){await this.membership(user.id,tenant);tenantReference=tenant;}}catch{/* Unverified claims never become trusted telemetry identity. */}
  return{applicationId:this.configuration.applicationId,environmentId:this.configuration.environmentId,actorReference,tenantReference};
 }
 instrumentation(){return this.sdk;}
 async onModuleDestroy(){if(this.timer)clearInterval(this.timer);this.unsubscribe?.();this.unregisterNotifications?.();await this.sdk?.shutdown();await this.hub?.close();}
}
