import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../src/database/database.service.js';
import { NotificationService } from '../src/notifications/notification.service.js';
import { PersonalSupportService } from '../src/personal-support/personal-support.service.js';
import { AssistService } from '../src/assist/assist.service.js';
import { PersonalCapacityService } from '../src/personal-capacity/personal-capacity.service.js';

const database=new DatabaseService();
const capacity=new PersonalCapacityService(database);
const support=new PersonalSupportService(database,new NotificationService(database),capacity);
const assist=new AssistService(database);
const marker=randomUUID().replace(/-/g,'').slice(0,12);
let platformId='',ownerId='',otherOwnerId='',agentAId='',agentBId='',outsiderId='';
let personalId='',otherPersonalId='',organizationId='';
let openTicketId='',draftTicketId='',secondTicketId='',thirdTicketId='';
const personalActor=()=>({userId:ownerId,organizationId:personalId,roles:['REQUESTER']});
const otherActor=()=>({userId:otherOwnerId,organizationId:otherPersonalId,roles:['REQUESTER']});

async function member(organizationId:string,userId:string) {
  const membership=(await database.query<{id:string}>(
    `INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active') RETURNING id`,[organizationId,userId],
  )).rows[0];
  await database.query(
    `INSERT INTO membership_roles(membership_id,role_id)
     SELECT $1,id FROM roles WHERE code='REQUESTER'`,[membership.id],
  );
}

async function ticket(organizationId:string,userId:string,status:'DRAFT'|'OPEN',title:string) {
  return (await database.query<{id:string}>(
    `INSERT INTO tickets(organization_id,requester_user_id,title,description,status,priority)
     VALUES($1,$2,$3,'Personal support fixture',$4,'NORMAL') RETURNING id`,
    [organizationId,userId,title,status],
  )).rows[0].id;
}

