import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../src/database/database.service.js';
import { NotificationService } from '../src/notifications/notification.service.js';
import { PersonalCapacityService } from '../src/personal-capacity/personal-capacity.service.js';
import { PersonalSupportService } from '../src/personal-support/personal-support.service.js';
import { CommercialService } from '../src/commercial/commercial.service.js';

const database=new DatabaseService();
const capacity=new PersonalCapacityService(database);
const support=new PersonalSupportService(database,new NotificationService(database),capacity);
const commercial=new CommercialService(database,undefined,undefined,capacity);
const marker=randomUUID().replace(/-/g,'').slice(0,12);
let platformId='',outsiderId='',ownerAId='',ownerBId='',ownerCId='',agentId='';
let personalAId='',personalBId='',personalCId='',organizationId='';
const organizationIds:string[]=[];
const ticketIds:string[]=[];
const packageIds:string[]=[];
const actorA=()=>({userId:ownerAId,organizationId:personalAId,roles:['REQUESTER']});
const actorB=()=>({userId:ownerBId,organizationId:personalBId,roles:['REQUESTER']});

async function member(organizationId:string,userId:string) {
  const membership=(await database.query<{id:string}>(
    `INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active') RETURNING id`,[organizationId,userId],
  )).rows[0];
  await database.query(`INSERT INTO membership_roles(membership_id,role_id) SELECT $1,id FROM roles WHERE code='REQUESTER'`,[membership.id]);
}

async function personal(ownerId:string,label:string) {
  const id=(await database.query<{id:string}>(
    `INSERT INTO organizations(slug,name,status,workspace_type,personal_owner_user_id)
     VALUES($1,$2,'active','PERSONAL',$3) RETURNING id`,[`capacity-${label}-${marker}`,`Capacity ${label}`,ownerId],
  )).rows[0].id;
  organizationIds.push(id);await member(id,ownerId);return id;
}

async function ticket(organizationId:string,userId:string,label:string) {
  const id=(await database.query<{id:string}>(
    `INSERT INTO tickets(organization_id,requester_user_id,title,description,status,priority)
     VALUES($1,$2,$3,'Capacity fixture','OPEN','NORMAL') RETURNING id`,[organizationId,userId,label],
  )).rows[0].id;
  ticketIds.push(id);return id;
}

async function personalPackage(code:string,poolCode:'SUPPORT'|'AI',units:number,validityDays:number,price=100000) {
  const result=await capacity.savePackage(platformId,{code:`${code}_${marker.toUpperCase()}`,name:`Package ${code}`,description:'Personal capacity fixture',poolCode,unitCount:units,priceIrt:price,validityDays,status:'ACTIVE'});
  packageIds.push(result.id);return result;
}

