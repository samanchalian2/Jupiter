import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { JwtService } from '@nestjs/jwt';
import { access } from 'node:fs/promises';
import { hashPassword } from '../src/auth/password.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { CommercialService } from '../src/commercial/commercial.service.js';
import { AssistRoutingService } from '../src/assist/assist-routing.service.js';
import { AssistCapacityService } from '../src/assist/assist-capacity.service.js';
import { AssistService } from '../src/assist/assist.service.js';
import { TicketService } from '../src/tickets/ticket.service.js';
import { TicketIntakeService } from '../src/ticket-intake/ticket-intake.service.js';
import { AiCredentialService } from '../src/ai/ai-credential.service.js';
import { AttachmentService } from '../src/attachments/attachment.service.js';
import type { AttachmentStorage } from '../src/attachments/attachment-storage.js';

const target=new URL(process.env.DATABASE_URL!);
const disposable=/^\/goal070_tests_[a-f0-9]{32}$/.test(target.pathname)||(process.env.CI==='true'&&target.pathname==='/jupiter_ci');
if(!disposable||!['127.0.0.1','localhost','[::1]'].includes(target.hostname))throw Error('Use disposable isolated API runner or explicit ephemeral CI database');
const db=new DatabaseService(),commercial=new CommercialService(db),routing=new AssistRoutingService(db,commercial),capacity=new AssistCapacityService(db);
const assist=new AssistService(db,commercial,capacity,routing),tickets=new TicketService(db,routing);
const storage={} as AttachmentStorage;
const intake=new TicketIntakeService(db,tickets,new AttachmentService(db,storage),new AiCredentialService(),commercial,storage);
let org='',other='',admin='',user='',agent='',pack='';
let child:ChildProcess|undefined,base='';
let browserFixture:object={};
const jwtSecret=randomUUID(),jwt=new JwtService({secret:jwtSecret});
async function http(path:string,userId:string,organizationId:string,body?:unknown,key?:string) {
  return fetch(base+path,{method:body===undefined?'GET':'POST',headers:{authorization:`Bearer ${await jwt.signAsync({sub:userId,credentialVersion:0})}`,'x-organization-id':organizationId,'content-type':'application/json',...(key?{'idempotency-key':key}:{})},body:body===undefined?undefined:JSON.stringify(body)});
}
const actor=()=>({userId:user,organizationId:org,roles:['REQUESTER']});
const owner=()=>({userId:admin,organizationId:org,roles:['ORG_OWNER']});
const payload=()=>({title:'پشتیبانی آزمایشی',description:'مشکل آزمایشی مستقل',supportTeam:'JUPITER' as const});
beforeAll(async()=>{
  const id=randomUUID();
  org=(await db.query<{id:string}>("INSERT INTO organizations(slug,name,status) VALUES($1,'Assist routing','active') RETURNING id",['assist-'+id])).rows[0].id;
  other=(await db.query<{id:string}>("INSERT INTO organizations(slug,name,status) VALUES($1,'Other','active') RETURNING id",['other-'+id])).rows[0].id;
  const users=(await db.query<{id:string}>("INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES($1,'Admin','scrypt$AA$AA',true),($2,'Requester','scrypt$AA$AA',false),($3,'Support','scrypt$AA$AA',true) RETURNING id",['admin-'+id+'@test.local','user-'+id+'@test.local','agent-'+id+'@test.local'])).rows;
  [admin,user,agent]=users.map(x=>x.id);
  if(process.env.ASSIST_BROWSER_ACCEPTANCE==='true'){
    // Synthetic credential exists only in the runner-owned disposable database.
    await db.query('UPDATE users SET password_hash=$1 WHERE id=ANY($2::uuid[])',[await hashPassword('Synthetic-assist-acceptance-071'),[admin,user,agent]]);
    browserFixture={api:base,slug:'assist-'+id,owner:'admin-'+id+'@test.local',requester:'user-'+id+'@test.local',agent:'agent-'+id+'@test.local'};
  }
  await db.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2),($1,$3)',[org,admin,user]);
  await db.query('INSERT INTO assignment_rules(organization_id,assignee_user_id) VALUES($1,$2)',[org,admin]);
  await db.query("INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code=CASE WHEN m.user_id=$2 THEN 'ORG_OWNER' ELSE 'REQUESTER' END WHERE m.organization_id=$1",[org,admin]);
  await assist.saveAgent(admin,{userId:agent,status:'ACTIVE'});
  const product=await commercial.saveProduct(admin,{code:'ASSIST_TEST_'+id.replaceAll('-','').slice(0,10).toUpperCase(),name:'Test Assist',status:'ACTIVE'});
  await commercial.saveAvailability(admin,{capabilityCode:'JUPITER_ASSIST',isAvailable:true});
  await commercial.saveFeatureSetting(admin,{organizationId:org,capabilityCode:'JUPITER_ASSIST',enabled:true});
  await commercial.saveEntitlement(admin,{organizationId:org,capabilityCode:'JUPITER_ASSIST',productId:product.id,status:'ACTIVE',startsAt:'2020-01-01'});
  await db.query("INSERT INTO commercial_subscriptions(organization_id,product_id,status,starts_at,ends_at) VALUES($1,$2,'ACTIVE',now()-interval '1 day',now()+interval '10 days')",[org,product.id]);
  pack=(await capacity.savePackage(admin,{productId:product.id,code:'PACK_'+id.replaceAll('-','').slice(0,10).toUpperCase(),name:'Routing package',includedUnits:10})).id;
  await capacity.assign(admin,{organizationId:org,packageId:pack,units:10,startsAt:new Date(Date.now()-60000).toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()});
  const server=createServer();await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw Error('No isolated API port');const port=address.port;await new Promise<void>(done=>server.close(()=>done()));base=`http://127.0.0.1:${port}/api/v1`;
  child=spawn(process.execPath,['dist/main.js'],{cwd:process.cwd(),windowsHide:true,env:{...process.env,NODE_ENV:'test',JWT_SECRET:jwtSecret,API_HOST:'127.0.0.1',API_PORT:String(port),WEB_ORIGIN:'http://127.0.0.1:5174',JUPITER_WORKER_ENABLED:'false'},stdio:'ignore'});
  let ready=false;for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Isolated API terminated');try{const r=await fetch(`${base}/health`);if(r.ok){ready=true;break;}}catch{}await new Promise(done=>setTimeout(done,100));}if(!ready)throw Error('Isolated API not ready');
},30000);
afterAll(async()=>{
  try{
    if(process.env.ASSIST_BROWSER_ACCEPTANCE==='true'){
      const finish=process.env.ASSIST_BROWSER_FINISH_FILE;if(!finish)throw Error('Explicit fixture finish path required');
      if((await db.query('SELECT status FROM assist_capacity_packages WHERE id=$1',[pack])).rows[0].status!=='ACTIVE')await capacity.setPackageStatus(admin,pack,{status:'ACTIVE',reason:'Disposable Browser acceptance'});
      await routing.saveSetting(owner(),true);
      await db.query("INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code='ORG_ADMIN' WHERE m.organization_id=$1 AND m.user_id=$2 ON CONFLICT DO NOTHING",[org,admin]);
      console.log(JSON.stringify({gate:'ASSIST_BROWSER_FIXTURE_READY',...browserFixture,api:base}));
      let finished=false;for(let i=0;i<1200;i++){try{await access(finish);finished=true;break;}catch{}await new Promise(done=>setTimeout(done,1000));}
      if(!finished)throw Error('Browser fixture time limit reached');
    }
  }finally{if(child&&child.exitCode===null){const stopped=once(child,'exit');child.kill();await stopped;}await db.onModuleDestroy();}
},1_300_000); // runner drops the entire guarded disposable database

