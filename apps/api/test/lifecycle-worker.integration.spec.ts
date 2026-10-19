import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { Client, Pool } from 'pg';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { databaseUrl } from '../src/config.js';
import { DatabaseService } from '../src/database/database.service.js';
import { SubscriptionLifecycleService } from '../src/commercial/subscription-lifecycle.service.js';
import { CommercialService } from '../src/commercial/commercial.service.js';
import { DirectoryConnectorService } from '../src/directory/directory-connector.service.js';
import { HubBindingService } from '../src/observability/hub-binding.service.js';
import { runLifecycleWorkerCycle } from '../src/lifecycle-worker.js';
import { QueueWorker } from '../src/jobs/queue.worker.js';
import { AiGatewayService } from '../src/ai/ai-gateway.service.js';
import { AiCredentialService } from '../src/ai/ai-credential.service.js';
import { TicketService } from '../src/tickets/ticket.service.js';
import { TicketIntakeService } from '../src/ticket-intake/ticket-intake.service.js';
import { TranscriptionService } from '../src/transcription/transcription.service.js';
import { AttachmentService } from '../src/attachments/attachment.service.js';
import type { AttachmentStorage, StoredObject } from '../src/attachments/attachment-storage.js';
import { NodeSdk } from '@observability/node-sdk';
import { HubDatabase, RegistryService, IngestionService, HubHttpApi, createHubServer, IssueEngine } from '@observability/server';

