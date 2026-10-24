import {expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {HubHttpApi,createHubServer,IssueEngine,OperationsService,InvestigatorService,AesCredentialVault,type HubDatabase,type RegistryService,type IngestionService} from '../src/index.js';
import type {TelemetryEvent} from '@observability/contracts';

export async function roleMatrixAcceptance(database:HubDatabase,registry:RegistryService,ingestion:IngestionService,root:string,role:'ADMIN'|'OPERATOR'|'ANALYST'|'VIEWER'){
 const applicationId=(await registry.createApplication(root,{slug:`role-${randomUUID()}`,name:'Role matrix fixture'})).id,foreignApp=(await registry.createApplication(root,{slug:`foreign-role-${randomUUID()}`,name:'Foreign role fixture'})).id;
 const environmentId=(await registry.createEnvironment(root,applicationId,{key:'matrix',kind:'TEST'})).id,otherEnvironment=(await registry.createEnvironment(root,applicationId,{key:'foreign',kind:'TEST'})).id,target={applicationId,environmentId,tenantReference:'matrix-a'};
 const identity={issuer:'role-matrix',subject:randomUUID(),displayName:`Fixture ${role}`},principal=await registry.principal(identity),token=`role-fixture-${randomUUID()}`,grant=await registry.grant(root,{...target,targetPrincipalId:principal,role,reason:'Explicit scoped role acceptance'});
 let calls=0;const ai=new InvestigatorService(database,registry,new AesCredentialVault(new Uint8Array(32).fill(4)),{analyze:async()=>{calls++;throw Error('Role fixture must not dispatch provider');}},{allowedHosts:[],allowLoopback:true}),configuration={enabled:true,externalProcessingAllowed:false,endpoint:'http://127.0.0.1:9999/v1',model:'fixture',credential:'fixture-only-provider-value',monthlyTokenBudget:10000,maxOutputTokens:128,maxContextBytes:2048,reason:'Explicit role fixture configuration'};
 await ai.configure(root,applicationId,configuration);
 const event:TelemetryEvent={schemaVersion:'1.1',eventId:randomUUID(),...target,actorReference:'fixture-actor',source:'SERVER',category:'BACKEND',severity:'ERROR',eventCode:'role.matrix',normalizedMessage:'Role fixture observation',occurredAt:new Date().toISOString()};
 expect((await ingestion.ingest({events:[event,{...event,eventId:randomUUID(),tenantReference:'matrix-b'}]},{applicationId,environmentId,source:'SERVER',tenantAll:true,actorAll:true})).acknowledgements.every(row=>row.status==='ACCEPTED')).toBe(true);
 expect((await ingestion.ingest({events:[{...event,eventId:randomUUID(),environmentId:otherEnvironment}]},{applicationId,environmentId:otherEnvironment,source:'SERVER',tenantAll:true,actorAll:true})).acknowledgements[0].status).toBe('ACCEPTED');
 const engine=new IssueEngine(database,registry);for(;;){const jobs=await engine.queue.claim(randomUUID(),50,['AGGREGATE']);if(!jobs.length)break;for(const job of jobs)await engine.aggregate(job);}
 const issue=(await new OperationsService(database,registry).list(root,target,'issues')).items[0];
 const api=new HubHttpApi(database,registry,ingestion,{verify:async candidate=>{if(candidate!==token)throw Error('Invalid fixture identity');return identity;}},undefined,ai),server=createHubServer(api);await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw Error('Role HTTP fixture unavailable');const origin=`http://127.0.0.1:${address.port}/api/v1/observability`,base=`/operations/applications/${applicationId}`,query=`?environmentId=${environmentId}&tenantReference=matrix-a`,detail=`${base}/issues/${issue.id}${query}`;
 const call=async(path:string,method='GET',body?:unknown)=>{const response=await fetch(origin+path,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(5000)});return{status:response.status,body:await response.json()};};let broadGrant:string|undefined;
 try{
  expect((await call(detail)).status).toBe(200);
  for(const path of [detail.replace('matrix-a','matrix-b'),detail.replace(environmentId,otherEnvironment),detail.replace(applicationId,foreignApp)])expect((await call(path)).status).toBe(403);
  const human=role==='ADMIN'||role==='OPERATOR',analyze=role!=='VIEWER';
  expect((await call(`${base}/issues/${issue.id}`,'POST',{environmentId,tenantReference:'matrix-a',status:'INVESTIGATING',reason:'Explicit human role matrix action'})).status).toBe(human?200:403);
  const request=await call(base+'/ai/investigations','POST',{environmentId,tenantReference:'matrix-a',kind:'ISSUE',targetReference:issue.id,idempotencyKey:`matrix-${randomUUID()}`});expect(request.status).toBe(analyze?201:403);
  // A tenant-scoped ADMIN does not inherit whole-App configuration authority.
  expect((await call(base+'/ai/configuration')).status).toBe(403);
  broadGrant=(await registry.grant(root,{applicationId,targetPrincipalId:principal,role,reason:'Explicit whole App role comparison'})).id;
  const config=await call(base+'/ai/configuration');expect(config.status).toBe(role==='ADMIN'?200:403);expect(JSON.stringify(config.body)).not.toContain(configuration.credential);expect(JSON.stringify(config.body)).not.toContain('ciphertext');
  expect((await call(base+'/ai/configuration','PUT',{...configuration,reason:'Explicit current principal configuration'})).status).toBe(role==='ADMIN'?200:403);
  await registry.revokeGrant(root,applicationId,broadGrant,'Whole App role comparison cleanup');broadGrant=undefined;
  await registry.revokeGrant(root,applicationId,grant.id,'Scoped role acceptance cleanup');expect((await call(detail)).status).toBe(403);expect((await call(base+'/ai/investigations','POST',{environmentId,tenantReference:'matrix-a',kind:'ISSUE',targetReference:issue.id,idempotencyKey:`revoked-${randomUUID()}`})).status).toBe(403);
  const current=await database.worker(c=>c.query('SELECT status FROM observability.issues WHERE application_id=$1 AND id=$2',[applicationId,issue.id]));expect(current.rows[0].status).toBe(human?'INVESTIGATING':'OPEN');
  const activity=await database.worker(c=>c.query('SELECT actor_principal_id FROM observability.issue_activity WHERE application_id=$1 AND issue_id=$2',[applicationId,issue.id]));expect(activity.rows).toEqual(human?[{actor_principal_id:principal}]:[]);
  const audit=await database.control(c=>c.query("SELECT actor_principal_id FROM observability.audit WHERE application_id=$1 AND action='INVESTIGATOR_CONFIGURATION_CHANGED' AND reason='Explicit current principal configuration'",[applicationId]));expect(audit.rows).toEqual(role==='ADMIN'?[{actor_principal_id:principal}]:[]);
  expect(calls).toBe(0);expect((await database.worker(c=>c.query('SELECT 1 FROM observability.ai_attempts WHERE application_id=$1',[applicationId]))).rowCount).toBe(0);
 }finally{
  server.closeAllConnections();await new Promise<void>((done,fail)=>server.close(error=>error?fail(error):done()));
  if(broadGrant)await registry.revokeGrant(root,applicationId,broadGrant,'Role fixture cleanup');await registry.revokeGrant(root,applicationId,grant.id,'Role fixture cleanup');
  await ai.configure(root,applicationId,{...configuration,enabled:false,reason:'Disable disposable role fixture automation'});
  await database.worker(async c=>{await c.query("DELETE FROM observability.jobs WHERE application_id=$1 AND kind='INVESTIGATE' AND status='PENDING'",[applicationId]);await c.query("UPDATE observability.investigations SET status='SKIPPED',failure_code='FIXTURE_NOT_EXECUTED',completed_at=now() WHERE application_id=$1 AND status='QUEUED'",[applicationId]);});
 }
 console.log(JSON.stringify({event:'observability.operational_role_matrix',role,result:'PASS',scope:'EXACT_APP_ENV_TENANT_CURRENT_GRANT',human:role==='ADMIN'||role==='OPERATOR',aiRequest:role!=='VIEWER',wholeAppConfiguration:role==='ADMIN',providerCalls:0,limits:'Disposable verified generic HTTP identity and real PostgreSQL; no live role/provider change.'}));
}
