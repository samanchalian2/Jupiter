import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {Client,Pool} from 'pg';
import {randomBytes,randomUUID} from 'node:crypto';
import {createServer} from 'node:net';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {databaseUrl} from '../src/config.js';
import {hashPassword} from '../src/auth/password.js';
import {HubDatabase,RegistryService} from '@observability/server';
import {acceptActualHostBrowser} from './support/actual-host-browser.js';

const name=`obs069_host_${randomUUID().replaceAll('-','')}`;
const admin=new Client({connectionString:databaseUrl()});
let connected=false,created=false,pool:Pool|undefined,hub:HubDatabase|undefined,child:ChildProcess|undefined,base='',webOrigin='',org='',otherOrg='',requester='',platformAdmin='',appId='',environmentId='',priorRole='';
const password=randomBytes(24).toString('base64url');
const requests:Array<{path:string;statusCode:number}>=[];
const roleSnapshot=async()=>JSON.stringify((await admin.query("SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls FROM pg_roles WHERE rolname='jupiter_app'")).rows);
async function freePort(){const server=createServer();await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw Error('No fixture port');const port=address.port;await new Promise<void>(done=>server.close(()=>done()));return port;}
async function call(path:string,token?:string,body?:unknown,tenant?:string,requestId?:string){return fetch(`${base}${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`} :{}),...(tenant?{'x-organization-id':tenant}:{}),...(requestId?{'x-request-id':requestId}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(5000)});}
async function login(email:string){const response=await call('/auth/login',undefined,{identifier:email,password});expect(response.status).toBe(201);const session=await response.json();return{token:session.accessToken as string,cookie:response.headers.get('set-cookie')!.split(';')[0]};}

beforeAll(async()=>{
 const configured=new URL(databaseUrl());if(!['localhost','127.0.0.1','[::1]'].includes(configured.hostname))throw Error('LOCAL disposable host acceptance only');
 await admin.connect();connected=true;priorRole=await roleSnapshot();expect(JSON.parse(priorRole)).toHaveLength(1);
 await admin.query(`CREATE DATABASE "${name}"`);created=true;configured.pathname=`/${name}`;pool=new Pool({connectionString:configured.toString(),max:4});
 const files=(await readdir(join(process.cwd(),'migrations'))).filter(file=>file.endsWith('.sql')).sort();expect(files).toHaveLength(83);
 for(const file of files){let sql=await readFile(join(process.cwd(),'migrations',file),'utf8');
  // The actual process uses the existing production role name. Grant statements
  // affect ONLY newly created objects in this disposable DB; no cluster role,
  // membership or existing database ACL is changed. The role already exists.
  if(file==='001_identity.sql'){expect(sql).toContain('CREATE ROLE jupiter_app NOLOGIN;');sql=sql.replace('CREATE ROLE jupiter_app NOLOGIN;','');}
  await pool.query(sql);
 }
 org=(await pool.query("INSERT INTO organizations(slug,name,status) VALUES('host-acceptance','Host acceptance','active') RETURNING id")).rows[0].id;
 otherOrg=(await pool.query("INSERT INTO organizations(slug,name,status) VALUES('host-other','Other fixture scope','active') RETURNING id")).rows[0].id;
 const hashed=await hashPassword(password);
 requester=(await pool.query("INSERT INTO users(email,display_name,password_hash) VALUES('requester@host.invalid','Host requester',$1) RETURNING id",[hashed])).rows[0].id;
 platformAdmin=(await pool.query("INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES('admin@host.invalid','Host operator',$1,true) RETURNING id",[hashed])).rows[0].id;
 await pool.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2)',[org,requester]);
 await pool.query("INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m CROSS JOIN roles r WHERE m.organization_id=$1 AND m.user_id=$2 AND r.code='REQUESTER'",[org,requester]);
 hub=new HubDatabase({connectionString:configured.toString()});const registry=new RegistryService(hub),root=(await registry.bootstrap({issuer:'host-fixture',subject:randomUUID(),displayName:'Disposable host bootstrap'},'Disposable host acceptance')).principalId;
 webOrigin=`http://127.0.0.1:${await freePort()}`;
 appId=(await registry.createApplication(root,{slug:'host-fixture',name:'Disposable Jupiter host',allowedOrigins:[webOrigin]})).id;environmentId=(await registry.createEnvironment(root,appId,{key:'test',kind:'TEST'})).id;
 const port=await freePort();base=`http://127.0.0.1:${port}/api/v1`;
 child=spawn(process.execPath,['dist/main.js'],{cwd:process.cwd(),windowsHide:true,env:{...process.env,NODE_ENV:'test',DATABASE_URL:configured.toString(),JWT_SECRET:randomBytes(48).toString('base64url'),AI_CREDENTIAL_ENCRYPTION_KEY:'',API_HOST:'127.0.0.1',API_PORT:String(port),WEB_ORIGIN:`http://127.0.0.1:${port},${webOrigin}`,JUPITER_WORKER_ENABLED:'false',OBSERVABILITY_ENABLED:'true',OBSERVABILITY_WORKER_ENABLED:'true',OBSERVABILITY_RULE_EVALUATION_INTERVAL_MS:'10000',OBSERVABILITY_APPLICATION_ID:appId,OBSERVABILITY_ENVIRONMENT_ID:environmentId,PUBLIC_ACCOUNT_VERIFICATION_DELIVERY:'disabled',AWS_EC2_METADATA_DISABLED:'true',S3_BUCKET:'',S3_ENDPOINT:'',S3_ACCESS_KEY_ID:'',S3_SECRET_ACCESS_KEY:''},stdio:['ignore','pipe','pipe']});
 // Discard raw child logs. Retain only allowlisted structured request outcomes.
 let pending='';child.stdout!.on('data',chunk=>{pending+=String(chunk);for(let index;(index=pending.indexOf('\n'))>=0;){const line=pending.slice(0,index);pending=pending.slice(index+1);try{const entry=JSON.parse(line);if(entry.event==='http.request'&&typeof entry.path==='string'&&Number.isInteger(entry.statusCode))requests.push({path:entry.path,statusCode:entry.statusCode});}catch{/* Nest startup text is not retained. */}}if(pending.length>16384)pending='';});child.stderr!.on('data',()=>undefined);
 await vi.waitFor(async()=>{if(child!.exitCode!==null)throw Error('Fixture AppModule process exited');expect((await call('/health/ready')).status).toBe(200);},{timeout:20000,interval:100});
 expect(await (await call('/observability/jupiter/config')).json()).toMatchObject({enabled:true,applicationId:appId,environmentId});
},60000);

