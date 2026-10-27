import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {randomUUID,randomBytes} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {DatabaseService} from '../src/database/database.service.js';
import {OrganizationService} from '../src/organization/organization.service.js';
import {OrganizationApplicationService} from '../src/organization-applications/organization-application.service.js';
import {hashPassword} from '../src/auth/password.js';
import {databaseUrl} from '../src/config.js';
import {JwtService} from '@nestjs/jwt';
import {PersonalWorkspaceService} from '../src/personal-workspaces/personal-workspace.service.js';

// These tests deliberately exercise the real HTTP/session/tenant boundary.
// Never fall back to a developer or Preview database.
const target=new URL(databaseUrl());
const disposable=/^\/goal070_tests_[0-9a-f]{32}$/.test(target.pathname)||(process.env.CI==='true'&&target.pathname==='/jupiter_ci');
if(!disposable||!['localhost','127.0.0.1','[::1]'].includes(target.hostname))throw Error('Use scripts/goal070-isolated-api-tests.mjs or the explicit ephemeral CI database');
let child:ChildProcess|undefined,database:DatabaseService,organizations:OrganizationService,applications:OrganizationApplicationService,base='',adminId='',ownerId='',requesterId='',orgId='',otherOrgId='',adminToken='',ownerToken='';
const password='Synthetic-integration-password-070';
const suffix=randomUUID().replaceAll('-','').slice(0,12);
const jwtSecret=randomBytes(48).toString('base64url');
const call=(path:string,token?:string,body?:unknown,organizationId?:string,key?:string)=>fetch(`${base}${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`} :{}),...(organizationId?{'x-organization-id':organizationId}:{}),...(key?{'idempotency-key':key}:{})},body:body===undefined?undefined:JSON.stringify(body)});
const login=async(email:string,plain=password)=>{const result=await call('/auth/login',undefined,{identifier:email,password:plain});expect(result.status).toBe(201);return result.json();};