const name=`obs069_worker_${randomUUID().replaceAll('-','')}`,role=`jupiter_app_${name}`;
const admin=new Client({connectionString:databaseUrl()});
let created=false,database:DatabaseService,hub:HubDatabase,server:ReturnType<typeof createHubServer>,sdk:NodeSdk,registry:RegistryService,root:string,appId:string,environmentId:string,organizationId:string;
let services:Parameters<typeof runLifecycleWorkerCycle>[0];
beforeAll(async()=>{
 await admin.connect();await admin.query(`CREATE DATABASE "${name}"`);created=true;
 const url=new URL(databaseUrl());url.pathname=`/${name}`;const connectionString=url.toString(),pool=new Pool({connectionString,max:4});
 try{
  const directory=join(process.cwd(),'migrations');
  const files=(await readdir(directory)).filter(file=>file.endsWith('.sql')).sort();expect(files).toHaveLength(83);
  for(const file of files)await pool.query((await readFile(join(directory,file),'utf8')).replace(/\bjupiter_app\b/g,role));
  // Same tenant transaction/RLS implementation, with only the rehearsal role name
  // substituted for this disposable DB. Never change the shared business role.
  // Product connections use the same explicitly substituted rehearsal role.
  await pool.end();const productPool=new Pool({connectionString,max:4});productPool.on('connect',client=>{const query=client.query.bind(client);client.query=((...args:any[])=>{if(args[0]==='SET LOCAL ROLE jupiter_app')args[0]=`SET LOCAL ROLE ${role}`;return (query as any)(...args);}) as typeof client.query;});
  database=new DatabaseService();await database.onModuleDestroy();Object.assign(database,{pool:productPool});
 }catch(error){await pool.end().catch(()=>undefined);throw error;}
 organizationId=(await database.query<{id:string}>("INSERT INTO organizations(slug,name,status) VALUES('worker-acceptance','Worker acceptance','active') RETURNING id")).rows[0].id;
 hub=new HubDatabase({connectionString});registry=new RegistryService(hub);root=(await registry.bootstrap({issuer:'worker-fixture',subject:randomUUID(),displayName:'Fixture administrator'},'Disposable worker acceptance')).principalId;
 appId=(await registry.createApplication(root,{slug:'worker-application',name:'Worker fixture'})).id;environmentId=(await registry.createEnvironment(root,appId,{key:'test',kind:'TEST'})).id;
 const credential=await registry.issueServerCredential(root,appId,environmentId,'Disposable product worker');
 const api=new HubHttpApi(hub,registry,new IngestionService(hub),{verify:async()=>{throw Error('No operational HTTP identity in worker fixture');}});server=createHubServer(api);await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw Error('Missing fixture listener');
 sdk=new NodeSdk({applicationId:appId,environmentId,endpoint:`http://127.0.0.1:${address.port}/api/v1/observability`,credentialProvider:async()=>credential.token,reportMetrics:false,fallback:()=>undefined});
 const binding=new HubBindingService(undefined as never,database,undefined as never);Object.assign(binding,{configuration:{applicationId:appId,environmentId,enabled:true},sdk});
 services={database,lifecycle:new SubscriptionLifecycleService(database),commercial:new CommercialService(database),directory:new DirectoryConnectorService(database),observation:binding};
},60000);
afterAll(async()=>{
 await sdk?.shutdown();if(server){server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));}await hub?.close();await database?.onModuleDestroy();
 if(created){await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()',[name]);await admin.query(`DROP DATABASE "${name}"`);}
 if((await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[role])).rowCount)await admin.query(`DROP ROLE "${role}"`);
 expect((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[name])).rowCount).toBe(0);expect((await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[role])).rowCount).toBe(0);
 await admin.end();vi.restoreAllMocks();
},30000);
describe('actual lifecycle worker with real product services and PostgreSQL/HTTP Hub',()=>{
 it('observes real HTTP provider failures and retry exhaustion without charging failed actions or blocking manual submission',async()=>{
  const previousKey=process.env.AI_CREDENTIAL_ENCRYPTION_KEY;process.env.AI_CREDENTIAL_ENCRYPTION_KEY=randomBytes(32).toString('base64');
  let successful=false,providerCalls=0;const privateMarker=`private-provider-body-${randomUUID()}`,requests:Array<{path:string;contentType:string}>=[];
  const provider=createServer(async(request,response)=>{for await(const _chunk of request){/* Consume fixture input, never log or retain it. */}providerCalls++;requests.push({path:request.url??'',contentType:request.headers['content-type']??''});response.setHeader('content-type','application/json');if(!successful){response.statusCode=503;response.end(JSON.stringify({error:{message:privateMarker}}));return;}response.end(JSON.stringify({choices:[{message:{content:JSON.stringify({title:'Reviewed fixture',normalizedDescription:'Valid local response',priority:'NORMAL',confidence:.9})}}],usage:{prompt_tokens:2,completion_tokens:3}}));});
  await new Promise<void>(done=>provider.listen(0,'127.0.0.1',done));
  const address=provider.address();if(!address||typeof address==='string')throw Error('Missing provider fixture listener');
  const warnings:unknown[]=[];const warning=vi.spyOn(Logger.prototype,'warn').mockImplementation(value=>{warnings.push(value);});
  try{
   const before=new Set((await hub.worker(async c=>(await c.query('SELECT event_id FROM observability.events WHERE application_id=$1',[appId])).rows)).map(row=>row.event_id));
   const userId=(await database.query<{id:string}>("INSERT INTO users(email,display_name,password_hash) VALUES($1,'Worker requester','scrypt$AA$AA') RETURNING id",[`${randomUUID()}@worker.invalid`])).rows[0].id;
   await database.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2)',[organizationId,userId]);
   await database.query("INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m CROSS JOIN roles r WHERE m.organization_id=$1 AND m.user_id=$2 AND r.code='REQUESTER'",[organizationId,userId]);
   for(const cap of ['AI_TICKET_REVIEW','AI_SMART_INTAKE']){
    await database.query('INSERT INTO platform_capability_availability(capability_code,is_available) VALUES($1,true) ON CONFLICT(capability_code) DO UPDATE SET is_available=true',[cap]);
    await database.withOrganization(organizationId,async c=>{await c.query("INSERT INTO commercial_entitlements(organization_id,capability_code,status,starts_at) VALUES($1,$2,'ACTIVE',now())",[organizationId,cap]);await c.query('INSERT INTO organization_feature_settings(organization_id,capability_code,enabled) VALUES($1,$2,true)',[organizationId,cap]);});
   }
   const credentials=new AiCredentialService(),encrypted=credentials.encrypt(randomUUID());
   await database.query("INSERT INTO organization_ai_settings(organization_id,enabled,smart_intake_enabled,model,analysis_model,transcription_model,provider_base_url,api_key_ciphertext,api_key_iv,api_key_auth_tag) VALUES($1,true,true,'fixture','fixture','fixture',$2,$3,$4,$5)",[organizationId,`http://127.0.0.1:${address.port}/v1`,encrypted.ciphertext,encrypted.iv,encrypted.authTag]);
   const objects=new Map<string,StoredObject>();const storage:AttachmentStorage={createUploadUrl:async(key,contentType,_expiry,metadata)=>{objects.set(key,{contentType,contentLength:4,metadata});return 'http://127.0.0.1/fixture-upload';},head:async key=>objects.get(key),read:async()=>new Uint8Array([1,2,3,4]),delete:async key=>{objects.delete(key);},createDownloadUrl:async()=>{throw Error('Unexpected fixture download');},createViewUrl:async()=>{throw Error('Unexpected fixture preview');}};
   const actor={organizationId,userId,roles:['REQUESTER']},tickets=new TicketService(database),commercial=new CommercialService(database),gateway=new AiGatewayService(database,credentials,commercial),attachments=new AttachmentService(database,storage),intakes=new TicketIntakeService(database,tickets,attachments,credentials,commercial,storage),transcription=new TranscriptionService(database);
   const binding=new HubBindingService(undefined as never,database,undefined as never);Object.assign(binding,{configuration:{applicationId:appId,environmentId,enabled:true},sdk});
   const worker=new QueueWorker(database,gateway,transcription,intakes,binding),drain=()=> (worker as unknown as {drain():Promise<void>}).drain();
   const draft=await tickets.createDraft(actor,{title:'Manual fallback',description:'Synthetic acceptance input'});
   const failedReview=await gateway.enqueue(actor,draft.id,'Synthetic review failure');await drain();
   expect((await gateway.review(actor,failedReview.id)).status).toBe('FAILED');
   const failedIntake=await intakes.create(actor,{description:'Synthetic text intake failure'});await intakes.analyze(actor,failedIntake.id);
   const voiceIntake=await intakes.create(actor,{});await intakes.requestVoiceUpload(actor,voiceIntake.id,{filename:'fixture.wav',contentType:'audio/wav',byteSize:4,durationSeconds:1});await intakes.completeVoiceUpload(actor,voiceIntake.id);await intakes.analyze(actor,voiceIntake.id);
   const attachment=await attachments.requestUpload(actor,draft.id,{filename:'fixture.wav',contentType:'audio/wav',byteSize:4});const legacyVoice=await transcription.enqueue(actor,draft.id,attachment.attachment.id);
   for(let attempt=1;attempt<=3;attempt++){
    // Advance only disposable fixture due dates; preserve real retry/claim logic.
    await database.query('UPDATE ticket_intake_sessions SET next_attempt_at=now() WHERE id=ANY($1::uuid[])',[[failedIntake.id,voiceIntake.id]]);await drain();
    const rows=(await database.query<{status:string;attempt_count:number}>('SELECT status,attempt_count FROM ticket_intake_sessions WHERE id=ANY($1::uuid[])',[[failedIntake.id,voiceIntake.id]])).rows;
    expect(rows).toHaveLength(2);expect(rows.every(row=>row.attempt_count===attempt&&row.status===(attempt===3?'FAILED':row.status))).toBe(true);
    expect(rows.every(row=>attempt===3||['ANALYZING','TRANSCRIBING'].includes(row.status))).toBe(true);
    expect((await transcription.get(actor,draft.id,legacyVoice.id)).status).toBe(attempt===3?'DEAD_LETTER':'RETRY');
    const actions=(await database.query<{status:string}>('SELECT status FROM commercial_smart_actions WHERE organization_id=$1',[organizationId])).rows;
    expect(actions).toHaveLength(3);expect(actions.filter(row=>row.status==='RELEASED')).toHaveLength(attempt===3?3:1);
    expect((await database.query("SELECT 1 FROM commercial_usage_ledger WHERE organization_id=$1 AND event_type='SMART_ACTION_SETTLED'",[organizationId])).rowCount).toBe(0);
   }
   expect(providerCalls).toBe(7); // One review + three text + three multipart voice failures.
   expect(requests.filter(row=>row.path==='/v1/audio/transcriptions'&&row.contentType.startsWith('multipart/form-data;'))).toHaveLength(3);
   await tickets.submit(actor,draft.id);expect((await database.query('SELECT status FROM tickets WHERE id=$1',[draft.id])).rows[0].status).toBe('OPEN');
   successful=true;const good=await gateway.enqueue(actor,draft.id,'Synthetic review recovery');await drain();await drain();expect((await gateway.review(actor,good.id)).status).toBe('SUCCEEDED');
   expect(providerCalls).toBe(8);expect((await gateway.enqueue(actor,draft.id,'Synthetic review recovery',good.id)).id).toBe(good.id);await drain();expect(providerCalls).toBe(8);
   expect((await database.query("SELECT unit_count FROM commercial_usage_ledger WHERE organization_id=$1 AND event_type='SMART_ACTION_SETTLED'",[organizationId])).rows).toEqual([{unit_count:-1}]);
   expect((await database.query("SELECT count(*)::int total FROM commercial_smart_actions WHERE organization_id=$1 AND status='SETTLED'",[organizationId])).rows[0].total).toBe(1);
   await sdk.flush();const events=(await hub.worker(async c=>(await c.query('SELECT event_id,operation_name,source,category,severity,safe_metadata,actor_reference,tenant_reference,normalized_message FROM observability.events WHERE application_id=$1',[appId])).rows)).filter(row=>!before.has(row.event_id));
   for(const [operation,outcome] of [['queue.ai.process','FAILED'],['queue.intake.process','FAILED'],['queue.intake.process','RETRY'],['queue.transcription.process','RETRY'],['queue.transcription.process','DEAD_LETTER']])expect(events.some(row=>row.operation_name===operation&&row.safe_metadata.failureCode===outcome)).toBe(true);
   expect(events.every(row=>row.actor_reference===null&&row.tenant_reference===organizationId)).toBe(true);expect(JSON.stringify({events,warnings})).not.toContain(privateMarker);
   expect(events.every(row=>row.source==='WORKER'&&row.category==='WORKER'&&row.severity===(row.safe_metadata.failureCode==='RETRY'?'WARNING':'ERROR')&&row.safe_metadata.retryExhausted===(row.safe_metadata.failureCode!=='RETRY'))).toBe(true);
   const engine=new IssueEngine(hub,registry);for(const job of await engine.queue.claim(randomUUID(),50,['AGGREGATE']))await engine.aggregate(job);
   expect((await hub.worker(async c=>(await c.query("SELECT count(*)::int total FROM observability.issues WHERE application_id=$1 AND tenant_reference=$2",[appId,organizationId])).rows[0].total))).toBeGreaterThan(0);
  }finally{warning.mockRestore();provider.closeAllConnections();await new Promise<void>(done=>provider.close(()=>done()));if(previousKey===undefined)delete process.env.AI_CREDENTIAL_ENCRYPTION_KEY;else process.env.AI_CREDENTIAL_ENCRYPTION_KEY=previousKey;}
 },30000);
 it('captures the actual queued-worker SQL boundary and outcome events over HTTP without provider calls',async()=>{
  const binding=new HubBindingService(undefined as never,database,undefined as never);Object.assign(binding,{configuration:{applicationId:appId,environmentId,enabled:true},sdk});const worker=new QueueWorker(database,undefined as never,undefined as never,undefined as never,binding);
  const warning=vi.spyOn(Logger.prototype,'warn').mockImplementation(()=>undefined);
  await database.query('ALTER TABLE ai_requests RENAME TO worker_fixture_ai_requests');
  try{await (worker as unknown as {drain():Promise<void>}).drain();}finally{await database.query('ALTER TABLE worker_fixture_ai_requests RENAME TO ai_requests');}
  await sdk.flush();
  const events=await hub.worker(async c=>(await c.query("SELECT operation_name,source,actor_reference,tenant_reference FROM observability.events WHERE application_id=$1 AND operation_name='queue.ai.enumerate'",[appId])).rows);
  expect(events).toEqual([{operation_name:'queue.ai.enumerate',source:'WORKER',actor_reference:null,tenant_reference:null}]);
  const before=new Set((await hub.worker(async c=>(await c.query("SELECT event_id FROM observability.events WHERE application_id=$1 AND operation_name='queue.ai.process'",[appId])).rows)).map(row=>row.event_id));
  for(const outcome of ['RETRY','FAILED','DEAD_LETTER'] as const)binding.reportBackgroundOutcome('queue.ai.process',organizationId,outcome);
  await sdk.flush();const outcomes=(await hub.worker(async c=>(await c.query("SELECT event_id,safe_metadata,actor_reference,tenant_reference FROM observability.events WHERE application_id=$1 AND operation_name='queue.ai.process' ORDER BY received_at",[appId])).rows)).filter(row=>!before.has(row.event_id));
  expect(outcomes).toHaveLength(3);expect(outcomes.map(row=>row.safe_metadata.failureCode)).toEqual(['RETRY','FAILED','DEAD_LETTER']);expect(outcomes.every(row=>row.actor_reference===null&&row.tenant_reference===organizationId)).toBe(true);
  // This verifies the actual drain's thrown SQL path plus outcome transport;
  // outcomes here are explicit port calls, not proof of real provider failures.
  warning.mockRestore();
 });
 it('runs the cycle, persists a real SQL failure with safe automation scope, and recovers',async()=>{
  const warnings:unknown[]=[];vi.spyOn(Logger.prototype,'warn').mockImplementation(value=>{warnings.push(value);});
  expect(await runLifecycleWorkerCycle(services)).toBe(true);expect(sdk.stats().queued).toBe(0);
  // Real database failure in the actual directory service, not a fabricated Event.
  await database.query('ALTER TABLE directory_connectors RENAME TO worker_fixture_connectors');
  try{expect(await runLifecycleWorkerCycle(services)).toBe(false);}finally{await database.query('ALTER TABLE worker_fixture_connectors RENAME TO directory_connectors');}
  expect(sdk.stats().queued).toBe(1);await sdk.flush();expect(sdk.stats().queued).toBe(0);
  const events=await hub.worker(async c=>(await c.query("SELECT event_id,source,category,event_code,operation_name,actor_reference,tenant_reference,normalized_message FROM observability.events WHERE application_id=$1 AND environment_id=$2",[appId,environmentId])).rows);
  const lifecycleEvents=events.filter(event=>event.operation_name==='directory.schedule_due');expect(lifecycleEvents).toHaveLength(1);expect(lifecycleEvents[0]).toMatchObject({source:'WORKER',category:'WORKER',event_code:'worker.job_failed',operation_name:'directory.schedule_due',actor_reference:null,tenant_reference:null});
  expect(JSON.stringify(warnings)).not.toContain('directory_connectors');expect(JSON.stringify(warnings)).toContain('PRODUCT_WORKER_FAILED');
  const engine=new IssueEngine(hub,registry);for(const job of await engine.queue.claim(randomUUID(),10,['AGGREGATE']))expect(await engine.aggregate(job)).toBe(true);
  expect(await hub.worker(async c=>(await c.query("SELECT count(*)::int total FROM observability.issues i JOIN observability.issue_events link ON link.issue_id=i.id AND link.application_id=i.application_id JOIN observability.events e ON e.event_id=link.event_id AND e.application_id=link.application_id AND e.environment_id=link.environment_id WHERE i.application_id=$1 AND e.operation_name='directory.schedule_due'",[appId])).rows[0].total)).toBe(1);
  expect(await runLifecycleWorkerCycle(services)).toBe(true);expect(sdk.stats().queued).toBe(0);
  expect((await database.query<{id:string}>('SELECT id FROM organizations WHERE id=$1',[organizationId])).rows).toHaveLength(1);
 });
});
