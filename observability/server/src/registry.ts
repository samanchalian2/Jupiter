import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { ContractError, ENVIRONMENT_KINDS, OPERATIONAL_ROLES, isUuid, type IdentityScope } from '@observability/contracts';
import { sha256, redactText } from '@observability/core';
import { HubDatabase } from './database.js';
import type { DataScope } from './database.js';
import {storedIngestionPolicy,validateIngestionPolicy} from './ingestion-policy.js';

export interface VerifiedPrincipal {issuer:string;subject:string;displayName:string;}
export class RegistryService {
  constructor(private readonly database:HubDatabase){}
  async principal(identity:VerifiedPrincipal):Promise<string>{
    for(const value of [identity.issuer,identity.subject,identity.displayName])if(typeof value!=='string'||!value.trim()||value.length>160)throw new ContractError('INVALID_PRINCIPAL');
    return this.database.control(async c=>(await c.query<{id:string}>(`INSERT INTO observability.principals(issuer,subject,display_name) VALUES($1,$2,$3) ON CONFLICT(issuer,subject) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id`,[identity.issuer,identity.subject,identity.displayName])).rows[0].id);
  }
  /** Explicit CLI/bootstrap entrypoint. It must never be exposed as HTTP API. */
  async bootstrap(identity:VerifiedPrincipal,reason:string):Promise<{principalId:string;created:boolean}>{
    const principalId=await this.principal(identity);this.reason(reason);
    return this.database.control(async c=>{
      await c.query("SELECT pg_advisory_xact_lock(hashtext('observability-super-admin'))");
      const result=await c.query(`INSERT INTO observability.global_grants(principal_id,permission,reason) VALUES($1,'HUB_SUPER_ADMIN',$2) ON CONFLICT(principal_id,permission) DO UPDATE SET revoked_at=NULL,reason=EXCLUDED.reason WHERE observability.global_grants.revoked_at IS NOT NULL RETURNING principal_id`,[principalId,reason]);
      if(result.rowCount)await this.audit(c,null,principalId,'HUB_SUPER_ADMIN_BOOTSTRAPPED',reason,{});
      return {principalId,created:Boolean(result.rowCount)};
    });
  }
  private reason(value:string){if(typeof value!=='string'||value.trim().length<3||value.length>500||redactText(value)!==value)throw new ContractError('INVALID_REASON');}
  async isSuperAdmin(c:PoolClient,principalId:string):Promise<boolean>{return Boolean((await c.query(`SELECT 1 FROM observability.global_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.principal_id=$1 AND g.permission='HUB_SUPER_ADMIN' AND g.revoked_at IS NULL AND p.active=true`,[principalId])).rowCount);}
  async authorize(c:PoolClient,principalId:string,applicationId:string,roles:readonly string[],environmentId?:string,tenantReference?:string|null):Promise<void>{
    if(await this.isSuperAdmin(c,principalId))return;
    const grants=await c.query(`SELECT 1 FROM observability.access_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.application_id=$1 AND g.principal_id=$2 AND p.active=true AND g.revoked_at IS NULL AND g.role=ANY($3::text[]) AND (g.environment_id IS NULL OR g.environment_id=$4) AND (g.tenant_reference IS NULL OR g.tenant_reference=$5)`,[applicationId,principalId,roles,environmentId??null,tenantReference??null]);
    if(!grants.rowCount)throw new ContractError('OPERATIONAL_ACCESS_DENIED');
  }
  async dataScope(principalId:string,input:{applicationId:string;environmentId:string;tenantReference?:string|null},roles:readonly string[]=['ADMIN','OPERATOR','ANALYST','VIEWER']):Promise<DataScope>{
    if(!isUuid(input.applicationId)||!isUuid(input.environmentId)||(input.tenantReference!==undefined&&input.tenantReference!==null&&(typeof input.tenantReference!=='string'||!input.tenantReference.trim()||input.tenantReference.length>160)))throw new ContractError('INVALID_DATA_SCOPE');
    await this.database.control(async c=>{await this.authorize(c,principalId,input.applicationId,roles,input.environmentId,input.tenantReference);if(!(await c.query('SELECT 1 FROM observability.environments WHERE id=$1 AND application_id=$2',[input.environmentId,input.applicationId])).rowCount)throw new ContractError('ENVIRONMENT_NOT_FOUND');});
    return {...input,actorReference:null,tenantReference:input.tenantReference??null,tenantAll:input.tenantReference===undefined,actorAll:true};
  }
  async createApplication(principalId:string,input:{slug:string;name:string;description?:string;allowedOrigins?:string[]}){
    if(!/^[a-z0-9][a-z0-9-]{2,62}$/.test(input.slug)||!input.name?.trim()||input.name.length>160||(input.description?.length??0)>2000)throw new ContractError('INVALID_APPLICATION');
    const origins=input.allowedOrigins??[];if(origins.length>20)throw new ContractError('INVALID_ORIGINS');
    for(const value of origins){let url:URL;try{url=new URL(value);}catch{throw new ContractError('INVALID_ORIGIN');}if(url.origin!==value||url.username||url.password||!['http:','https:'].includes(url.protocol))throw new ContractError('INVALID_ORIGIN');}
    return this.database.control(async c=>{
      const allowed=await this.isSuperAdmin(c,principalId)||(await c.query(`SELECT 1 FROM observability.global_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.principal_id=$1 AND g.permission='REGISTRY_CREATE' AND g.revoked_at IS NULL AND p.active=true`,[principalId])).rowCount;
      if(!allowed)throw new ContractError('REGISTRY_CREATE_DENIED');
      const app=(await c.query<{id:string;slug:string;name:string}>(`INSERT INTO observability.applications(slug,name,description,allowed_origins) VALUES($1,$2,$3,$4) RETURNING id,slug,name`,[input.slug,input.name,input.description??'',origins])).rows[0];
      await c.query(`INSERT INTO observability.access_grants(application_id,principal_id,role,granted_by,reason) VALUES($1,$2,'ADMIN',$2,'Application creator')`,[app.id,principalId]);await this.audit(c,app.id,principalId,'APPLICATION_CREATED','Application registered',{});return app;
    });
  }
  async configureApplication(principalId:string,applicationId:string,input:{allowedOrigins:string[];reason:string}){
    this.reason(input.reason);
    if(!Array.isArray(input.allowedOrigins)||input.allowedOrigins.length>20)throw new ContractError('INVALID_ORIGINS');
    for(const value of input.allowedOrigins){let url:URL;try{url=new URL(value);}catch{throw new ContractError('INVALID_ORIGIN');}if(url.origin!==value||url.username||url.password||!['http:','https:'].includes(url.protocol))throw new ContractError('INVALID_ORIGIN');}
    return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const result=await c.query('UPDATE observability.applications SET allowed_origins=$1 WHERE id=$2 RETURNING id',[Array.from(new Set(input.allowedOrigins)),applicationId]);if(!result.rowCount)throw new ContractError('APPLICATION_NOT_FOUND');await this.audit(c,applicationId,principalId,'APPLICATION_ORIGINS_CHANGED',input.reason,{origins:input.allowedOrigins});return{updated:true};});
  }
  async applicationConfiguration(principalId:string,applicationId:string){
    if(!isUuid(applicationId))throw new ContractError('INVALID_APPLICATION');
    return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const row=(await c.query('SELECT id,slug,name,description,enabled,allowed_origins,updated_at FROM observability.applications WHERE id=$1',[applicationId])).rows[0];if(!row)throw new ContractError('APPLICATION_NOT_FOUND');return row;});
  }
  async updateApplication(principalId:string,applicationId:string,input:{name:string;description:string;enabled:boolean;allowedOrigins:string[];reason:string}){
    this.reason(input.reason);
    if(!isUuid(applicationId)||typeof input.name!=='string'||!input.name.trim()||input.name.length>160||typeof input.description!=='string'||input.description.length>2000||typeof input.enabled!=='boolean'||redactText(input.name)!==input.name||redactText(input.description)!==input.description)throw new ContractError('INVALID_APPLICATION');
    if(!Array.isArray(input.allowedOrigins)||input.allowedOrigins.length>20)throw new ContractError('INVALID_ORIGINS');
    for(const value of input.allowedOrigins){if(typeof value!=='string')throw new ContractError('INVALID_ORIGIN');let url:URL;try{url=new URL(value);}catch{throw new ContractError('INVALID_ORIGIN');}if(url.origin!==value||url.username||url.password||!['http:','https:'].includes(url.protocol))throw new ContractError('INVALID_ORIGIN');}
    return this.database.control(async c=>{
      await this.authorize(c,principalId,applicationId,['ADMIN']);const prior=(await c.query('SELECT enabled FROM observability.applications WHERE id=$1 FOR UPDATE',[applicationId])).rows[0];if(!prior)throw new ContractError('APPLICATION_NOT_FOUND');
      await c.query('UPDATE observability.applications SET name=$1,description=$2,enabled=$3,allowed_origins=$4,updated_at=now() WHERE id=$5',[input.name.trim(),input.description,input.enabled,Array.from(new Set(input.allowedOrigins)),applicationId]);
      await this.audit(c,applicationId,principalId,'APPLICATION_CONFIGURATION_CHANGED',input.reason,{previousEnabled:prior.enabled,enabled:input.enabled,changedFields:['name','description','enabled','allowedOrigins']});return{updated:true};
    });
  }
  async configureEnvironment(principalId:string,applicationId:string,environmentId:string,input:{enabled:boolean;reason:string}){
    this.reason(input.reason);if(!isUuid(applicationId)||!isUuid(environmentId)||typeof input.enabled!=='boolean')throw new ContractError('INVALID_ENVIRONMENT');
    return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const prior=(await c.query('SELECT enabled FROM observability.environments WHERE id=$1 AND application_id=$2 FOR UPDATE',[environmentId,applicationId])).rows[0];if(!prior)throw new ContractError('ENVIRONMENT_NOT_FOUND');await c.query('UPDATE observability.environments SET enabled=$1 WHERE id=$2 AND application_id=$3',[input.enabled,environmentId,applicationId]);await this.audit(c,applicationId,principalId,'ENVIRONMENT_CONFIGURATION_CHANGED',input.reason,{environmentId,previousEnabled:prior.enabled,enabled:input.enabled});return{updated:true};});
  }
  async ingestionPolicy(principalId:string,applicationId:string){
    if(!isUuid(applicationId))throw new ContractError('INVALID_APPLICATION');
    return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const row=(await c.query('SELECT policy FROM observability.applications WHERE id=$1',[applicationId])).rows[0];if(!row)throw new ContractError('APPLICATION_NOT_FOUND');return storedIngestionPolicy(row.policy);});
  }
  async configureIngestionPolicy(principalId:string,applicationId:string,policy:unknown,reason:string){
    this.reason(reason);if(!isUuid(applicationId))throw new ContractError('INVALID_APPLICATION');const validated=validateIngestionPolicy(policy);
    return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const updated=await c.query("UPDATE observability.applications SET policy=jsonb_set(policy,'{ingestion}',$1::jsonb),updated_at=now() WHERE id=$2 RETURNING id",[JSON.stringify(validated),applicationId]);if(!updated.rowCount)throw new ContractError('APPLICATION_NOT_FOUND');await this.audit(c,applicationId,principalId,'INGESTION_POLICY_CHANGED',reason,validated);return{updated:true};});
  }
  async createEnvironment(principalId:string,applicationId:string,input:{key:string;kind:typeof ENVIRONMENT_KINDS[number]}){
    if(!/^[a-zA-Z0-9_-]{1,64}$/.test(input.key)||!ENVIRONMENT_KINDS.includes(input.kind))throw new ContractError('INVALID_ENVIRONMENT');
    return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const row=(await c.query<{id:string;key:string;kind:string}>('INSERT INTO observability.environments(application_id,key,kind) VALUES($1,$2,$3) RETURNING id,key,kind',[applicationId,input.key,input.kind])).rows[0];await this.audit(c,applicationId,principalId,'ENVIRONMENT_CREATED','Environment registered',{environmentId:row.id});return row;});
  }
  async grant(principalId:string,input:{applicationId:string;targetPrincipalId:string;role:typeof OPERATIONAL_ROLES[number];environmentId?:string;tenantReference?:string|null;reason:string}){
    this.reason(input.reason);if(!OPERATIONAL_ROLES.includes(input.role)||(input.tenantReference?.length??0)>160)throw new ContractError('INVALID_GRANT');
    return this.database.control(async c=>{await this.authorize(c,principalId,input.applicationId,['ADMIN'],input.environmentId,input.tenantReference);const result=(await c.query<{id:string}>(`INSERT INTO observability.access_grants(application_id,environment_id,tenant_reference,principal_id,role,granted_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[input.applicationId,input.environmentId??null,input.tenantReference??null,input.targetPrincipalId,input.role,principalId,input.reason])).rows[0];await this.audit(c,input.applicationId,principalId,'ACCESS_GRANTED',input.reason,{grantId:result.id,role:input.role});return result;});
  }
  async revokeGrant(principalId:string,applicationId:string,grantId:string,reason:string){
    this.reason(reason);return this.database.control(async c=>{const grant=(await c.query<{environment_id:string|null;tenant_reference:string|null}>('SELECT environment_id,tenant_reference FROM observability.access_grants WHERE id=$1 AND application_id=$2',[grantId,applicationId])).rows[0];if(!grant)throw new ContractError('GRANT_NOT_FOUND');await this.authorize(c,principalId,applicationId,['ADMIN'],grant.environment_id??undefined,grant.tenant_reference);const result=await c.query('UPDATE observability.access_grants SET revoked_at=now() WHERE id=$1 AND application_id=$2 AND revoked_at IS NULL',[grantId,applicationId]);if(result.rowCount)await this.audit(c,applicationId,principalId,'ACCESS_REVOKED',reason,{grantId});return {revoked:Boolean(result.rowCount)};});
  }
  async transferSuperAdmin(principalId:string,targetPrincipalId:string,reason:string){
    this.reason(reason);return this.database.control(async c=>{await c.query("SELECT pg_advisory_xact_lock(hashtext('observability-super-admin'))");if(!(await this.isSuperAdmin(c,principalId)))throw new ContractError('SUPER_ADMIN_REQUIRED');const target=await c.query('SELECT 1 FROM observability.principals WHERE id=$1 AND active=true',[targetPrincipalId]);if(!target.rowCount)throw new ContractError('INVALID_TARGET_PRINCIPAL');await c.query(`INSERT INTO observability.global_grants(principal_id,permission,granted_by,reason) VALUES($1,'HUB_SUPER_ADMIN',$2,$3) ON CONFLICT(principal_id,permission) DO UPDATE SET revoked_at=NULL,granted_by=EXCLUDED.granted_by,reason=EXCLUDED.reason`,[targetPrincipalId,principalId,reason]);if(targetPrincipalId!==principalId)await c.query(`UPDATE observability.global_grants SET revoked_at=now() WHERE principal_id=$1 AND permission='HUB_SUPER_ADMIN' AND revoked_at IS NULL`,[principalId]);await this.audit(c,null,principalId,'HUB_SUPER_ADMIN_TRANSFERRED',reason,{targetPrincipalId});return {transferred:true};});
  }
  async globalGrant(principalId:string,targetPrincipalId:string,permission:'HUB_SUPER_ADMIN'|'REGISTRY_CREATE',action:'GRANT'|'REVOKE',reason:string){
    this.reason(reason);if(!['HUB_SUPER_ADMIN','REGISTRY_CREATE'].includes(permission)||!['GRANT','REVOKE'].includes(action))throw new ContractError('INVALID_GLOBAL_GRANT');
    return this.database.control(async c=>{
      await c.query("SELECT pg_advisory_xact_lock(hashtext('observability-super-admin'))");
      if(!(await this.isSuperAdmin(c,principalId)))throw new ContractError('SUPER_ADMIN_REQUIRED');
      if(action==='GRANT'){
        if(!(await c.query('SELECT 1 FROM observability.principals WHERE id=$1 AND active=true',[targetPrincipalId])).rowCount)throw new ContractError('INVALID_TARGET_PRINCIPAL');
        await c.query(`INSERT INTO observability.global_grants(principal_id,permission,granted_by,reason) VALUES($1,$2,$3,$4) ON CONFLICT(principal_id,permission) DO UPDATE SET revoked_at=NULL,granted_by=EXCLUDED.granted_by,reason=EXCLUDED.reason`,[targetPrincipalId,permission,principalId,reason]);
      }else{
        if(permission==='HUB_SUPER_ADMIN'&&!(await c.query(`SELECT 1 FROM observability.global_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.permission='HUB_SUPER_ADMIN' AND g.revoked_at IS NULL AND p.active=true AND p.id<>$1 LIMIT 1`,[targetPrincipalId])).rowCount)throw new ContractError('LAST_SUPER_ADMIN');
        await c.query('UPDATE observability.global_grants SET revoked_at=now() WHERE principal_id=$1 AND permission=$2 AND revoked_at IS NULL',[targetPrincipalId,permission]);
      }
      await this.audit(c,null,principalId,action==='GRANT'?'GLOBAL_ACCESS_GRANTED':'GLOBAL_ACCESS_REVOKED',reason,{targetPrincipalId,permission});return {updated:true};
    });
  }
  async issueServerCredential(principalId:string,applicationId:string,environmentId:string,reason:string){
    this.reason(reason);return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN'],environmentId);const token=randomBytes(48).toString('base64url');const row=(await c.query<{id:string;expires_at:Date}>(`INSERT INTO observability.credentials(application_id,environment_id,kind,token_hash,tenant_all,permissions,created_by,expires_at) VALUES($1,$2,'SERVER',$3,true,ARRAY['events:write','credentials:mint'],$4,now()+interval '90 days') RETURNING id,expires_at`,[applicationId,environmentId,await sha256(token),principalId])).rows[0];await this.audit(c,applicationId,principalId,'CREDENTIAL_ISSUED',reason,{credentialId:row.id});return {credentialId:row.id,token,expiresAt:row.expires_at.toISOString()};});
  }
  async credential(token:string,permission:string){
    if(typeof token!=='string'||token.length<32||token.length>256)throw new ContractError('INVALID_INGESTION_CREDENTIAL');
    return this.database.control(async c=>{const row=(await c.query<{id:string;application_id:string;environment_id:string;kind:'SERVER'|'BROWSER';actor_reference:string|null;tenant_reference:string|null;tenant_all:boolean;version:number;expires_at:Date;permissions:string[]}>(`SELECT k.* FROM observability.credentials k JOIN observability.applications a ON a.id=k.application_id JOIN observability.environments e ON e.id=k.environment_id AND e.application_id=k.application_id LEFT JOIN observability.credentials parent ON parent.id=k.parent_id WHERE k.token_hash=$1 AND k.revoked_at IS NULL AND k.expires_at>now() AND a.enabled=true AND e.enabled=true AND (k.parent_id IS NULL OR (parent.revoked_at IS NULL AND parent.expires_at>now()))`,[await sha256(token)])).rows[0];if(!row||!row.permissions.includes(permission))throw new ContractError('INVALID_INGESTION_CREDENTIAL');return {credentialId:row.id,applicationId:row.application_id,environmentId:row.environment_id,actorReference:row.actor_reference,tenantReference:row.tenant_reference,tenantAll:row.tenant_all,source:row.kind,credentialVersion:row.version,expiresAt:row.expires_at.toISOString(),permissions:row.permissions};});
  }
  async mintBrowserCredential(serverToken:string,scope:IdentityScope){
    const server=await this.credential(serverToken,'credentials:mint');if(server.source!=='SERVER'||server.applicationId!==scope.applicationId||server.environmentId!==scope.environmentId)throw new ContractError('APPLICATION_SCOPE_MISMATCH');for(const value of [scope.actorReference,scope.tenantReference])if(value!==null&&(typeof value!=='string'||!value.trim()||value.length>160))throw new ContractError('INVALID_IDENTITY_REFERENCE');
    return this.database.control(async c=>{const token=randomBytes(48).toString('base64url'),permissions=scope.actorReference?['events:write','feedback:write','feedback:own:read']:['events:write'];const row=(await c.query<{id:string;expires_at:Date}>(`INSERT INTO observability.credentials(application_id,environment_id,kind,token_hash,actor_reference,tenant_reference,tenant_all,permissions,parent_id,expires_at) VALUES($1,$2,'BROWSER',$3,$4,$5,false,$6,$7,LEAST(now()+interval '5 minutes',$8::timestamptz)) RETURNING id,expires_at`,[scope.applicationId,scope.environmentId,await sha256(token),scope.actorReference,scope.tenantReference,permissions,server.credentialId,server.expiresAt])).rows[0];return {token,scope,credentialId:row.id,expiresAt:row.expires_at.toISOString()};});
  }
  /** Trusted in-process host adapter only, never an anonymous HTTP command. */
  async mintForTrustedHost(scope:IdentityScope,source:'BROWSER'|'SERVER',createdBy:string){
    if(!isUuid(scope.applicationId)||!isUuid(scope.environmentId)||!isUuid(createdBy))throw new ContractError('INVALID_IDENTITY_SCOPE');
    for(const value of [scope.actorReference,scope.tenantReference])if(value!==null&&(typeof value!=='string'||!value.trim()||value.length>160))throw new ContractError('INVALID_IDENTITY_REFERENCE');
    return this.database.control(async c=>{
      const valid=await c.query('SELECT 1 FROM observability.environments e JOIN observability.applications a ON a.id=e.application_id WHERE a.id=$1 AND e.id=$2 AND a.enabled AND e.enabled',[scope.applicationId,scope.environmentId]);if(!valid.rowCount)throw new ContractError('APPLICATION_UNAVAILABLE');
      const token=randomBytes(48).toString('base64url'),permissions=source==='SERVER'?['events:write']:scope.actorReference?['events:write','feedback:write','feedback:own:read']:['events:write'];
      const result=(await c.query<{id:string;expires_at:Date}>(`INSERT INTO observability.credentials(application_id,environment_id,kind,token_hash,actor_reference,tenant_reference,tenant_all,permissions,created_by,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()+CASE WHEN $3='BROWSER' THEN interval '5 minutes' ELSE interval '1 hour' END) RETURNING id,expires_at`,[scope.applicationId,scope.environmentId,source,await sha256(token),scope.actorReference,scope.tenantReference,source==='SERVER',permissions,createdBy])).rows[0];
      return {token,scope,credentialId:result.id,expiresAt:result.expires_at.toISOString()};
    });
  }
  /** Product-specific policy stays in the trusted caller; this generic port
   * synchronizes only grants owned by that external identity mapping. */
  async synchronizeExternalAdmin(principalId:string,applicationId:string,source:string,enabled:boolean,servicePrincipalId:string){
    if(!/^[a-zA-Z0-9_.:-]{3,100}$/.test(source))throw new ContractError('INVALID_EXTERNAL_MAPPING');
    return this.database.control(async c=>{
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`mapping:${applicationId}:${principalId}:${source}`]);
      if(enabled){const result=await c.query(`INSERT INTO observability.access_grants(application_id,principal_id,role,granted_by,reason,managed_by) SELECT $1,$2,'ADMIN',$3,'Trusted external administrator mapping',$4 WHERE NOT EXISTS(SELECT 1 FROM observability.access_grants WHERE application_id=$1 AND principal_id=$2 AND managed_by=$4 AND revoked_at IS NULL) RETURNING id`,[applicationId,principalId,servicePrincipalId,source]);if(result.rowCount)await this.audit(c,applicationId,servicePrincipalId,'EXTERNAL_ADMIN_MAPPED','Trusted identity synchronization',{principalId,source,automation:true});}
      else{const result=await c.query('UPDATE observability.access_grants SET revoked_at=now() WHERE application_id=$1 AND principal_id=$2 AND managed_by=$3 AND revoked_at IS NULL',[applicationId,principalId,source]);if(result.rowCount)await this.audit(c,applicationId,servicePrincipalId,'EXTERNAL_ADMIN_UNMAPPED','Trusted identity synchronization',{principalId,source,automation:true});}
    });
  }
  async revokeActorCredentials(applicationId:string,actorReference:string){return this.database.control(async c=>{await c.query("UPDATE observability.credentials SET revoked_at=now() WHERE application_id=$1 AND actor_reference=$2 AND kind='BROWSER' AND revoked_at IS NULL",[applicationId,actorReference]);});}
  private managementPage(applicationId:string,page:number){if(!isUuid(applicationId)||!Number.isInteger(page)||page<1||page>400)throw new ContractError('INVALID_MANAGEMENT_PAGE');}
  async accessGrants(principalId:string,applicationId:string,page=1){
    this.managementPage(applicationId,page);return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const total=Number((await c.query('SELECT count(*) FROM observability.access_grants WHERE application_id=$1',[applicationId])).rows[0].count),items=(await c.query(`SELECT g.id,g.principal_id,p.display_name,p.active AS principal_active,g.environment_id,g.tenant_reference,g.role,g.managed_by IS NOT NULL AS managed,g.created_at,g.revoked_at FROM observability.access_grants g JOIN observability.principals p ON p.id=g.principal_id WHERE g.application_id=$1 ORDER BY g.created_at DESC,g.id DESC LIMIT 50 OFFSET $2`,[applicationId,(page-1)*50])).rows;return{items,total,page,pageSize:50};});
  }
  async assignAccess(principalId:string,applicationId:string,input:{targetPrincipalId:string;role:typeof OPERATIONAL_ROLES[number];environmentId?:string|null;tenantReference?:string|null;reason:string}){
    this.reason(input.reason);if(!isUuid(applicationId)||!isUuid(input.targetPrincipalId)||!OPERATIONAL_ROLES.includes(input.role)||input.environmentId!=null&&!isUuid(input.environmentId)||input.tenantReference!=null&&(typeof input.tenantReference!=='string'||!input.tenantReference.trim()||input.tenantReference.length>160||redactText(input.tenantReference)!==input.tenantReference))throw new ContractError('INVALID_GRANT');
    return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);if(!(await c.query('SELECT 1 FROM observability.principals WHERE id=$1 AND active=true',[input.targetPrincipalId])).rowCount)throw new ContractError('INVALID_TARGET_PRINCIPAL');if(input.environmentId&&!(await c.query('SELECT 1 FROM observability.environments WHERE id=$1 AND application_id=$2',[input.environmentId,applicationId])).rowCount)throw new ContractError('ENVIRONMENT_NOT_FOUND');const row=(await c.query<{id:string}>(`INSERT INTO observability.access_grants(application_id,principal_id,role,environment_id,tenant_reference,granted_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id`,[applicationId,input.targetPrincipalId,input.role,input.environmentId??null,input.tenantReference??null,principalId,input.reason])).rows[0];if(!row)throw new ContractError('ACTIVE_GRANT_CONFLICT');await this.audit(c,applicationId,principalId,'ACCESS_GRANTED',input.reason,{grantId:row.id,role:input.role,targetPrincipalId:input.targetPrincipalId,environmentId:input.environmentId??null,tenantReference:input.tenantReference??null});return row;});
  }
  async revokeManagedAccess(principalId:string,applicationId:string,grantId:string,reason:string){
    this.reason(reason);if(!isUuid(applicationId)||!isUuid(grantId))throw new ContractError('INVALID_GRANT');return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const row=(await c.query('SELECT managed_by,revoked_at FROM observability.access_grants WHERE id=$1 AND application_id=$2 FOR UPDATE',[grantId,applicationId])).rows[0];if(!row)throw new ContractError('GRANT_NOT_FOUND');if(row.managed_by!==null)throw new ContractError('HOST_MANAGED_GRANT_DENIED');if(row.revoked_at)return{revoked:false};await c.query('UPDATE observability.access_grants SET revoked_at=now() WHERE id=$1 AND application_id=$2',[grantId,applicationId]);await this.audit(c,applicationId,principalId,'ACCESS_REVOKED',reason,{grantId});return{revoked:true};});
  }
  async integrationCredentials(principalId:string,applicationId:string,page=1){
    this.managementPage(applicationId,page);return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const filter="application_id=$1 AND kind='SERVER' AND parent_id IS NULL AND actor_reference IS NULL AND tenant_reference IS NULL AND tenant_all=true AND permissions @> ARRAY['credentials:mint']::text[]",total=Number((await c.query(`SELECT count(*) FROM observability.credentials WHERE ${filter}`,[applicationId])).rows[0].count),items=(await c.query(`SELECT id,environment_id,created_at,expires_at,revoked_at,permissions FROM observability.credentials WHERE ${filter} ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET $2`,[applicationId,(page-1)*50])).rows;return{items,total,page,pageSize:50};});
  }
  async manageIntegrationCredential(principalId:string,applicationId:string,credentialId:string,action:'ROTATE'|'REVOKE',reason:string){
    this.reason(reason);if(!isUuid(applicationId)||!isUuid(credentialId)||!['ROTATE','REVOKE'].includes(action))throw new ContractError('INVALID_CREDENTIAL_REQUEST');return this.database.control(async c=>{
      await this.authorize(c,principalId,applicationId,['ADMIN']);const prior=(await c.query<{environment_id:string;expires_at:Date;revoked_at:Date|null;permissions:string[]}>(`SELECT environment_id,expires_at,revoked_at,permissions FROM observability.credentials WHERE id=$1 AND application_id=$2 AND kind='SERVER' AND parent_id IS NULL AND actor_reference IS NULL AND tenant_reference IS NULL AND tenant_all=true AND permissions @> ARRAY['credentials:mint']::text[] FOR UPDATE`,[credentialId,applicationId])).rows[0];if(!prior)throw new ContractError('SERVER_CREDENTIAL_NOT_FOUND');
      if(action==='REVOKE'){if(prior.revoked_at)return{revoked:false};await c.query('UPDATE observability.credentials SET revoked_at=now() WHERE id=$1 AND application_id=$2',[credentialId,applicationId]);await this.audit(c,applicationId,principalId,'CREDENTIAL_REVOKED',reason,{credentialId});return{revoked:true};}
      if(prior.revoked_at||prior.expires_at.getTime()<=Date.now())throw new ContractError('INACTIVE_CREDENTIAL');if(!(await c.query('SELECT 1 FROM observability.applications a JOIN observability.environments e ON e.application_id=a.id WHERE a.id=$1 AND e.id=$2 AND a.enabled AND e.enabled',[applicationId,prior.environment_id])).rowCount)throw new ContractError('APPLICATION_UNAVAILABLE');
      const token=randomBytes(48).toString('base64url'),next=(await c.query<{id:string;expires_at:Date}>(`INSERT INTO observability.credentials(application_id,environment_id,kind,token_hash,tenant_all,permissions,created_by,expires_at) VALUES($1,$2,'SERVER',$3,true,$4,$5,now()+interval '90 days') RETURNING id,expires_at`,[applicationId,prior.environment_id,await sha256(token),prior.permissions,principalId])).rows[0];await c.query('UPDATE observability.credentials SET revoked_at=now() WHERE id=$1 AND application_id=$2',[credentialId,applicationId]);await this.audit(c,applicationId,principalId,'CREDENTIAL_ROTATED',reason,{credentialId,newCredentialId:next.id});return{credentialId:next.id,token,expiresAt:next.expires_at.toISOString()};
    });
  }
  async revokeCredential(principalId:string,applicationId:string,credentialId:string,reason:string){this.reason(reason);return this.database.control(async c=>{await this.authorize(c,principalId,applicationId,['ADMIN']);const result=await c.query('UPDATE observability.credentials SET revoked_at=now() WHERE id=$1 AND application_id=$2 AND revoked_at IS NULL',[credentialId,applicationId]);if(result.rowCount)await this.audit(c,applicationId,principalId,'CREDENTIAL_REVOKED',reason,{credentialId});return {revoked:Boolean(result.rowCount)};});}
  async rotateCredential(principalId:string,applicationId:string,credentialId:string,reason:string){
    this.reason(reason);return this.database.control(async c=>{
      const prior=(await c.query<{environment_id:string;kind:string}>('SELECT environment_id,kind FROM observability.credentials WHERE id=$1 AND application_id=$2 AND revoked_at IS NULL FOR UPDATE',[credentialId,applicationId])).rows[0];
      if(!prior||prior.kind!=='SERVER')throw new ContractError('SERVER_CREDENTIAL_NOT_FOUND');await this.authorize(c,principalId,applicationId,['ADMIN'],prior.environment_id);
      const token=randomBytes(48).toString('base64url');const row=(await c.query<{id:string;expires_at:Date}>(`INSERT INTO observability.credentials(application_id,environment_id,kind,token_hash,tenant_all,permissions,created_by,expires_at) VALUES($1,$2,'SERVER',$3,true,ARRAY['events:write','credentials:mint'],$4,now()+interval '90 days') RETURNING id,expires_at`,[applicationId,prior.environment_id,await sha256(token),principalId])).rows[0];
      await c.query('UPDATE observability.credentials SET revoked_at=now() WHERE id=$1',[credentialId]);await this.audit(c,applicationId,principalId,'CREDENTIAL_ROTATED',reason,{credentialId,newCredentialId:row.id});return {credentialId:row.id,token,expiresAt:row.expires_at.toISOString()};
    });
  }
  private async audit(c:PoolClient,applicationId:string|null,actorId:string,action:string,reason:string,metadata:object){await c.query('INSERT INTO observability.audit(application_id,actor_principal_id,action,reason,metadata) VALUES($1,$2,$3,$4,$5)',[applicationId,actorId,action,reason,metadata]);}
}
