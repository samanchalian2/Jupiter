import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../src/database/database.service.js';
import { PersonalWorkspaceService } from '../src/personal-workspaces/personal-workspace.service.js';
import { OrganizationService } from '../src/organization/organization.service.js';
import { TicketActorService } from '../src/tickets/ticket-actor.service.js';
import { OrganizationApplicationService } from '../src/organization-applications/organization-application.service.js';
import { VerificationNotification, VerificationNotificationDelivery } from '../src/organization-applications/verification-notification.service.js';
import { AuthService } from '../src/auth/auth.service.js';

const database = new DatabaseService();
const workspaces = new PersonalWorkspaceService(database);
const organizations = new OrganizationService(database, {} as never);
const marker = randomUUID().replace(/-/g, '').slice(0, 12);
let verifiedUserId = '';
let unverifiedUserId = '';
let otherUserId = '';
let flowUserId = '';
let platformUserId = '';
let regularOrganizationId = '';
let regularOrganizationSlug = '';
let personalOrganizationId = '';
let personalSlug = '';

describe('GOAL-061 personal workspace foundation', () => {
  beforeAll(async () => {
    const users = await Promise.all([
      database.query<{id:string}>(
        `INSERT INTO users(email,display_name,password_hash)
         VALUES($1,'Verified Personal User',NULL) RETURNING id`, [`personal-verified-${marker}@jupiter.test`],
      ),
      database.query<{id:string}>(
        `INSERT INTO users(email,display_name,password_hash)
         VALUES($1,'Unverified Personal User',NULL) RETURNING id`, [`personal-unverified-${marker}@jupiter.test`],
      ),
      database.query<{id:string}>(
        `INSERT INTO users(email,display_name,password_hash)
         VALUES($1,'Other Personal User',NULL) RETURNING id`, [`personal-other-${marker}@jupiter.test`],
      ),
      database.query<{id:string}>(
        `INSERT INTO users(email,display_name,password_hash,is_platform_admin)
         VALUES($1,'Personal Platform Admin','not-used',true) RETURNING id`, [`personal-platform-${marker}@jupiter.test`],
      ),
    ]);
    [verifiedUserId,unverifiedUserId,otherUserId,platformUserId] = users.map((result) => result.rows[0].id);
    await database.query(
      `INSERT INTO authentication_identities(user_id,identity_type,identifier,password_hash,email_verified_at)
       VALUES($1,'EMAIL_PASSWORD',$2,'not-used',now()),
             ($3,'EMAIL_PASSWORD',$4,'not-used',NULL)`,
      [verifiedUserId,`personal-verified-${marker}@jupiter.test`,unverifiedUserId,`personal-unverified-${marker}@jupiter.test`],
    );
    regularOrganizationSlug = `personal-coexist-${marker}`;
    regularOrganizationId = (await database.query<{id:string}>(
      `INSERT INTO organizations(slug,name,status)
       VALUES($1,'Coexisting Organization','active') RETURNING id`, [regularOrganizationSlug],
    )).rows[0].id;
    const membership = (await database.query<{id:string}>(
      `INSERT INTO memberships(organization_id,user_id,status)
       VALUES($1,$2,'active') RETURNING id`, [regularOrganizationId,verifiedUserId],
    )).rows[0];
    await database.query(
      `INSERT INTO membership_roles(membership_id,role_id)
       SELECT $1,id FROM roles WHERE code='REQUESTER'`, [membership.id],
    );
  });

  afterAll(async () => {
    const organizationIds = [personalOrganizationId,regularOrganizationId].filter(Boolean);
    if (organizationIds.length) {
      await database.query('DELETE FROM audit_logs WHERE organization_id=ANY($1::uuid[]) OR actor_user_id=ANY($2::uuid[])', [organizationIds,[verifiedUserId,unverifiedUserId,otherUserId,flowUserId,platformUserId].filter(Boolean)]);
      await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=ANY($1::uuid[]))', [organizationIds]);
      await database.query('DELETE FROM memberships WHERE organization_id=ANY($1::uuid[])', [organizationIds]);
      await database.query('DELETE FROM organizations WHERE id=ANY($1::uuid[])', [organizationIds]);
    }
    const userIds=[verifiedUserId,unverifiedUserId,otherUserId,flowUserId,platformUserId].filter(Boolean);
    await database.query('DELETE FROM refresh_sessions WHERE user_id=ANY($1::uuid[])', [userIds]);
    await database.query('DELETE FROM public_account_verification_deliveries WHERE token_id IN (SELECT id FROM public_account_verification_tokens WHERE user_id=ANY($1::uuid[]))', [userIds]);
    await database.query('DELETE FROM public_account_verification_tokens WHERE user_id=ANY($1::uuid[])', [userIds]);
    await database.query('DELETE FROM authentication_identities WHERE user_id=ANY($1::uuid[])', [userIds]);
    await database.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [userIds]);
    await database.onModuleDestroy();
  });

  it('provisions exactly one requester-only personal tenant and preserves organization membership', async () => {
    const first = await workspaces.requireForVerifiedUser(verifiedUserId);
    const second = await workspaces.requireForVerifiedUser(verifiedUserId);
    personalOrganizationId = first.organization_id;
    personalSlug = first.organization_slug;

    expect(second.organization_id).toBe(first.organization_id);
    expect(first).toMatchObject({ workspace_type:'PERSONAL', organization_status:'active', role_codes:['REQUESTER'] });
    const memberships = await database.query<{workspace_type:string;role_codes:string[]}>(
      `SELECT organization.workspace_type,
        array_remove(array_agg(role.code ORDER BY role.code),NULL) AS role_codes
       FROM memberships membership
       JOIN organizations organization ON organization.id=membership.organization_id
       LEFT JOIN membership_roles membership_role ON membership_role.membership_id=membership.id
       LEFT JOIN roles role ON role.id=membership_role.role_id
       WHERE membership.user_id=$1
       GROUP BY organization.id ORDER BY organization.workspace_type`, [verifiedUserId],
    );
    expect(memberships.rows).toEqual([
      {workspace_type:'ORGANIZATION',role_codes:['REQUESTER']},
      {workspace_type:'PERSONAL',role_codes:['REQUESTER']},
    ]);
    expect((await database.query<{count:number}>(
      `SELECT count(*)::int AS count FROM organizations
       WHERE workspace_type='PERSONAL' AND personal_owner_user_id=$1`, [verifiedUserId],
    )).rows[0].count).toBe(1);
  });

  it('provisions atomically from email verification and returns the personal workspace on the next login', async () => {
    let notification: VerificationNotification | undefined;
    const delivery: VerificationNotificationDelivery = { deliver: async (value) => { notification=value;return {status:'DELIVERED'}; } };
    const applications = new OrganizationApplicationService(database,delivery,workspaces);
    const email=`personal-flow-${marker}@jupiter.test`;
    const created=await applications.createPublicAccount({email,displayName:'Personal Flow User',password:'personal-flow-password'});
    flowUserId=created.id;
    await expect(applications.verifyEmail(notification!.token)).resolves.toEqual({verified:true});
    const session=await new AuthService(database,{signAsync:async()=> 'access-token'} as never,workspaces).login(email,'personal-flow-password');
    expect(session.user.memberships).toEqual([
      expect.objectContaining({workspace_type:'PERSONAL',organization_status:'active',role_codes:['REQUESTER']}),
    ]);
    const flowWorkspace=session.user.memberships[0];
    await database.query('DELETE FROM audit_logs WHERE organization_id=$1 OR actor_user_id=$2',[flowWorkspace.organization_id,flowUserId]);
    await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=$1)',[flowWorkspace.organization_id]);
    await database.query('DELETE FROM memberships WHERE organization_id=$1',[flowWorkspace.organization_id]);
    await database.query('DELETE FROM organizations WHERE id=$1',[flowWorkspace.organization_id]);
  });

  it('requires verified email and enforces personal membership invariants in PostgreSQL', async () => {
    await expect(workspaces.ensureForEligibleUser(unverifiedUserId)).resolves.toBeNull();
    await expect(workspaces.requireForVerifiedUser(unverifiedUserId)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(database.query(
      `INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active')`,
      [personalOrganizationId,otherUserId],
    )).rejects.toThrow(/verified owner/);
    const personalMembership = (await database.query<{id:string}>(
      'SELECT id FROM memberships WHERE organization_id=$1 AND user_id=$2', [personalOrganizationId,verifiedUserId],
    )).rows[0];
    await expect(database.query(
      `INSERT INTO membership_roles(membership_id,role_id)
       SELECT $1,id FROM roles WHERE code='ORG_OWNER'`, [personalMembership.id],
    )).rejects.toThrow(/REQUESTER/);
  });

  it('denies organization administration and owner assignment for a personal workspace', async () => {
    const personalActor={userId:verifiedUserId,organizationId:personalOrganizationId,roles:['REQUESTER']};
    await expect(organizations.members(personalActor)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(organizations.teams(personalActor)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(organizations.assignPlatformOwner(platformUserId,personalOrganizationId,verifiedUserId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps the internal personal slug out of organization routing while tenant ticket authorization remains valid', async () => {
    await expect(organizations.tenantContext(verifiedUserId,personalSlug)).rejects.toBeInstanceOf(NotFoundException);
    await expect(organizations.tenantContext(verifiedUserId,regularOrganizationSlug)).resolves.toMatchObject({organization_id:regularOrganizationId});
    const actorService = new TicketActorService({verify:async()=>({sub:verifiedUserId})} as never,database);
    await expect(actorService.fromHeaders('Bearer test',personalOrganizationId)).resolves.toEqual({
      userId:verifiedUserId,
      organizationId:personalOrganizationId,
      roles:['REQUESTER'],
    });
  });
});