describe('GOAL-062 personal support operations',()=>{
  beforeAll(async()=>{
    const users=await Promise.all([
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES($1,'Personal Support Platform','fixture',true) RETURNING id`,[`personal-support-platform-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Personal Owner','fixture') RETURNING id`,[`personal-support-owner-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Other Personal Owner','fixture') RETURNING id`,[`personal-support-other-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Support Agent A','fixture') RETURNING id`,[`personal-support-agent-a-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Support Agent B','fixture') RETURNING id`,[`personal-support-agent-b-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Unauthorized User','fixture') RETURNING id`,[`personal-support-outsider-${marker}@jupiter.test`]),
    ]);
    [platformId,ownerId,otherOwnerId,agentAId,agentBId,outsiderId]=users.map(result=>result.rows[0].id);
    personalId=(await database.query<{id:string}>(
      `INSERT INTO organizations(slug,name,status,workspace_type,personal_owner_user_id)
       VALUES($1,'Personal Support Space','active','PERSONAL',$2) RETURNING id`,[`support-personal-${marker}`,ownerId],
    )).rows[0].id;
    otherPersonalId=(await database.query<{id:string}>(
      `INSERT INTO organizations(slug,name,status,workspace_type,personal_owner_user_id)
       VALUES($1,'Other Personal Space','active','PERSONAL',$2) RETURNING id`,[`support-other-${marker}`,otherOwnerId],
    )).rows[0].id;
    organizationId=(await database.query<{id:string}>(
      `INSERT INTO organizations(slug,name,status) VALUES($1,'Organization Fixture','active') RETURNING id`,[`support-org-${marker}`],
    )).rows[0].id;
    await member(personalId,ownerId);
    await member(otherPersonalId,otherOwnerId);
    await member(organizationId,outsiderId);
    await database.query(
      `INSERT INTO jupiter_support_agents(user_id,status,enabled_by_user_id)
       VALUES($1,'ACTIVE',$3),($2,'ACTIVE',$3)`,[agentAId,agentBId,platformId],
    );
    openTicketId=await ticket(personalId,ownerId,'OPEN','Open personal ticket');
    draftTicketId=await ticket(personalId,ownerId,'DRAFT','Draft personal ticket');
    secondTicketId=await ticket(personalId,ownerId,'OPEN','Second personal ticket');
    thirdTicketId=await ticket(personalId,ownerId,'OPEN','Third personal ticket');
  });

  afterAll(async()=>{
    const organizationIds=[personalId,otherPersonalId,organizationId];
    const userIds=[platformId,ownerId,otherOwnerId,agentAId,agentBId,outsiderId];
    await database.query(
      `UPDATE personal_service_catalog SET display_name='پشتیبانی شخصی Jupiter',
       description='رسیدگی مستقیم کارشناسان Jupiter به درخواست پشتیبانی فضای شخصی',
       status='ACTIVE',sla_minutes=480,access_grant_minutes=1440,updated_by_user_id=NULL,updated_at=now()
       WHERE code='PERSONAL_SUPPORT'`,
    );
    await database.query('DELETE FROM user_notifications WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM support_access_grants WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM personal_support_cases WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM ticket_messages WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM ticket_activities WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM audit_logs WHERE organization_id=ANY($1::uuid[]) OR actor_user_id=ANY($2::uuid[])',[organizationIds,userIds]);
    await database.query('DELETE FROM tickets WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=ANY($1::uuid[]))',[organizationIds]);
    await database.query('DELETE FROM memberships WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM organizations WHERE id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM jupiter_support_agents WHERE user_id=ANY($1::uuid[])',[[agentAId,agentBId]]);
    await database.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[userIds]);
    await database.onModuleDestroy();
  });

  it('exposes safe Platform-configurable catalog fields and rejects non-platform writes',async()=>{
    await expect(support.saveCatalog(outsiderId,{status:'ACTIVE',displayName:'x',description:'x',slaMinutes:30,accessGrantMinutes:60})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(support.saveCatalog(platformId,{
      status:'ACTIVE',displayName:'پشتیبانی مستقیم Jupiter',description:'رسیدگی امن به تیکت شخصی',slaMinutes:90,accessGrantMinutes:180,
    })).resolves.toMatchObject({code:'PERSONAL_SUPPORT'});
    await expect(support.effectiveCatalog(personalActor())).resolves.toMatchObject({
      code:'PERSONAL_SUPPORT',display_name:'پشتیبانی مستقیم Jupiter',status:'ACTIVE',sla_minutes:90,
    });
    const audit=(await database.query<{actor_user_id:string;metadata:{slaMinutes:number;accessGrantMinutes:number}}>(
      `SELECT actor_user_id,metadata FROM audit_logs
       WHERE action='personal_support.catalog_updated' ORDER BY created_at DESC LIMIT 1`,
    )).rows[0];
    expect(audit).toMatchObject({actor_user_id:platformId,metadata:{slaMinutes:90,accessGrantMinutes:180}});
    await expect(database.withOrganization(personalId,client=>client.query(
      `UPDATE personal_service_catalog SET status='SUSPENDED' WHERE code='PERSONAL_SUPPORT'`,
    ))).rejects.toThrow(/permission denied/i);
  });

  it('queues an idempotent case only for a submitted personal ticket and preserves manual ticketing',async()=>{
    const first=await support.request(personalActor(),openTicketId,'برای این مورد کمک می‌خواهم');
    const duplicate=await support.request(personalActor(),openTicketId,'تکرار درخواست');
    expect(duplicate.id).toBe(first.id);
    expect(first.status).toBe('QUEUED');
    await expect(support.request(personalActor(),draftTicketId)).rejects.toBeInstanceOf(NotFoundException);
    await expect(support.request(otherActor(),openTicketId)).rejects.toBeInstanceOf(NotFoundException);
    await expect(support.request({userId:outsiderId,organizationId,roles:['REQUESTER']},openTicketId)).rejects.toBeInstanceOf(ForbiddenException);
    await support.saveCatalog(platformId,{status:'SUSPENDED',displayName:'پشتیبانی مستقیم Jupiter',description:'رسیدگی امن به تیکت شخصی',slaMinutes:90,accessGrantMinutes:180});
    await expect(support.request(personalActor(),secondTicketId)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await database.query<{status:string}>('SELECT status FROM tickets WHERE id=$1',[secondTicketId])).rows[0].status).toBe('OPEN');
    await support.saveCatalog(platformId,{status:'ACTIVE',displayName:'پشتیبانی مستقیم Jupiter',description:'رسیدگی امن به تیکت شخصی',slaMinutes:90,accessGrantMinutes:180});
  });

  it('accepts concurrently only once, grants exact-ticket access, and revokes it on completion',async()=>{
    const queued=(await database.query<{id:string}>('SELECT id FROM personal_support_cases WHERE ticket_id=$1',[openTicketId])).rows[0];
    expect(await support.platformCases(platformId)).toEqual(expect.arrayContaining([
      expect.objectContaining({id:queued.id,can_administer:true,can_operate:false}),
    ]));
    expect(await support.platformCases(agentAId)).toEqual(expect.arrayContaining([
      expect.objectContaining({id:queued.id,can_administer:false,can_operate:true}),
    ]));
    const outcomes=await Promise.allSettled([support.accept(agentAId,queued.id),support.accept(agentBId,queued.id)]);
    expect(outcomes.filter(result=>result.status==='fulfilled')).toHaveLength(1);
    expect(outcomes.filter(result=>result.status==='rejected')).toHaveLength(1);
    const accepted=(await database.query<{assigned_support_agent_user_id:string;status:string}>(
      'SELECT assigned_support_agent_user_id,status FROM personal_support_cases WHERE id=$1',[queued.id],
    )).rows[0];
    const assigned=accepted.assigned_support_agent_user_id;
    const other=assigned===agentAId?agentBId:agentAId;
    expect(accepted.status).toBe('ACCEPTED');
    expect((await database.query<{count:number}>(
      `SELECT count(*)::int AS count FROM support_access_grants
       WHERE personal_support_case_id=$1 AND grant_source='PERSONAL_SUPPORT'`,[queued.id],
    )).rows[0].count).toBe(1);
    expect((await database.query<{count:number}>(
      'SELECT count(*)::int AS count FROM memberships WHERE user_id=ANY($1::uuid[])',[[agentAId,agentBId]],
    )).rows[0].count).toBe(0);
    await expect(support.ticket(other,queued.id)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(support.ticket(assigned,queued.id)).resolves.toMatchObject({id:openTicketId,title:'Open personal ticket'});
    await expect(support.addMessage(assigned,queued.id,'پاسخ کارشناس Jupiter')).resolves.toMatchObject({body:'پاسخ کارشناس Jupiter'});
    await expect(support.changeState(assigned,queued.id,'IN_PROGRESS')).resolves.toMatchObject({status:'IN_PROGRESS'});
    await expect(support.changeState(assigned,queued.id,'COMPLETED')).resolves.toMatchObject({status:'COMPLETED'});
    const grant=(await database.query<{revoked_at:Date|null}>(
      'SELECT revoked_at FROM support_access_grants WHERE personal_support_case_id=$1',[queued.id],
    )).rows[0];
    expect(grant.revoked_at).toBeInstanceOf(Date);
    await expect(support.ticket(assigned,queued.id)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await database.query<{status:string}>('SELECT status FROM tickets WHERE id=$1',[openTicketId])).rows[0].status).toBe('OPEN');
    expect(await assist.canAccessTicket(assigned,personalId,openTicketId)).toBe(false);
  });

  it('supports platform rejection and auditable revocation without cross-tenant access',async()=>{
    const queued=await support.request(personalActor(),secondTicketId,'درخواست دوم');
    await expect(support.ticket(agentAId,queued.id)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(database.query(
      `INSERT INTO support_access_grants(
        organization_id,support_agent_user_id,scope,ticket_id,allows_restricted,expires_at,
        created_by_user_id,grant_source,personal_support_case_id
       ) VALUES($1,$2,'ROUTED_ONLY',$3,true,now()+interval '1 hour',$2,'PERSONAL_SUPPORT',$4)`,
      [personalId,agentAId,thirdTicketId,queued.id],
    )).rejects.toThrow(/personal_case_fk/);
    await expect(support.reject(platformId,queued.id,'خارج از دامنه سرویس')).resolves.toMatchObject({status:'REJECTED'});
    const active=await support.request(personalActor(),thirdTicketId,'درخواست سوم');
    await support.accept(agentAId,active.id);
    await database.query(
      `UPDATE support_access_grants SET starts_at=now()-interval '2 hours',expires_at=now()-interval '1 hour'
       WHERE personal_support_case_id=$1`,[active.id],
    );
    await expect(support.ticket(agentAId,active.id)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(support.revoke(platformId,active.id,'توقف عملیاتی')).resolves.toMatchObject({status:'REVOKED'});
    await expect(support.ticket(agentAId,active.id)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(support.cancel(otherActor(),active.id)).rejects.toBeInstanceOf(NotFoundException);
    const audits=(await database.query<{action:string;actor_user_id:string}>(
      `SELECT action,actor_user_id FROM audit_logs
       WHERE target_id=ANY($1::uuid[]) AND action LIKE 'personal_support.%'`,[[queued.id,active.id]],
    )).rows;
    expect(audits).toEqual(expect.arrayContaining([
      expect.objectContaining({action:'personal_support.rejected',actor_user_id:platformId}),
      expect.objectContaining({action:'personal_support.revoked',actor_user_id:platformId}),
    ]));
  });
});
