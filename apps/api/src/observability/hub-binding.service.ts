import { Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HubDatabase, RegistryService, IngestionService, HubHttpApi, IssueEngine, MonitoringEngine, AlertService, RetentionService, InvestigatorService, AesCredentialVault, JsonInvestigationProvider, HubDiagnosticReporter, SelfMonitoringService, type HubHttpRequest } from '@observability/server';
import { NodeSdk, type NodeContext } from '@observability/node-sdk';
import { observeJob } from '@observability/nestjs-adapter';
import { ContractError, isUuid, type IdentityScope } from '@observability/contracts';
import { AuthService } from '../auth/auth.service.js';
import { DatabaseService } from '../database/database.service.js';
import { databaseUrl, loadLocalEnvironment, aiCredentialEncryptionKey } from '../config.js';
import { observeSessionRevocation } from './security-events.js';
import { NotificationService } from '../notifications/notification.service.js';
export interface HubBindingConfiguration {applicationId:string;environmentId:string;enabled:boolean;ruleEvaluationIntervalMs?:number;}
export function monitoringRuleIntervalMs(value:string|undefined):number{
 const normalized=value?.trim();if(!normalized||!/^\d+$/.test(normalized))return 60_000;
 const interval=Number(normalized);return Number.isSafeInteger(interval)&&interval>=10_000&&interval<=300_000?interval:60_000;
}
export type ProductWorkerOperation='subscription.expire_due'|'commercial.enumerate_organizations'|'commercial.provision_current'|'directory.schedule_due'|'directory.evaluate_health'|'queue.providers.initialize'|'queue.ai.enumerate'|'queue.ai.process'|'queue.transcription.enumerate'|'queue.transcription.process'|'queue.intake.enumerate'|'queue.intake.process'|'queue.intake.cleanup';
export function hubBindingConfiguration():HubBindingConfiguration|undefined{
 loadLocalEnvironment();if(process.env.OBSERVABILITY_ENABLED==='false')return;
 let config:Partial<HubBindingConfiguration>={applicationId:process.env.OBSERVABILITY_APPLICATION_ID,environmentId:process.env.OBSERVABILITY_ENVIRONMENT_ID};
 if(process.env.NODE_ENV!=='production'&&!config.applicationId){const file=resolve(process.cwd(),'../../.local/observability.json');if(existsSync(file)){try{config=JSON.parse(readFileSync(file,'utf8')) as HubBindingConfiguration;}catch{return;}}}
 if(process.env.NODE_ENV==='production'&&process.env.OBSERVABILITY_ENABLED!=='true')return;
 if(!isUuid(config.applicationId)||!isUuid(config.environmentId))return;
 return {applicationId:config.applicationId,environmentId:config.environmentId,enabled:true,ruleEvaluationIntervalMs:monitoringRuleIntervalMs(process.env.OBSERVABILITY_RULE_EVALUATION_INTERVAL_MS)};
}
@Injectable()
export class HubBindingService implements OnModuleInit,OnModuleDestroy {
 private readonly logger=new Logger(HubBindingService.name);
 private readonly diagnostics=new HubDiagnosticReporter(entry=>this.logger.warn(JSON.stringify(entry)));
 private hub?:HubDatabase;private registry?:RegistryService;private api?:HubHttpApi;private configuration?:HubBindingConfiguration;private servicePrincipal?:string;
 private sdk?:NodeSdk;private timer?:NodeJS.Timeout;private working=false;private lastRules?:number;private lastMaintenance=0;private unsubscribe?:()=>void;
 private investigator?:InvestigatorService;
 private selfMonitoring?:SelfMonitoringService;
 private storageSampling?:Promise<unknown>;
 private unregisterNotifications?:()=>void;
 constructor(private readonly auth:AuthService,private readonly productDatabase:DatabaseService,private readonly notifications:NotificationService){}
 async onModuleInit(){
  this.configuration=hubBindingConfiguration();if(!this.configuration)return;
  try{
   this.hub=new HubDatabase({connectionString:databaseUrl(),max:4});this.registry=new RegistryService(this.hub);const config=this.configuration;
   this.selfMonitoring=new SelfMonitoringService(this.hub,this.registry,entry=>this.logger.warn(JSON.stringify(entry)));
   this.servicePrincipal=await this.registry.principal({issuer:'jupiter-adapter',subject:config.applicationId,displayName:'Jupiter host adapter'});
   const vaultKey=aiCredentialEncryptionKey();
   if(vaultKey){
    let allowedHosts=(process.env.OBSERVABILITY_AI_ALLOWED_HOSTS??'api.openai.com').split(',').map(value=>value.trim()).filter(Boolean);
    const file=resolve(process.cwd(),'../../.local/observability-ai.json');if(process.env.NODE_ENV!=='production'&&existsSync(file)){try{const value=JSON.parse(readFileSync(file,'utf8'));if(Array.isArray(value.allowedHosts)&&value.allowedHosts.every((host:unknown)=>typeof host==='string'))allowedHosts=value.allowedHosts;}catch{/* Keep explicit environment policy. */}}
    const policy={allowedHosts,allowLoopback:process.env.NODE_ENV!=='production'&&process.env.OBSERVABILITY_AI_ALLOW_LOCAL_FAKE==='true'};
    this.investigator=new InvestigatorService(this.hub,this.registry,new AesCredentialVault(vaultKey),new JsonInvestigationProvider(policy),policy);
   }
   this.api=new HubHttpApi(this.hub,this.registry,new IngestionService(this.hub,this.selfMonitoring),{verify:async bearer=>{
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
   const alerts=new AlertService(this.hub,this.registry),retention=new RetentionService(this.hub,this.registry);
   this.unregisterNotifications=this.notifications.registerOperationalSource('jupiter-observability',async userId=>{
    const user=await this.auth.profile(userId);
    const principal=await this.registry!.principal({issuer:'jupiter',subject:user.id,displayName:user.display_name});
    await this.registry!.synchronizeExternalAdmin(principal,config.applicationId,'jupiter-platform-admin',user.is_platform_admin,this.servicePrincipal!);
    try{return(await alerts.inbox(principal,config)).map(row=>({id:row.id,type:'observability.alert' as const,title:row.title,href:'/operations#alerts' as const,occurredAt:new Date(row.delivered_at).toISOString(),read:Boolean(row.read_at)}));}
    catch(error){if(error instanceof ContractError&&error.reasonCode==='OPERATIONAL_ACCESS_DENIED')return[];throw error;}
   });
   if(process.env.JUPITER_WORKER_ENABLED==='true'||process.env.OBSERVABILITY_WORKER_ENABLED==='true'){
    const engine=new IssueEngine(this.hub,this.registry),rules=new MonitoringEngine(this.hub,this.registry),workerId=crypto.randomUUID();
    const drain=async()=>{if(this.working)return;this.working=true;try{const jobs=await engine.queue.claim(workerId,25,['AGGREGATE']);for(const job of jobs){try{await engine.aggregate(job);}catch{await engine.queue.fail(job,'AGGREGATION_FAILED');}}await this.evaluateRulesIfDue(rules);if(Date.now()-this.lastMaintenance>=60_000){await alerts.detectPipelineFailures();await alerts.enqueue();await retention.enqueue();await this.selfMonitoring?.flush();this.scheduleStorageSampling();await this.investigator?.schedule();this.lastMaintenance=Date.now();}for(const job of await engine.queue.claim(workerId,5,['ALERT_DELIVERY'])){try{await alerts.deliver(job);}catch{await engine.queue.fail(job,'ALERT_DELIVERY_FAILED');}}for(const job of await engine.queue.claim(workerId,1,['RETENTION'])){try{await retention.execute(job);}catch{await engine.queue.fail(job,'RETENTION_FAILED');}}if(this.investigator){for(const job of await engine.queue.claim(workerId,1,['INVESTIGATE'])){try{await this.investigator.execute(job);}catch{await engine.queue.fail(job,'INVESTIGATION_FAILED');}}}}catch{this.diagnostics.report('WORKER_DRAIN_FAILED');}finally{this.working=false;}};
    this.timer=setInterval(()=>void drain(),2_000);this.timer.unref();void drain();
   }
  }catch{this.api=undefined;this.diagnostics.report('HUB_NOT_READY');}
 }
 private async evaluateRulesIfDue(rules:Pick<MonitoringEngine,'evaluate'>,now=Date.now()){
  const interval=this.configuration?.ruleEvaluationIntervalMs??60_000;
  if(this.lastRules!==undefined&&now-this.lastRules<interval)return;
  this.lastRules=now;
  try{await rules.evaluate();}catch{this.diagnostics.report('WORKER_DRAIN_FAILED');}
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
 private scheduleStorageSampling(){
  if(this.storageSampling||!this.selfMonitoring)return;
  const work=this.selfMonitoring.sampleStorage().catch(()=>this.diagnostics.report('METRICS_STORAGE_UNAVAILABLE'));
  this.storageSampling=work;void work.finally(()=>{if(this.storageSampling===work)this.storageSampling=undefined;});
 }
 async observeBackgroundOperation<T>(operation:ProductWorkerOperation,organizationId:string|null,work:()=>Promise<T>):Promise<T>{
  try{
   const config=this.configuration,sdk=this.sdk;
   if(!config||!sdk||organizationId!==null&&!isUuid(organizationId))return await work();
   // Attribution comes only from the trusted worker's database enumeration.
   return await observeJob(sdk,{applicationId:config.applicationId,environmentId:config.environmentId,actorReference:null,tenantReference:organizationId},operation,work);
  }catch(error){this.diagnostics.report('PRODUCT_WORKER_FAILED');throw error;}
 }
 reportBackgroundOutcome(operation:ProductWorkerOperation,organizationId:string|null,outcome:'RETRY'|'FAILED'|'DEAD_LETTER'){
  try{
   const config=this.configuration,sdk=this.sdk;if(!config||!sdk||organizationId!==null&&!isUuid(organizationId))return;
   sdk.run({applicationId:config.applicationId,environmentId:config.environmentId,actorReference:null,tenantReference:organizationId},()=>sdk.capture({category:'WORKER',source:'WORKER',severity:outcome==='RETRY'?'WARNING':'ERROR',eventCode:'worker.job_failed',normalizedMessage:'Background job reported a controlled failure outcome',operationName:operation,safeMetadata:{failureCode:outcome,retryExhausted:outcome!=='RETRY'}}));
  }catch{this.diagnostics.report('PRODUCT_WORKER_FAILED');}
 }
 async onModuleDestroy(){if(this.timer)clearInterval(this.timer);this.unsubscribe?.();this.unregisterNotifications?.();await this.sdk?.shutdown();await this.selfMonitoring?.flush();await this.storageSampling;await this.hub?.close();}
}