afterAll(async()=>{
 if(child&&child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill();await exited;}
 await hub?.close();await pool?.end();
 if(!connected)return;
 if(created){await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()',[name]);await admin.query(`DROP DATABASE "${name}"`);}
 if(priorRole)expect(await roleSnapshot()).toBe(priorRole);
 expect((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[name])).rowCount).toBe(0);await admin.end();
},30000);

describe('actual compiled Jupiter main/AppModule process',()=>{
 it('evaluates two successive rule cohorts at the configured cadence in the actual worker process',async()=>{
  const operator=await login('admin@host.invalid');
  try{
   const configured=await fetch(`${base}/observability/operations/applications/${appId}/rules`,{method:'PUT',headers:{authorization:`Bearer ${operator.token}`,'content-type':'application/json'},body:JSON.stringify({code:'CRITICAL_EVENT',enabled:true,threshold:1,minimum_samples:1,window_seconds:60,cooldown_seconds:60,reason:'Disposable actual worker cadence acceptance'})});expect(configured.status).toBe(200);
   const credential=await call(`/observability/operations/applications/${appId}/credentials`,operator.token,{environmentId,reason:'Disposable cadence test ingestion'});expect(credential.status).toBe(201);expect(credential.headers.get('cache-control')).toBe('no-store');const server=(await credential.json()).token as string;
   const times:number[]=[];
   for(const cohort of ['first','second']){
    const id=randomUUID(),response=await call('/observability/events/batch',server,{events:[{schemaVersion:'1.1',eventId:id,applicationId:appId,environmentId,occurredAt:new Date().toISOString(),category:'WORKER',source:'WORKER',severity:'CRITICAL',eventCode:`fixture.cadence.${cohort}`,normalizedMessage:`Synthetic ${cohort} cadence failure`,tenantReference:org}]});expect(response.status).toBe(200);expect((await response.json()).acknowledgements).toEqual([{eventId:id,status:'ACCEPTED'}]);
    await vi.waitFor(async()=>{
     const incident=(await pool!.query("SELECT i.created_at FROM observability.incidents i JOIN observability.issue_events e ON e.application_id=i.application_id AND e.environment_id=i.environment_id AND e.issue_id=i.issue_id AND e.tenant_scope_key=i.tenant_scope_key WHERE e.application_id=$1 AND e.environment_id=$2 AND e.event_id=$3 AND i.rule_code='CRITICAL_EVENT'",[appId,environmentId,id])).rows;
     expect(incident).toHaveLength(1);times[cohort==='first'?0:1]=new Date(incident[0].created_at).getTime();
    },{timeout:16000,interval:100});
   }
   expect(times[1]-times[0]).toBeGreaterThanOrEqual(8000);
   console.log(JSON.stringify({event:'observability.actual_host_rule_cadence',result:'PASS',configuredIntervalMs:10000,successiveIncidentDeltaMs:times[1]-times[0],cohorts:2,source:'ACTUAL_COMPILED_APPMODULE_WORKER_HTTP_SQL',limits:'Disposable database; target cadence on existing two-second drain, not a production real-time guarantee or changed AI cadence.'}));
  }finally{await fetch(`${base}/auth/logout`,{method:'POST',headers:{cookie:operator.cookie}});}
 },40000);
 it('preserves normal login/tenant authorization, captures real draft failure and recovers while Hub persistence is unavailable',async()=>{
  const ticketsBefore=(await pool!.query('SELECT count(*)::int total FROM tickets WHERE organization_id=$1',[org])).rows[0].total;
  expect((await call('/auth/login',undefined,{identifier:'requester@host.invalid',password:randomUUID()})).status).toBe(401);
  const user=await login('requester@host.invalid'),operator=await login('admin@host.invalid');
  try{
  expect((await call('/observability/operations/applications')).status).toBe(401);
  const emptyRegistry=await call('/observability/operations/applications',user.token);expect(emptyRegistry.status).toBe(200);expect(await emptyRegistry.json()).toEqual([]);
  expect((await call(`/observability/operations/applications/${appId}/overview?environmentId=${environmentId}`,user.token)).status).toBe(403);
  const registryResponse=await call('/observability/operations/applications',operator.token);expect(registryResponse.status).toBe(200);expect((await registryResponse.json()).map((row:{id:string})=>row.id)).toContain(appId);
  expect((await call('/tickets/queue',operator.token,undefined,org)).status).toBe(401); // Platform authority never invents tenant membership.
  expect((await call('/tickets/queue',user.token,undefined,otherOrg)).status).toBe(401);
  expect((await call('/observability/jupiter/browser-credential',user.token,{},otherOrg)).status).toBe(403);
  const credential=await call('/observability/jupiter/browser-credential',user.token,{},org);expect(credential.status).toBe(201);expect(credential.headers.get('cache-control')).toBe('no-store');expect((await credential.json()).scope).toMatchObject({actorReference:requester,tenantReference:org});
  const marker=`fixture-sensitive-${randomUUID()}`,failedRequest=randomUUID();
  await pool!.query(`CREATE FUNCTION fixture_draft_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'password=${marker}'; END$$; CREATE TRIGGER fixture_draft_failure BEFORE INSERT ON tickets FOR EACH ROW EXECUTE FUNCTION fixture_draft_failure()`);
  try{expect((await call('/tickets/drafts',user.token,{title:'Synthetic failed draft',description:'Synthetic input'},org,failedRequest)).status).toBe(500);}finally{await pool!.query('DROP TRIGGER fixture_draft_failure ON tickets; DROP FUNCTION fixture_draft_failure()');}
  expect((await pool!.query('SELECT count(*)::int total FROM tickets WHERE organization_id=$1',[org])).rows[0].total).toBe(ticketsBefore);
  await vi.waitFor(async()=>{
   const result=(await pool!.query("SELECT event_code FROM observability.events WHERE application_id=$1 AND request_id=$2",[appId,failedRequest])).rows.map(row=>row.event_code);
   expect(result.filter(code=>code==='server.exception')).toHaveLength(1);expect(result.filter(code=>code==='http.operation')).toHaveLength(1);
  },{timeout:16000,interval:100});
  const events=(await pool!.query('SELECT normalized_message,sanitized_stack,actor_reference,tenant_reference,trace_id FROM observability.events WHERE application_id=$1 AND request_id=$2',[appId,failedRequest])).rows;
  expect(events.length).toBeGreaterThanOrEqual(2);expect(events.every(row=>row.actor_reference===requester&&row.tenant_reference===org&&/^[a-f0-9]{32}$/.test(row.trace_id))).toBe(true);expect(JSON.stringify(events)).not.toContain(marker);
  await vi.waitFor(async()=>expect((await pool!.query('SELECT 1 FROM observability.issues WHERE application_id=$1 AND tenant_reference=$2',[appId,org])).rowCount).toBeGreaterThan(0),{timeout:5000,interval:100});
  // Actual Hub table outage is confined to this disposable database. Product
  // tables remain available; do not substitute a mocked SDK or controller.
  const attemptsBefore=requests.filter(row=>row.path.includes('/observability/events/batch')).length,recoveryRequest=randomUUID();
  await pool!.query('ALTER TABLE observability.events RENAME TO fixture_unavailable_events');
  try{
   const draftResponse=await call('/tickets/drafts',user.token,{title:'Explicit recovery draft',description:'Synthetic recovered manual request'},org,recoveryRequest);expect(draftResponse.status).toBe(201);const draft=await draftResponse.json();
   expect((await call(`/tickets/${draft.id}/submit`,user.token,{},org)).status).toBe(201);
   expect((await pool!.query('SELECT status FROM tickets WHERE id=$1 AND organization_id=$2',[draft.id,org])).rows).toEqual([{status:'OPEN'}]);
   // Wait for a REAL SDK timer ingestion attempt during the storage outage.
   // A batch may return 200 with RETRYABLE item ACKs: do not confuse HTTP
   // success with committed telemetry. Verify the new real attempt and no row.
   await vi.waitFor(()=>expect(requests.filter(row=>row.path.includes('/observability/events/batch')).length).toBeGreaterThan(attemptsBefore),{timeout:16000,interval:100});
   expect((await pool!.query('SELECT 1 FROM observability.fixture_unavailable_events WHERE application_id=$1 AND request_id=$2',[appId,recoveryRequest])).rowCount).toBe(0);
  }finally{await pool!.query('ALTER TABLE observability.fixture_unavailable_events RENAME TO events');}
  await vi.waitFor(async()=>expect((await pool!.query("SELECT count(*)::int total FROM observability.events WHERE application_id=$1 AND request_id=$2 AND event_code='http.operation'",[appId,recoveryRequest])).rows[0].total).toBe(1),{timeout:16000,interval:100});
  expect((await pool!.query('SELECT count(*)::int total FROM tickets WHERE organization_id=$1',[org])).rows[0].total).toBe(ticketsBefore+1);
  expect((await pool!.query('SELECT count(*)::int total FROM commercial_usage_ledger WHERE organization_id=$1',[org])).rows[0].total).toBe(0);
  const logout=await fetch(`${base}/auth/logout`,{method:'POST',headers:{cookie:user.cookie}});expect(logout.status).toBe(201);
  expect((await fetch(`${base}/auth/refresh`,{method:'POST',headers:{cookie:user.cookie}})).status).toBe(401);
  await fetch(`${base}/auth/logout`,{method:'POST',headers:{cookie:operator.cookie}});
  expect((await pool!.query('SELECT 1 FROM refresh_sessions WHERE user_id=ANY($1::uuid[]) AND revoked_at IS NULL',[[requester,platformAdmin]])).rowCount).toBe(0);
  console.log(JSON.stringify({event:'observability.actual_appmodule_host',result:'PASS',process:'dist/main.js',migrations:83,auth:'REAL_PASSWORD_JWT_MEMBERSHIP',failedDraft:'500_ZERO_TICKETS_EVENT_ISSUE',hubOutage:'REAL_TABLE_UNAVAILABLE_TIMER_ATTEMPT',manualSubmit:'ONE_OPEN_TICKET',commercialEntries:0,sessions:'REVOKED',limits:'Disposable database; real compiled AppModule/API/SDK/worker HTTP process. No browser shell, provider call or process-crash recovery claim.'}));
  }finally{await Promise.all([user.cookie,operator.cookie].map(cookie=>fetch(`${base}/auth/logout`,{method:'POST',headers:{cookie}})));}
 },60000);
 it.runIf(process.env.OBSERVABILITY_BROWSER_ACCEPTANCE==='true')('runs authenticated actual Web/manual ticket/automatic trace acceptance without touching shared tenants',async()=>{
  await acceptActualHostBrowser({pool:pool!,base,webOrigin,organizationId:org,requesterId:requester,applicationId:appId,password});
  expect((await pool!.query('SELECT 1 FROM refresh_sessions WHERE user_id=ANY($1::uuid[]) AND revoked_at IS NULL',[[requester,platformAdmin]])).rowCount).toBe(0);
 },90000);
});