beforeAll(async()=>{
  database=new DatabaseService();organizations=new OrganizationService(database,{} as never);applications=new OrganizationApplicationService(database,{deliver:async()=>({status:'PENDING_CONFIGURATION'})});
  const server=createServer();await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw Error('No temporary port');const port=address.port;await new Promise<void>(done=>server.close(()=>done()));
  base=`http://127.0.0.1:${port}/api/v1`;
  child=spawn(process.execPath,['dist/main.js'],{cwd:process.cwd(),windowsHide:true,env:{...process.env,NODE_ENV:'test',JWT_SECRET:jwtSecret,API_HOST:'127.0.0.1',API_PORT:String(port),WEB_ORIGIN:`http://127.0.0.1:${port}`,AUTH_RATE_LIMIT_PER_MINUTE:'100',RATE_LIMIT_PER_MINUTE:'1000',OBSERVABILITY_ENABLED:'false',JUPITER_WORKER_ENABLED:'false',PUBLIC_ACCOUNT_VERIFICATION_DELIVERY:'disabled',AWS_EC2_METADATA_DISABLED:'true',S3_ENDPOINT:'',S3_BUCKET:'',S3_ACCESS_KEY_ID:'',S3_SECRET_ACCESS_KEY:''},stdio:['ignore','pipe','pipe']});
  child.stdout!.on('data',()=>undefined);child.stderr!.on('data',()=>undefined);
  await vi.waitFor(async()=>{if(child!.exitCode!==null)throw Error('Compiled fixture process exited');expect((await call('/health/ready')).status).toBe(200);},{timeout:20000,interval:100});
  const hash=await hashPassword(password);
  adminId=(await database.query<{id:string}>('INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES($1,$2,$3,true) RETURNING id',[`admin-${suffix}@goal070.test`,'مدیر پذیرش',hash])).rows[0].id;
  ownerId=(await database.query<{id:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3) RETURNING id',[`owner-${suffix}@goal070.test`,'مالک پذیرش',hash])).rows[0].id;
  adminToken=(await login(`admin-${suffix}@goal070.test`)).accessToken;
  ownerToken=(await login(`owner-${suffix}@goal070.test`)).accessToken;
},30000);
afterAll(async()=>{if(child&&child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill();await exited;}await database?.onModuleDestroy();});

describe('GOAL-070 supported onboarding HTTP integration',()=>{
  it('atomically provisions SETUP + owner/admin, retries once and rejects cross-authority/payload reuse',async()=>{
    const key=randomUUID(),body={name:'پذیرش صبا',legalName:'شرکت پذیرش صبا',slug:`saba-${suffix}`,initialOwnerUserId:ownerId};
    const rejected=await call('/admin/platform/organizations/setup',ownerToken,body,undefined,key);expect(rejected.status).toBe(403);
    const responses=await Promise.all([call('/admin/platform/organizations/setup',adminToken,body,undefined,key),call('/admin/platform/organizations/setup',adminToken,body,undefined,key)]);
    for(const response of responses)expect(response.status).toBe(201);
    const [a,b]=await Promise.all(responses.map(result=>result.json()));expect(a.id).toBe(b.id);expect(a.status).toBe('setup');orgId=a.id;
    const roles=(await database.query('SELECT r.code FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.user_id=$2 ORDER BY r.code',[orgId,ownerId])).rows;
    expect(roles).toEqual([{code:'ORG_ADMIN'},{code:'ORG_OWNER'}]);
    expect((await database.query("SELECT count(*)::int count FROM audit_logs WHERE organization_id=$1 AND action='platform.organization_setup_created'",[orgId])).rows[0].count).toBe(1);
    expect((await database.query('SELECT legal_name FROM organizations WHERE id=$1',[orgId])).rows[0].legal_name).toBe(body.legalName);
    expect((await call('/admin/platform/organizations/setup',adminToken,{...body,legalName:{invalid:true}},undefined,randomUUID())).status).toBe(400);
    expect((await call('/admin/platform/organizations/setup',adminToken,{...body,name:'Other payload'},undefined,key)).status).toBe(409);
    const invalid={...body,slug:`missing-owner-${suffix}`,initialOwnerUserId:randomUUID()};
    expect((await call('/admin/platform/organizations/setup',adminToken,invalid,undefined,randomUUID())).status).toBe(400);
    expect((await database.query('SELECT 1 FROM organizations WHERE slug=$1',[invalid.slug])).rowCount).toBe(0);
    const second=await call('/admin/platform/organizations/setup',adminToken,{...body,slug:`other-${suffix}`},undefined,randomUUID());otherOrgId=(await second.json()).id;
  });
  it('preserves quick-active ownerless compatibility and reports it without promotion',async()=>{
    const response=await call('/admin/platform/organizations',adminToken,{name:'Legacy quick active',slug:`legacy-${suffix}`});expect(response.status).toBe(201);const row=await response.json();expect(row.status).toBe('active');
    const list=await (await call('/admin/platform/organizations',adminToken)).json();expect(list.find((item:{id:string})=>item.id===row.id).has_active_owner).toBe(false);
    expect(list.find((item:{id:string})=>item.id===orgId).has_active_owner).toBe(true);
  });
  it('rolls back organization/membership/owner/audit together if the final audit write fails',async()=>{
    const key=randomUUID(),slug=`rollback-${suffix}`;
    await database.query(`CREATE FUNCTION goal070_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='platform.organization_setup_created' AND NEW.metadata->>'idempotencyKey'='${key}' THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END $$`);
    await database.query('CREATE TRIGGER goal070_fail_audit_trigger BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION goal070_fail_audit()');
    try{await expect(organizations.createSetupOrganization(adminId,{name:'Atomic rollback fixture',slug,initialOwnerUserId:ownerId},key)).rejects.toThrow('synthetic audit failure');}
    finally{await database.query('DROP TRIGGER goal070_fail_audit_trigger ON audit_logs');await database.query('DROP FUNCTION goal070_fail_audit()');}
    expect((await database.query('SELECT 1 FROM organizations WHERE slug=$1',[slug])).rowCount).toBe(0);
    expect((await database.query("SELECT 1 FROM audit_logs WHERE metadata->>'idempotencyKey'=$1",[key])).rowCount).toBe(0);
    const retried=await organizations.createSetupOrganization(adminId,{name:'Atomic rollback fixture',slug,initialOwnerUserId:ownerId},key);expect(retried.status).toBe('setup');
  });
  it('submits a verified applicant application after personal provisioning and existing organization membership',async()=>{
    let token='';
    const service=new OrganizationApplicationService(database,{deliver:async notification=>{token=notification.token;return {status:'DELIVERED'};}},new PersonalWorkspaceService(database));
    const email=`verified-${suffix}@goal070.test`,person=await service.createPublicAccount({email,displayName:'متقاضی تأییدشده',password});
    await service.verifyEmail(token);await expect(service.verifyEmail(token)).rejects.toMatchObject({status:400});
    const personal=(await login(email)).user.memberships;expect(personal).toHaveLength(1);expect(personal[0].workspace_type).toBe('PERSONAL');
    await organizations.addMember({organizationId:orgId,userId:ownerId,roles:['ORG_OWNER','ORG_ADMIN']},{email,displayName:'متقاضی تأییدشده',password,roles:['REQUESTER']});
    const session=await login(email);expect(session.passwordChangeRequired).toBeUndefined();expect(session.user.memberships).toHaveLength(2);
    const created=await call('/organization-applications',session.accessToken,{organizationName:'سازمان جدید متقاضی',contactName:'متقاضی تأییدشده',preferredSlug:`applied-${suffix}`,details:{legalName:'نام حقوقی نمونه'}},undefined,randomUUID());expect(created.status).toBe(201);const draft=await created.json();
    expect((await call(`/organization-applications/${draft.id}/submit`,session.accessToken,{},undefined,randomUUID())).status).toBe(201);
    expect((await call(`/platform/organization-applications/${draft.id}/start-review`,adminToken,{},undefined,randomUUID())).status).toBe(201);
    expect((await call(`/platform/organization-applications/${draft.id}/approve`,adminToken,{slug:`applied-${suffix}`},undefined,randomUUID())).status).toBe(201);
    const own=await (await call('/organization-applications/me',session.accessToken)).json();expect(own.find((item:{id:string})=>item.id===draft.id).status).toBe('APPROVED');
    const membership=(await database.query("SELECT o.status,r.code FROM organizations o JOIN memberships m ON m.organization_id=o.id JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id WHERE o.slug=$1 AND m.user_id=$2 AND r.code='ORG_OWNER'",[`applied-${suffix}`,person.id])).rows;
    expect(membership).toEqual([{status:'setup',code:'ORG_OWNER'}]);
  });
  it('truthfully persists disabled/failed delivery and denies unverified submissions or another applicant',async()=>{
    const email=`public-${suffix}@goal070.test`;
    const response=await call('/public/accounts',undefined,{email,displayName:'متقاضی مستقل',password});expect(response.status).toBe(201);const created=await response.json();expect(created.verificationDeliveryStatus).toBe('PENDING_CONFIGURATION');
    const user=await login(email);expect(user.passwordChangeRequired).toBeUndefined();
    const status=await (await call('/public/accounts/status',user.accessToken)).json();expect(status.emailVerified).toBe(false);expect(status.verificationDeliveryStatus).toBe('PENDING_CONFIGURATION');
    const draft=await call('/organization-applications',user.accessToken,{organizationName:'درخواست مستقل',contactName:'متقاضی مستقل',details:{}},undefined,randomUUID());expect(draft.status).toBe(201);const application=await draft.json();
    expect((await call(`/organization-applications/${application.id}/submit`,user.accessToken,{},undefined,randomUUID())).status).toBe(403);
    expect((await call(`/organization-applications/${application.id}`,ownerToken,{organizationName:'Other',contactName:'Other'},undefined,randomUUID())).status).toBe(404);
    expect((await call('/public/accounts/verification/resend',user.accessToken,{})).status).toBe(429);
    expect((await call('/platform/organization-applications/verification-readiness',ownerToken)).status).toBe(403);
    const health=await (await call('/platform/organization-applications/verification-readiness',adminToken)).json();expect(health).toMatchObject({configured:false,reasonCode:'DELIVERY_DISABLED',transportVerified:false});
    const failing=new OrganizationApplicationService(database,{deliver:async()=>{throw new Error('synthetic private provider failure');}});
    const failed=await failing.createPublicAccount({email:`failed-${suffix}@goal070.test`,displayName:'ارسال ناموفق',password});
    expect(failed.verificationDeliveryStatus).toBe('FAILED');expect((await failing.publicAccountStatus(failed.id)).verificationDeliveryStatus).toBe('FAILED');
    expect(JSON.stringify(await applications.verificationReadiness(adminId))).not.toContain('synthetic private');
  });
  it('forces a new member password change before any tenant access and consumes the challenge once',async()=>{
    const member=await organizations.addMember({organizationId:orgId,userId:ownerId,roles:['ORG_OWNER','ORG_ADMIN']},{email:`member-${suffix}@goal070.test`,displayName:'عضو با رمز موقت',password,roles:['REQUESTER']});requesterId=member!.userId;
    const initial=await login(`member-${suffix}@goal070.test`);expect(initial.passwordChangeRequired).toBe(true);expect(initial.accessToken).toBeUndefined();
    expect((await call('/tickets/queue',initial.passwordChangeToken,undefined,orgId)).status).toBe(401);
    expect((await call('/auth/password/first-login',undefined,{passwordChangeToken:initial.passwordChangeToken,nextPassword:password})).status).toBe(400);
    const body={passwordChangeToken:initial.passwordChangeToken,nextPassword:'Personal-new-password-070'};
    const responses=await Promise.all([call('/auth/password/first-login',undefined,body),call('/auth/password/first-login',undefined,body)]);
    expect(responses.map(response=>response.status).sort()).toEqual([201,401]);
    const session=await responses.find(response=>response.status===201)!.json();expect(session.accessToken).toBeTruthy();
    const cookie=responses.find(response=>response.status===201)!.headers.get('set-cookie')!.split(';')[0];
    expect((await call('/sla/policies',session.accessToken,undefined,orgId)).status).toBe(403);
    expect((await call('/tickets/queue',session.accessToken,undefined,otherOrgId)).status).toBe(401);
    const membership=(await database.query('SELECT id FROM memberships WHERE organization_id=$1 AND user_id=$2',[orgId,requesterId])).rows[0];
    await organizations.resetMemberPassword({organizationId:orgId,userId:ownerId,roles:['ORG_OWNER','ORG_ADMIN']},membership.id,'Another-temporary-password-070');
    expect((await call('/auth/me',session.accessToken)).status).toBe(401);
    expect((await fetch(`${base}/auth/refresh`,{method:'POST',headers:{cookie}})).status).toBe(401);
    expect((await call('/auth/password/first-login',undefined,body)).status).toBe(401);
    const audits=(await database.query("SELECT metadata FROM audit_logs WHERE actor_user_id=$1 OR target_id=$1",[requesterId])).rows;
    expect(JSON.stringify(audits)).not.toContain(password);expect(JSON.stringify(audits)).not.toContain(initial.passwordChangeToken);
  });
  it('rejects expired/wrong-purpose challenges and leaves Directory-only users and legacy membership reuse unchanged',async()=>{
    const signer=new JwtService({secret:jwtSecret});
    const expired=await signer.signAsync({sub:requesterId,purpose:'PASSWORD_CHANGE',credentialVersion:2},{expiresIn:-1,audience:'jupiter-first-login'});
    expect((await call('/auth/password/first-login',undefined,{passwordChangeToken:expired,nextPassword:'New-password-070'})).status).toBe(401);
    expect((await call('/auth/password/first-login',undefined,{passwordChangeToken:ownerToken,nextPassword:'New-password-070'})).status).toBe(401);
    const directory=(await database.query<{id:string}>("INSERT INTO users(email,display_name,password_hash) VALUES(NULL,'Directory-only fixture',NULL) RETURNING id")).rows[0];
    const membership=(await database.query<{id:string}>('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2) RETURNING id',[orgId,directory.id])).rows[0];
    await expect(organizations.resetMemberPassword({organizationId:orgId,userId:ownerId,roles:['ORG_OWNER','ORG_ADMIN']},membership.id,'Synthetic-directory-reset')).rejects.toMatchObject({status:400});
    expect((await database.query('SELECT must_change_password,credential_version,password_hash FROM users WHERE id=$1',[directory.id])).rows[0]).toEqual({must_change_password:false,credential_version:0,password_hash:null});
    const reused=await organizations.addMember({organizationId:otherOrgId,userId:ownerId,roles:['ORG_OWNER','ORG_ADMIN']},{email:`owner-${suffix}@goal070.test`,displayName:'مالک پذیرش',password:'Not-an-account-reset',roles:['REQUESTER']});expect(reused!.userId).toBe(ownerId);
    expect((await login(`owner-${suffix}@goal070.test`)).accessToken).toBeTruthy();expect((await call('/auth/me',ownerToken)).status).toBe(200);
    expect((await database.query("SELECT 1 FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.user_id=$2 AND r.code='ORG_OWNER'",[otherOrgId,ownerId])).rowCount).toBe(1);
  });
  it('upserts valid SLA policies through existing API with tenant separation and controlled validation',async()=>{
    const policy={name:'پشتیبانی عادی',priority:'NORMAL',firstResponseMinutes:60,resolutionMinutes:480,warningMinutes:30,escalationRole:'SUPERVISOR',isActive:true};
    expect((await call('/sla/policies',ownerToken,policy,orgId)).status).toBe(201);
    expect((await call('/sla/policies',ownerToken,{...policy,warningMinutes:-1},orgId)).status).toBe(400);
    expect((await (await call('/sla/policies',ownerToken,undefined,orgId)).json())[0]).toMatchObject({first_response_minutes:60,resolution_minutes:480,warning_minutes:30});
    expect(await (await call('/sla/policies',ownerToken,undefined,otherOrgId)).json()).toEqual([]);
    expect((await call('/admin/setup-wizard/profile',ownerToken,{name:'پذیرش صبا',businessTimezone:'Asia/Tehran'},orgId)).status).toBe(201);
    expect((await call('/admin/catalog/categories',ownerToken,{code:'IT',name:'فناوری اطلاعات'},orgId)).status).toBe(201);
    expect((await call('/admin/setup-wizard/go-live',ownerToken,{},orgId)).status).toBe(201);
    expect((await call('/tickets/new',ownerToken,undefined,orgId)).status).toBe(404);
  });
});