describe('GOAL-063 personal recurring allowance and package capacity',()=>{
  beforeAll(async()=>{
    const users=await Promise.all([
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES($1,'Capacity Platform','fixture',true) RETURNING id`,[`capacity-platform-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Capacity Outsider','fixture') RETURNING id`,[`capacity-outsider-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Capacity Owner A','fixture') RETURNING id`,[`capacity-owner-a-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Capacity Owner B','fixture') RETURNING id`,[`capacity-owner-b-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Capacity Owner C','fixture') RETURNING id`,[`capacity-owner-c-${marker}@jupiter.test`]),
      database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,'Capacity Agent','fixture') RETURNING id`,[`capacity-agent-${marker}@jupiter.test`]),
    ]);
    [platformId,outsiderId,ownerAId,ownerBId,ownerCId,agentId]=users.map(result=>result.rows[0].id);
    personalAId=await personal(ownerAId,'a');personalBId=await personal(ownerBId,'b');personalCId=await personal(ownerCId,'c');
    organizationId=(await database.query<{id:string}>(`INSERT INTO organizations(slug,name,status) VALUES($1,'Capacity Organization','active') RETURNING id`,[`capacity-org-${marker}`])).rows[0].id;
    organizationIds.push(organizationId);await member(organizationId,outsiderId);
    await database.query(`INSERT INTO jupiter_support_agents(user_id,status,enabled_by_user_id) VALUES($1,'ACTIVE',$2)`,[agentId,platformId]);
  });

  afterAll(async()=>{
    const userIds=[platformId,outsiderId,ownerAId,ownerBId,ownerCId,agentId];
    await database.query(`UPDATE personal_allowance_policies SET default_monthly_units=CASE pool_code WHEN 'SUPPORT' THEN 3 ELSE 10 END,updated_by_user_id=NULL,updated_at=now()`);
    await database.query('DELETE FROM user_notifications WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM support_access_grants WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM personal_support_cases WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM personal_capacity_reservations WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM personal_package_allocations WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM personal_allowance_windows WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM personal_allowance_overrides WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM ticket_messages WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM ticket_activities WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM audit_logs WHERE organization_id=ANY($1::uuid[]) OR actor_user_id=ANY($2::uuid[])',[organizationIds,userIds]);
    await database.query('DELETE FROM tickets WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=ANY($1::uuid[]))',[organizationIds]);
    await database.query('DELETE FROM memberships WHERE organization_id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM organizations WHERE id=ANY($1::uuid[])',[organizationIds]);
    await database.query('DELETE FROM personal_packages WHERE id=ANY($1::uuid[])',[packageIds]);
    await database.query('DELETE FROM jupiter_support_agents WHERE user_id=$1',[agentId]);
    await database.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[userIds]);
    await database.onModuleDestroy();
  });

  it('provisions immutable UTC monthly defaults and future-only overrides with Platform authority',async()=>{
    await expect(capacity.platformPolicies(outsiderId)).rejects.toBeInstanceOf(ForbiddenException);
    const first=await capacity.ownerSummary(actorA());
    expect(first.pools).toEqual(expect.arrayContaining([
      expect.objectContaining({poolCode:'SUPPORT',monthlyGranted:3,monthlyRemaining:3}),
      expect.objectContaining({poolCode:'AI',monthlyGranted:10,monthlyRemaining:10}),
    ]));
    const supportPool=first.pools.find(item=>item.poolCode==='SUPPORT')!;
    expect(new Date(supportPool.periodStartsAt).getUTCDate()).toBe(1);
    expect(new Date(supportPool.periodStartsAt).getUTCHours()).toBe(0);
    await capacity.savePolicy(platformId,{poolCode:'SUPPORT',monthlyUnits:5});
    expect((await capacity.ownerSummary(actorA())).pools.find(item=>item.poolCode==='SUPPORT')?.monthlyGranted).toBe(3);
    await capacity.saveOverride(platformId,{organizationId:personalBId,poolCode:'SUPPORT',monthlyUnits:1});
    expect((await capacity.ownerSummary(actorB())).pools.find(item=>item.poolCode==='SUPPORT')?.monthlyGranted).toBe(1);
    await capacity.saveOverride(platformId,{organizationId:personalBId,poolCode:'SUPPORT',monthlyUnits:null});
    expect((await capacity.ownerSummary(actorB())).pools.find(item=>item.poolCode==='SUPPORT')?.monthlyGranted).toBe(1);
    await expect(capacity.saveOverride(platformId,{organizationId,poolCode:'SUPPORT',monthlyUnits:2})).rejects.toBeInstanceOf(NotFoundException);
    await expect(capacity.ownerSummary({userId:ownerAId,organizationId:personalBId,roles:['REQUESTER']})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(database.withOrganization(personalAId,client=>client.query(`UPDATE personal_allowance_overrides SET monthly_units=99 WHERE pool_code='SUPPORT'`))).rejects.toThrow(/permission denied/i);
  });

  it('snapshots active packages, allocates idempotently and consumes nearest expiry after monthly capacity',async()=>{
    const near=await personalPackage('NEAR','SUPPORT',2,30,250000);
    const far=await personalPackage('FAR','SUPPORT',2,365,400000);
    const nearKey=`near-${marker}`;const farKey=`far-${marker}`;
    const nearAllocation=await capacity.allocatePackage(platformId,{organizationId:personalBId,packageId:near.id,reason:'پذیرش آزمایشی',idempotencyKey:nearKey});
    const duplicate=await capacity.allocatePackage(platformId,{organizationId:personalBId,packageId:near.id,reason:'تکرار',idempotencyKey:nearKey});
    expect(duplicate.id).toBe(nearAllocation.id);
    await capacity.allocatePackage(platformId,{organizationId:personalBId,packageId:far.id,reason:'پذیرش آزمایشی',idempotencyKey:farKey});
    await capacity.savePackage(platformId,{id:near.id,code:`NEAR_${marker.toUpperCase()}`,name:'Package changed',description:'Changed future catalog values',poolCode:'SUPPORT',unitCount:20,priceIrt:999999,validityDays:60,status:'ACTIVE'});
    const snapshot=(await database.query<{package_name_snapshot:string;granted_units:number;price_irt_snapshot:string}>(
      'SELECT package_name_snapshot,granted_units,price_irt_snapshot::text FROM personal_package_allocations WHERE id=$1',[nearAllocation.id],
    )).rows[0];
    expect(snapshot).toEqual({package_name_snapshot:'Package NEAR',granted_units:2,price_irt_snapshot:'250000'});

    const firstTicket=await ticket(personalBId,ownerBId,'Monthly capacity');
    const secondTicket=await ticket(personalBId,ownerBId,'Purchased capacity');
    const first=await support.request(actorB(),firstTicket);
    const second=await support.request(actorB(),secondTicket);
    const sources=(await database.query<{ticket_id:string;source:string;package_allocation_id:string|null}>(
      `SELECT support_case.ticket_id,reservation.source,reservation.package_allocation_id
       FROM personal_support_cases support_case
       JOIN personal_capacity_reservations reservation ON reservation.id=support_case.capacity_reservation_id
       WHERE support_case.id=ANY($1::uuid[])`,[[first.id,second.id]],
    )).rows;
    expect(sources.find(item=>item.ticket_id===firstTicket)?.source).toBe('MONTHLY');
    expect(sources.find(item=>item.ticket_id===secondTicket)).toMatchObject({source:'PURCHASED',package_allocation_id:nearAllocation.id});
    const duplicateCase=await support.request(actorB(),secondTicket);
    expect(duplicateCase.id).toBe(second.id);
    expect((await database.query<{count:number}>(`SELECT count(*)::int AS count FROM personal_capacity_reservations WHERE organization_id=$1`,[personalBId])).rows[0].count).toBe(2);
  });

  it('releases rejected/cancelled reservations, settles acceptance once and denies beyond total capacity',async()=>{
    const monthlyCase=(await database.query<{id:string;ticket_id:string}>(
      `SELECT support_case.id,support_case.ticket_id FROM personal_support_cases support_case
       JOIN personal_capacity_reservations reservation ON reservation.id=support_case.capacity_reservation_id
       WHERE support_case.organization_id=$1 AND reservation.source='MONTHLY'`,[personalBId],
    )).rows[0];
    const accepted=await support.accept(agentId,monthlyCase.id);
    await expect(support.accept(agentId,monthlyCase.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(accepted.status).toBe('ACCEPTED');
    expect((await database.query<{count:number}>(`SELECT count(*)::int AS count FROM personal_capacity_reservations WHERE subject_id=$1 AND status='SETTLED'`,[monthlyCase.id])).rows[0].count).toBe(1);

    const cancelTicket=await ticket(personalBId,ownerBId,'Cancelled purchased');
    const cancelled=await support.request(actorB(),cancelTicket);
    await support.cancel(actorB(),cancelled.id);
    expect((await database.query<{status:string}>(`SELECT status FROM personal_capacity_reservations WHERE subject_type='SUPPORT_CASE' AND idempotency_key=$1`,[`PERSONAL_SUPPORT:${cancelTicket}`])).rows[0].status).toBe('RELEASED');
    const reuseTicket=await ticket(personalBId,ownerBId,'Reuse released capacity');
    const reuse=await support.request(actorB(),reuseTicket);
    await support.reject(platformId,reuse.id,'آزمون آزادسازی');
    expect((await database.query<{status:string}>(`SELECT status FROM personal_capacity_reservations WHERE id=(SELECT capacity_reservation_id FROM personal_support_cases WHERE id=$1)`,[reuse.id])).rows[0].status).toBe('RELEASED');

    const fillOne=await support.request(actorB(),await ticket(personalBId,ownerBId,'Fill package one'));
    const fillTwo=await support.request(actorB(),await ticket(personalBId,ownerBId,'Fill package two'));
    const fillThree=await support.request(actorB(),await ticket(personalBId,ownerBId,'Fill package three'));
    await support.accept(agentId,fillOne.id);await support.accept(agentId,fillTwo.id);await support.accept(agentId,fillThree.id);
    const deniedTicket=await ticket(personalBId,ownerBId,'No remaining capacity');
    await expect(support.request(actorB(),deniedTicket)).rejects.toBeInstanceOf(ConflictException);
    expect((await database.query<{count:number}>(`SELECT count(*)::int AS count FROM personal_support_cases WHERE ticket_id=$1`,[deniedTicket])).rows[0].count).toBe(0);
    expect((await database.query<{status:string}>(`SELECT status FROM tickets WHERE id=$1`,[deniedTicket])).rows[0].status).toBe('OPEN');
  });

  it('serializes first-month reservations and keeps SUPPORT, AI and tenants isolated',async()=>{
    await capacity.saveOverride(platformId,{organizationId:personalCId,poolCode:'SUPPORT',monthlyUnits:1});
    await capacity.saveOverride(platformId,{organizationId:personalCId,poolCode:'AI',monthlyUnits:4});
    const ticketA=await ticket(personalCId,ownerCId,'Concurrent A');
    const ticketB=await ticket(personalCId,ownerCId,'Concurrent B');
    const actorC={userId:ownerCId,organizationId:personalCId,roles:['REQUESTER']};
    const outcomes=await Promise.allSettled([support.request(actorC,ticketA),support.request(actorC,ticketB)]);
    expect(outcomes.filter(item=>item.status==='fulfilled')).toHaveLength(1);
    expect(outcomes.filter(item=>item.status==='rejected')).toHaveLength(1);
    expect((await database.query<{count:number}>(
      `SELECT count(*)::int AS count FROM personal_capacity_reservations
       WHERE organization_id=$1 AND pool_code='SUPPORT' AND status IN ('RESERVED','SETTLED')`,[personalCId],
    )).rows[0].count).toBe(1);
    const summary=await capacity.ownerSummary(actorC);
    expect(summary.pools.find(item=>item.poolCode==='SUPPORT')?.monthlyRemaining).toBe(0);
    expect(summary.pools.find(item=>item.poolCode==='AI')).toMatchObject({monthlyGranted:4,monthlyRemaining:4});
    expect((await capacity.ownerSummary(actorA())).organizationId).toBe(personalAId);

    const expiredPackage=await personalPackage('EXPIRED_AI','AI',2,10);
    const expiredAllocation=await capacity.allocatePackage(platformId,{organizationId:personalAId,packageId:expiredPackage.id,reason:'آزمون انقضا',idempotencyKey:`expired-${marker}`});
    await database.query(`UPDATE personal_allowance_windows SET granted_units=0 WHERE organization_id=$1 AND pool_code='AI'`,[personalAId]);
    await database.query(`UPDATE personal_package_allocations SET starts_at=now()-interval '20 days',expires_at=now()-interval '10 days' WHERE id=$1`,[expiredAllocation.id]);
    await expect(database.withOrganization(personalAId,client=>capacity.reserve(client,{organizationId:personalAId,poolCode:'AI',subjectType:'AI_ACTION',idempotencyKey:`expired-ai-${marker}`,actorId:ownerAId}))).rejects.toBeInstanceOf(ConflictException);
    await expect(database.withOrganization(personalAId,client=>client.query(`UPDATE personal_package_allocations SET status='REVOKED' WHERE id=$1`,[expiredAllocation.id]))).rejects.toThrow(/permission denied/i);
    await expect(capacity.revokeAllocation(platformId,expiredAllocation.id,'پایان تخصیص آزمایشی')).resolves.toMatchObject({status:'REVOKED'});
  });

  it('meters personal Ticket Review and Smart Intake against AI capacity exactly once',async()=>{
    const actorC={userId:ownerCId,organizationId:personalCId,roles:['REQUESTER']};
    const reviewKey=randomUUID();
    const intakeKey=randomUUID();
    const first=await commercial.reserveSmartAction(actorC,'AI_TICKET_REVIEW',reviewKey,{type:'ticket',id:randomUUID()});
    const duplicate=await commercial.reserveSmartAction(actorC,'AI_TICKET_REVIEW',reviewKey,{type:'ticket',id:randomUUID()});
    expect(duplicate.id).toBe(first.id);
    expect((await capacity.ownerSummary(actorC)).pools.find(item=>item.poolCode==='AI')?.monthlyRemaining).toBe(3);
    await commercial.settleSmartAction(personalCId,reviewKey,randomUUID());
    await expect(commercial.settleSmartAction(personalCId,reviewKey,randomUUID())).resolves.toMatchObject({idempotent:true});
    await commercial.reserveSmartAction(actorC,'AI_SMART_INTAKE',intakeKey,{type:'ticket_intake',id:randomUUID()});
    await commercial.releaseSmartAction(personalCId,intakeKey);
    await commercial.releaseSmartAction(personalCId,intakeKey);
    const rows=(await database.query<{status:string;count:number}>(
      `SELECT status,count(*)::int AS count FROM personal_capacity_reservations
       WHERE organization_id=$1 AND subject_type='AI_ACTION' GROUP BY status`,[personalCId],
    )).rows;
    expect(rows).toEqual(expect.arrayContaining([{status:'SETTLED',count:1},{status:'RELEASED',count:1}]));
    expect((await capacity.ownerSummary(actorC)).pools.find(item=>item.poolCode==='AI')?.monthlyRemaining).toBe(3);
    await expect(commercial.reserveSmartAction({userId:ownerBId,organizationId:personalCId,roles:['REQUESTER']},'AI_TICKET_REVIEW',randomUUID())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