describe('organization-authorized direct Assist',()=>{
  it('uses actual compiled HTTP membership checks for availability and organization settings',async()=>{
    expect((await http('/platform/assist/availability',user,org)).status).toBe(200);
    expect((await http('/platform/assist/availability',user,other)).status).toBe(401);
    expect((await http('/platform/assist/organization-setting',user,org,{enabled:true})).status).toBe(403);
    expect((await http('/platform/assist/organization-setting',admin,org,{enabled:'yes'})).status).toBe(400);
  });
  it('defaults disabled, rejects requester settings and creates no ticket on denied final submit',async()=>{
    expect(await routing.availability(actor())).toMatchObject({enabled:false,available:false,reason:'ORGANIZATION_DISABLED'});
    await expect(routing.saveSetting(actor(),true)).rejects.toBeDefined();
    await expect(intake.createRequest(actor(),payload(),randomUUID())).rejects.toBeDefined();
    expect((await db.query('SELECT id FROM tickets WHERE organization_id=$1',[org])).rowCount).toBe(0);
    expect((await db.query('SELECT id FROM assist_cases WHERE organization_id=$1',[org])).rowCount).toBe(0);
  });
  it('owner consent queues directly and duplicate/parallel submission creates one ticket and case without charge',async()=>{
    expect(await routing.saveSetting(owner(),true)).toMatchObject({available:true,direct:true});
    const key=randomUUID(),data=payload();
    const [a,b]=await Promise.all([intake.createRequest(actor(),data,key),intake.createRequest(actor(),data,key)]);
    expect(a.id).toBe(b.id);
    expect((await db.query('SELECT id FROM ticket_assignments WHERE ticket_id=$1',[a.id])).rowCount).toBe(0);
    expect((await db.query('SELECT status,ticket_only_delegation FROM assist_cases WHERE ticket_id=$1',[a.id])).rows[0]).toEqual({status:'QUEUED',ticket_only_delegation:true});
    expect((await db.query("SELECT id FROM assist_capacity_ledger WHERE organization_id=$1 AND event_type='CONSUMED'",[org])).rowCount).toBe(0);
    await expect(intake.createRequest(actor(),{...data,title:'محتوای دیگر'},key)).rejects.toBeDefined();
  });
  it('accepts once, grants only that ticket, replies publicly, then ends the delegated grant on completion',async()=>{
    const ticket=await intake.createRequest(actor(),payload(),randomUUID());
    const record=(await db.query<{id:string}>('SELECT id FROM assist_cases WHERE ticket_id=$1',[ticket.id])).rows[0];
    await expect(assist.accept(user,record.id)).rejects.toBeDefined();
    const accepted=await Promise.all([assist.accept(agent,record.id),assist.accept(agent,record.id)]);
    expect(accepted[0].id).toBe(accepted[1].id);
    expect((await db.query("SELECT id FROM assist_capacity_ledger WHERE assist_case_id=$1 AND event_type='CONSUMED'",[record.id])).rowCount).toBe(1);
    const grant=(await db.query('SELECT scope,ticket_id,allows_restricted,extract(epoch FROM expires_at-starts_at)::int AS seconds FROM support_access_grants WHERE assist_case_id=$1',[record.id])).rows[0];
    expect(grant).toMatchObject({scope:'ROUTED_ONLY',ticket_id:ticket.id,allows_restricted:false});
    expect(grant.seconds).toBe(86400);
    expect(await assist.canAccessTicket(agent,other,ticket.id)).toBe(false);
    await expect(assist.ticket(user,record.id)).rejects.toBeDefined();
    await assist.addMessage(agent,record.id,'پاسخ تیم ژوپیتر');
    expect(await assist.messages(agent,record.id)).toEqual(expect.arrayContaining([expect.objectContaining({body:'پاسخ تیم ژوپیتر'})]));
    await routing.saveSetting(owner(),false);
    expect((await assist.ticket(agent,record.id)).id).toBe(ticket.id);
    await assist.agentState(agent,record.id,'COMPLETED');
    await expect(assist.messages(agent,record.id)).rejects.toBeDefined();
    expect((await db.query('SELECT revoked_at FROM support_access_grants WHERE assist_case_id=$1',[record.id])).rows[0].revoked_at).toBeTruthy();
    expect((await db.query("SELECT id FROM audit_logs WHERE organization_id=$1 AND actor_user_id=$2 AND action='assist.delegated_grant_ended' AND metadata->>'assistCaseId'=$3",[org,agent,record.id])).rowCount).toBe(1);
  });
  it('preserves manual submission while disabled, and denies cross-tenant requests',async()=>{
    const ticket=await intake.createRequest(actor(),{...payload(),supportTeam:'ORGANIZATION'},randomUUID());
    expect(ticket.status).toBe('OPEN');
    expect((await db.query('SELECT id FROM ticket_assignments WHERE ticket_id=$1',[ticket.id])).rowCount).toBe(1);
    expect((await db.query('SELECT id FROM assist_cases WHERE ticket_id=$1',[ticket.id])).rowCount).toBe(0);
    await expect(assist.request({...actor(),organizationId:other},ticket.id)).rejects.toBeDefined();
  });
  it('checks current grant expiry/revocation and hides internal notes in the public support projection',async()=>{
    await routing.saveSetting(owner(),true);
    const response=await http('/tickets/requests',user,org,payload(),randomUUID());expect(response.status).toBe(201);
    const ticket=await response.json() as {id:string};
    const id=(await db.query<{id:string}>('SELECT id FROM assist_cases WHERE ticket_id=$1',[ticket.id])).rows[0].id;
    await assist.accept(agent,id);
    await db.query("INSERT INTO ticket_internal_notes(organization_id,ticket_id,author_user_id,body) VALUES($1,$2,$3,'Internal-only fixture')",[org,ticket.id,admin]);
    expect(JSON.stringify(await assist.ticket(agent,id))).not.toContain('Internal-only');
    expect(JSON.stringify(await assist.messages(agent,id))).not.toContain('Internal-only');
    await db.query("UPDATE support_access_grants SET starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE assist_case_id=$1",[id]);
    await expect(assist.addMessage(agent,id,'Expired grant reply')).rejects.toBeDefined();
    await db.query("UPDATE support_access_grants SET expires_at=now()+interval '1 day',revoked_at=now() WHERE assist_case_id=$1",[id]);
    await expect(assist.ticket(agent,id)).rejects.toBeDefined();
    await expect(assist.addMessage(agent,id,'Revoked grant reply')).rejects.toBeDefined();
    expect((await db.query("SELECT id FROM assist_capacity_ledger WHERE assist_case_id=$1 AND event_type='CONSUMED'",[id])).rowCount).toBe(1);
  });
  it('never auto-grants restricted cases and never consumes suspended package capacity',async()=>{
    await routing.saveSetting(owner(),true);
    const ticket=await intake.createRequest(actor(),payload(),randomUUID());
    const id=(await db.query<{id:string}>('SELECT id FROM assist_cases WHERE ticket_id=$1',[ticket.id])).rows[0].id;
    await db.query('UPDATE tickets SET is_restricted=true WHERE id=$1',[ticket.id]);
    await expect(assist.accept(agent,id)).rejects.toBeDefined();
    expect((await db.query('SELECT id FROM support_access_grants WHERE assist_case_id=$1',[id])).rowCount).toBe(0);
    await capacity.setPackageStatus(admin,pack,{status:'SUSPENDED',reason:'Test suspension'});
    expect(await routing.availability(actor())).toMatchObject({reason:'CAPACITY_UNAVAILABLE'});
    await expect(intake.createRequest(actor(),payload(),randomUUID())).rejects.toBeDefined();
  });
  it('routes every explicit batch ticket once, isolates receipts and rolls back a denied batch',async()=>{
    await capacity.setPackageStatus(admin,pack,{status:'ACTIVE',reason:'Batch regression fixture'});
    await routing.saveSetting(owner(),true);
    const session=await intake.create(actor(),{description:'Explicit multi-issue fixture'}),proposal=randomUUID();
    const secondary={id:proposal,summary:'Second explicit issue',selectable:true,ticket:{title:'Secondary fixture',description:'Second explicit issue'}};
    await db.query("UPDATE ticket_intake_sessions SET status='SUCCEEDED',analysis_result='{}',secondary_issues=$2 WHERE id=$1",[session.id,JSON.stringify([secondary])]);
    const data={...payload(),intakeSessionId:session.id,secondaryProposalIds:[proposal]},key=randomUUID();
    const [first,retry]=await Promise.all([intake.createBatch(actor(),data,key),intake.createBatch(actor(),data,key)]);
    expect(first.primary.id).toBe(retry.primary.id);expect(first.secondary).toHaveLength(1);
    expect((await db.query("SELECT id FROM assist_cases WHERE ticket_id=ANY($1::uuid[]) AND status='QUEUED'",[[first.primary.id,first.secondary[0].id]])).rowCount).toBe(2);
    expect((await db.withOrganization(other,c=>c.query('SELECT * FROM ticket_submission_receipts WHERE organization_id=$1',[org]))).rowCount).toBe(0);
    const denied=await intake.create(actor(),{description:'Denied batch fixture'});
    await db.query("UPDATE ticket_intake_sessions SET status='SUCCEEDED',analysis_result='{}' WHERE id=$1",[denied.id]);
    await routing.saveSetting(owner(),false);
    const count=Number((await db.query('SELECT count(*) FROM tickets WHERE organization_id=$1',[org])).rows[0].count);
    await expect(intake.createBatch(actor(),{...payload(),intakeSessionId:denied.id},randomUUID())).rejects.toBeDefined();
    expect(Number((await db.query('SELECT count(*) FROM tickets WHERE organization_id=$1',[org])).rows[0].count)).toBe(count);
    expect((await intake.get(actor(),denied.id)).status).toBe('SUCCEEDED');
  });
});
