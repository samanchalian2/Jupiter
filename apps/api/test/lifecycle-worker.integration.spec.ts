import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { Client, Pool } from 'pg';
import { randomUUID } from 'node:crypto';
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
 it('captures the actual queued-worker SQL boundary and outcome events over HTTP without provider calls',async()=>{
  const binding=new HubBindingService(undefined as never,database,undefined as never);Object.assign(binding,{configuration:{applicationId:appId,environmentId,enabled:true},sdk});const worker=new QueueWorker(database,undefined as never,undefined as never,undefined as never,binding);
  const warning=vi.spyOn(Logger.prototype,'warn').mockImplementation(()=>undefined);
  await database.query('ALTER TABLE ai_requests RENAME TO worker_fixture_ai_requests');
  try{await (worker as unknown as {drain():Promise<void>}).drain();}finally{await database.query('ALTER TABLE worker_fixture_ai_requests RENAME TO ai_requests');}
  await sdk.flush();
  const events=await hub.worker(async c=>(await c.query("SELECT operation_name,source,actor_reference,tenant_reference FROM observability.events WHERE application_id=$1 AND operation_name='queue.ai.enumerate'",[appId])).rows);
  expect(events).toEqual([{operation_name:'queue.ai.enumerate',source:'WORKER',actor_reference:null,tenant_reference:null}]);
  for(const outcome of ['RETRY','FAILED','DEAD_LETTER'] as const)binding.reportBackgroundOutcome('queue.ai.process',organizationId,outcome);
  await sdk.flush();const outcomes=await hub.worker(async c=>(await c.query("SELECT safe_metadata,actor_reference,tenant_reference FROM observability.events WHERE application_id=$1 AND operation_name='queue.ai.process' ORDER BY received_at",[appId])).rows);
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
