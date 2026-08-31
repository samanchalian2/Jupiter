import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service.js';
import { hashPassword } from '../src/auth/password.js';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationApplicationService } from '../src/organization-applications/organization-application.service.js';
import { OrganizationService } from '../src/organization/organization.service.js';
import { DirectoryConnectorService } from '../src/directory/directory-connector.service.js';
import { CommercialService } from '../src/commercial/commercial.service.js';
import { SubscriptionLifecycleService } from '../src/commercial/subscription-lifecycle.service.js';
import { AssistService } from '../src/assist/assist.service.js';
import { AppearanceService } from '../src/appearance/appearance.service.js';
import { VerificationNotification, VerificationNotificationDelivery, VerificationNotificationOutcome } from '../src/organization-applications/verification-notification.service.js';
import { createHash, randomUUID } from 'node:crypto';

class CaptureVerificationDelivery implements VerificationNotificationDelivery {
  readonly notifications: VerificationNotification[] = [];
  async deliver(notification: VerificationNotification): Promise<VerificationNotificationOutcome> {
    this.notifications.push(notification);
    return { status: 'DELIVERED' };
  }
}

const database = new DatabaseService();
const delivery = new CaptureVerificationDelivery();
const applications = new OrganizationApplicationService(database, delivery);
const organizations = new OrganizationService(database, {} as never);
const connectors = new DirectoryConnectorService(database);
const subscriptions = new SubscriptionLifecycleService(database);
const commercial = new CommercialService(database, undefined, subscriptions);
const assist = new AssistService(database);
const appearance = new AppearanceService(database);
const createdEmails: string[] = [];
const fixtureId = randomUUID().replace(/-/g, '').slice(0, 12);
const uuid = (tail: string) => `00000000-0000-4000-8000-${tail.padStart(12, '0')}`;
const account = async (suffix: string) => {
  const email = `application-${suffix}-${fixtureId}@jupiter.test`;
  createdEmails.push(email);
  const result = await applications.createPublicAccount({ email, displayName: `Applicant ${suffix}`, password: 'safe-password-123' });
  const notification = delivery.notifications.at(-1)!;
  return { ...result, email, token: notification.token, response: result };
};

let directoryOrganizationA = '';
let directoryOrganizationB = '';
let platformAdminId = '';
let legacyOrganizationId = '';
let legacyOrganizationAdminId = '';
let setupOrganizationId = '';
let setupOwnerId = '';
let commercialProductCode = '';
let addonPackageCode = '';
let lifecycleProductCode = '';
let assistAgentId = '';
const provisionedSlugs: string[] = [];

beforeAll(async () => {
  directoryOrganizationA = (await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id', ['directory-principal-a', 'Directory Principal A'])).rows[0].id;
  directoryOrganizationB = (await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id', ['directory-principal-b', 'Directory Principal B'])).rows[0].id;
  platformAdminId = (await database.query<{id:string}>(
    `INSERT INTO users(email,display_name,password_hash,is_platform_admin) VALUES($1,$2,$3,true)
     ON CONFLICT(email) DO UPDATE SET is_platform_admin=true RETURNING id`, ['application-platform-admin@jupiter.test','Application Platform Admin','scrypt$AA$AA'],
  )).rows[0].id;
  legacyOrganizationId = (await database.query<{id:string}>(
    `INSERT INTO organizations(slug,name,status) VALUES($1,$2,'active')
     ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`, ['legacy-ownerless-application', 'Legacy Ownerless Application'],
  )).rows[0].id;
  legacyOrganizationAdminId = (await database.query<{id:string}>(
    `INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3)
     ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id`, ['legacy-ownerless-admin@jupiter.test','Legacy Ownerless Admin','scrypt$AA$AA'],
  )).rows[0].id;
  await database.query(`DELETE FROM membership_roles WHERE membership_id IN (SELECT m.id FROM memberships m JOIN roles r ON r.code='ORG_OWNER' WHERE m.organization_id=$1 AND m.user_id=$2)`, [legacyOrganizationId,legacyOrganizationAdminId]);
  assistAgentId = (await database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id`, ['jupiter-assist-agent@jupiter.test','Jupiter Assist Agent','scrypt$AA$AA'])).rows[0].id;
  await database.query('DELETE FROM assist_cases WHERE assigned_support_agent_user_id=$1', [assistAgentId]);
  await database.query('DELETE FROM support_access_grants WHERE support_agent_user_id=$1', [assistAgentId]);
  await database.query('DELETE FROM jupiter_support_agents WHERE user_id=$1', [assistAgentId]);
  await database.query(`INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active') ON CONFLICT DO NOTHING`, [legacyOrganizationId,legacyOrganizationAdminId]);
  await database.query(`INSERT INTO membership_roles(membership_id,role_id)
    SELECT membership.id,role.id FROM memberships membership JOIN roles role ON role.code='ORG_ADMIN'
    WHERE membership.organization_id=$1 AND membership.user_id=$2 ON CONFLICT DO NOTHING`, [legacyOrganizationId,legacyOrganizationAdminId]);
  setupOrganizationId = (await database.query<{id:string}>(`INSERT INTO organizations(slug,name,status) VALUES($1,$2,'setup') RETURNING id`, [`setup-${fixtureId}`, 'Setup Organization'])).rows[0].id;
  setupOwnerId = (await database.query<{id:string}>(`INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3) RETURNING id`, [`setup-owner-${fixtureId}@jupiter.test`, 'Setup Owner', 'scrypt$AA$AA'])).rows[0].id;
  await database.query(`INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active')`,[setupOrganizationId,setupOwnerId]);
  await database.query(`INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code IN ('ORG_OWNER','ORG_ADMIN') WHERE m.organization_id=$1 AND m.user_id=$2`,[setupOrganizationId,setupOwnerId]);
});

afterAll(async () => {
  await database.query("DELETE FROM audit_logs WHERE action LIKE 'assist.%'");
  await database.query('DELETE FROM support_access_grants WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM assist_cases WHERE assigned_support_agent_user_id=$1', [assistAgentId]);
  await database.query('DELETE FROM assist_cases WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM organization_assist_policies WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM tickets WHERE organization_id IN ($1,$2)', [directoryOrganizationA,directoryOrganizationB]);
  await database.query('DELETE FROM jupiter_support_agents WHERE user_id=$1', [assistAgentId]);
  await database.query("DELETE FROM audit_logs WHERE action LIKE 'commercial.%'");
  await database.query("DELETE FROM commercial_usage_ledger WHERE event_type IN ('ALLOWANCE_ALLOCATED','ADDON_ALLOCATED','SMART_ACTION_SETTLED')");
  await database.query('DELETE FROM commercial_smart_actions WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM commercial_addon_allocations WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM commercial_usage_allowances WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM commercial_entitlements WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM organization_feature_settings WHERE organization_id IN ($1,$2,$3)', [directoryOrganizationA,directoryOrganizationB,setupOrganizationId]);
  await database.query('DELETE FROM platform_capability_availability WHERE capability_code = ANY($1::text[])', [['SMART_ACTION_TEST','SMART_ACTION_CONCURRENCY']]);
  await database.query('DELETE FROM organization_commercial_agreements WHERE organization_id=$1', [setupOrganizationId]);
  await database.query('DELETE FROM commercial_subscriptions WHERE organization_id=$1', [setupOrganizationId]);
  if(commercialProductCode) await database.query('DELETE FROM commercial_products WHERE code=$1', [commercialProductCode]);
  if(addonPackageCode) await database.query('DELETE FROM commercial_addon_packages WHERE code=$1', [addonPackageCode]);
  if(lifecycleProductCode) await database.query('DELETE FROM commercial_products WHERE code=$1', [lifecycleProductCode]);
  await database.query(`DELETE FROM audit_logs WHERE actor_user_id IN (
    SELECT id FROM users WHERE email = ANY($1::text[])
  )`, [[...createdEmails,'application-platform-admin@jupiter.test','legacy-ownerless-admin@jupiter.test']]);
  await database.query('DELETE FROM organization_applications WHERE applicant_user_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))', [createdEmails]);
  await database.query('DELETE FROM public_account_verification_deliveries WHERE recipient_email = ANY($1::text[])', [createdEmails]);
  await database.query('DELETE FROM authentication_identities WHERE identifier = ANY($1::text[])', [createdEmails]);
  await database.query(`DELETE FROM membership_roles WHERE membership_id IN (
    SELECT id FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))
  )`, [createdEmails]);
  await database.query(`DELETE FROM memberships WHERE user_id IN (
    SELECT id FROM users WHERE email = ANY($1::text[])
  )`, [createdEmails]);
  await database.query('DELETE FROM users WHERE email = ANY($1::text[])', [createdEmails]);
  await database.query('DELETE FROM audit_logs WHERE action LIKE $1', ['public_account.%']);
  await database.query('DELETE FROM organizations WHERE slug = ANY($1::text[])', [provisionedSlugs]);
  await database.query('DELETE FROM organization_application_transitions WHERE actor_user_id IN ($1,$2)', [platformAdminId,legacyOrganizationAdminId]);
  await database.query('UPDATE organization_applications SET reviewed_by_user_id=NULL WHERE reviewed_by_user_id IN ($1,$2)', [platformAdminId,legacyOrganizationAdminId]);
  await database.query('DELETE FROM organization_commercial_agreements WHERE created_by_user_id IN ($1,$2)', [platformAdminId,legacyOrganizationAdminId]);
  await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=$1)', [legacyOrganizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1', [legacyOrganizationId]);
  await database.query('DELETE FROM organizations WHERE id=$1', [legacyOrganizationId]);
  await database.query('DELETE FROM platform_capability_availability WHERE updated_by_user_id IN ($1,$2)', [platformAdminId,legacyOrganizationAdminId]);
  await database.query('DELETE FROM users WHERE id IN ($1,$2)', [platformAdminId,legacyOrganizationAdminId]);
  await database.query('DELETE FROM users WHERE id=$1', [assistAgentId]);
  await database.query('DELETE FROM commercial_subscriptions WHERE organization_id IN ($1,$2)', [directoryOrganizationA,directoryOrganizationB]);
  await database.query('DELETE FROM organizations WHERE id IN ($1,$2)', [directoryOrganizationA,directoryOrganizationB]);
  await database.query('DELETE FROM organization_setup_progress WHERE organization_id=$1',[setupOrganizationId]);
  await database.query('DELETE FROM audit_logs WHERE organization_id=$1 OR actor_user_id=$2',[setupOrganizationId,setupOwnerId]);
  await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=$1)',[setupOrganizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1',[setupOrganizationId]);
  await database.query('DELETE FROM tickets WHERE organization_id=$1',[setupOrganizationId]);
  await database.query('DELETE FROM organizations WHERE id=$1',[setupOrganizationId]);
  await database.query('DELETE FROM users WHERE id=$1',[setupOwnerId]);
  await database.onModuleDestroy();
});

describe('public accounts and organization applications', () => {
  it('keeps legacy credentials compatible while public accounts authenticate through additive identities', async () => {
    const legacyEmail = `legacy-application-auth-${fixtureId}@jupiter.test`;
    createdEmails.push(legacyEmail);
    await database.query('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3)', [legacyEmail,'Legacy Application User',await hashPassword('safe-password-123')]);
    const auth = new AuthService(database, { signAsync: async () => 'access-token' } as never);
    await expect(auth.login(legacyEmail, 'safe-password-123')).resolves.toMatchObject({ accessToken: 'access-token' });

    const created = await account('identity');
    expect(created.response).not.toHaveProperty('token');
    await expect(auth.login(created.email, 'safe-password-123')).resolves.toMatchObject({ user: { email: created.email } });
    const stored = (await database.query<{password_hash:string|null;identity_hash:string;token_hash:string;metadata:Record<string,unknown>}>(
      `SELECT u.password_hash,i.password_hash AS identity_hash,t.token_hash,a.metadata
       FROM users u JOIN authentication_identities i ON i.user_id=u.id
       JOIN public_account_verification_tokens t ON t.user_id=u.id
       JOIN audit_logs a ON a.actor_user_id=u.id AND a.action='public_account.created'
       WHERE u.email=$1`, [created.email],
    )).rows[0];
    expect(stored.password_hash).toBeNull();
    expect(stored.identity_hash).not.toContain('safe-password-123');
    expect(stored.token_hash).not.toContain(delivery.notifications.at(-1)!.token);
    expect(JSON.stringify(stored.metadata)).not.toContain(delivery.notifications.at(-1)!.token);
  });

  it('requires verification before submit, blocks token replay, and records idempotent application transitions', async () => {
    const applicant = await account('submit');
    await expect(applications.publicAccountStatus(applicant.id)).resolves.toMatchObject({
      email: applicant.email,
      emailVerified: false,
      verificationDeliveryStatus: 'DELIVERED',
    });
    const draft = await applications.createApplication(applicant.id, { organizationName: 'سازمان آزمایشی', preferredSlug: 'application-submit', contactName: 'متقاضی آزمون', contactPhone: '02112345678', details: { industry: 'technology' } }, uuid('31'));
    await expect(applications.updateApplication(applicant.id,draft.id,{ organizationName: 'سازمان آزمایشی به‌روز', preferredSlug: 'application-submit', contactName: 'متقاضی آزمون', details: { industry: 'technology', size: 'small' } },uuid('311'))).resolves.toMatchObject({ organizationName: 'سازمان آزمایشی به‌روز', status: 'DRAFT' });
    await expect(database.query("UPDATE organization_applications SET status='NEEDS_INFO' WHERE id=$1", [draft.id])).rejects.toThrow();
    await expect(applications.submitApplication(applicant.id,draft.id,uuid('32'))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(applications.verifyEmail(applicant.token)).resolves.toEqual({ verified: true });
    await expect(applications.publicAccountStatus(applicant.id)).resolves.toMatchObject({ emailVerified: true });
    await expect(applications.verifyEmail(applicant.token)).rejects.toBeInstanceOf(BadRequestException);
    const submitted = await applications.submitApplication(applicant.id,draft.id,uuid('33'));
    expect(submitted.status).toBe('SUBMITTED');
    await expect(applications.submitApplication(applicant.id,draft.id,uuid('33'))).resolves.toMatchObject({ status: 'SUBMITTED' });
    const transitions = await database.query<{to_status:string}>('SELECT to_status FROM organization_application_transitions WHERE application_id=$1 ORDER BY created_at', [draft.id]);
    expect(transitions.rows.map((row) => row.to_status)).toEqual(['DRAFT','DRAFT','SUBMITTED']);
    await expect(applications.cancelApplication(applicant.id,draft.id,uuid('34'))).resolves.toMatchObject({ status: 'CANCELLED' });
  });

  it('does not expose another applicant application and represents a no-email directory principal under tenant RLS', async () => {
    const first = await account('owner');
    const second = await account('other');
    const draft = await applications.createApplication(first.id, { organizationName: 'مالک اول', contactName: 'مالک اول' }, uuid('35'));
    await expect(applications.submitApplication(second.id,draft.id,uuid('36'))).rejects.toBeInstanceOf(NotFoundException);
    expect(await applications.listApplications(second.id)).toEqual([]);

    const externalObjectId = `S-1-5-21-no-email-${fixtureId}`;
    await database.withOrganization(directoryOrganizationA, async (client) => {
      await client.query(`INSERT INTO directory_principals(organization_id,external_object_id,account_name,email,display_name)
        VALUES($1,$2,$3,NULL,$4)`, [directoryOrganizationA,externalObjectId,'directory.user','Directory User']);
      const principal = (await client.query<{email:string|null;status:string}>('SELECT email,status FROM directory_principals WHERE external_object_id=$1', [externalObjectId])).rows[0];
      expect(principal).toEqual({ email: null, status: 'PENDING_ACTIVATION' });
    });
    const otherTenantRows = await database.withOrganization(directoryOrganizationB, (client) => client.query('SELECT id FROM directory_principals WHERE external_object_id=$1', [externalObjectId]));
    expect(otherTenantRows.rows).toEqual([]);
  });

  it('limits review to Platform Admin, provisions a setup tenant atomically, and never promotes an existing administrator', async () => {
    const applicant = await account('approval');
    const draft = await applications.createApplication(applicant.id, { organizationName: 'سازمان تأیید', preferredSlug: 'application-preferred', contactName: 'متقاضی تأیید' }, uuid('41'));
    await applications.verifyEmail(applicant.token);
    await applications.submitApplication(applicant.id,draft.id,uuid('42'));
    await expect(applications.startReview(applicant.id,draft.id,uuid('43'))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(applications.startReview(platformAdminId,draft.id,uuid('43'))).resolves.toMatchObject({status:'UNDER_REVIEW'});
    await expect(applications.requestInformation(platformAdminId,draft.id,'لطفاً شماره ثبت را تکمیل کنید.',uuid('44'))).resolves.toMatchObject({status:'NEEDS_INFORMATION',reviewNote:'لطفاً شماره ثبت را تکمیل کنید.'});
    await applications.updateApplication(applicant.id,draft.id,{ organizationName:'سازمان تأیید', preferredSlug:'application-preferred', contactName:'متقاضی تأیید', details:{ registration:'123' } },uuid('45'));
    await applications.submitApplication(applicant.id,draft.id,uuid('46'));
    await applications.startReview(platformAdminId,draft.id,uuid('47'));
    await expect(applications.approveApplication(platformAdminId,draft.id,'directory-principal-a',uuid('48'))).rejects.toBeInstanceOf(ConflictException);
    const approvedSlug = `approved-${fixtureId}`; provisionedSlugs.push(approvedSlug);
    const approved = await applications.approveApplication(platformAdminId,draft.id,approvedSlug,uuid('49'),'تأیید شد.');
    expect(approved).toMatchObject({status:'APPROVED',assignedSlug:approvedSlug,organizationStatus:'setup'});
    await expect(applications.approveApplication(platformAdminId,draft.id,approvedSlug,uuid('49'),'تأیید شد.')).resolves.toMatchObject({status:'APPROVED',assignedSlug:approvedSlug});
    const provisioned = (await database.query<{status:string;roles:string[]}>(
      `SELECT organization.status,array_agg(role.code ORDER BY role.code) AS roles
       FROM organizations organization JOIN memberships membership ON membership.organization_id=organization.id
       JOIN membership_roles membership_role ON membership_role.membership_id=membership.id
       JOIN roles role ON role.id=membership_role.role_id
       WHERE organization.slug=$1 AND membership.user_id=$2 GROUP BY organization.status`, [approvedSlug,applicant.id],
    )).rows[0];
    expect(provisioned).toEqual({status:'setup',roles:['ORG_ADMIN','ORG_OWNER']});
    const legacyRoles = (await database.query<{roles:string[]}>(
      `SELECT array_agg(role.code ORDER BY role.code) AS roles FROM memberships membership
       JOIN membership_roles membership_role ON membership_role.membership_id=membership.id
       JOIN roles role ON role.id=membership_role.role_id
       WHERE membership.organization_id=$1 AND membership.user_id=$2`, [legacyOrganizationId,legacyOrganizationAdminId],
    )).rows[0];
    expect(legacyRoles.roles).toEqual(['ORG_ADMIN']);
    expect(await applications.platformApplications(platformAdminId,'APPROVED')).toEqual(expect.arrayContaining([expect.objectContaining({id:draft.id,status:'APPROVED',assignedSlug:approvedSlug})]));
  });

  it('resolves a canonical tenant only for a member, assigns legacy owners explicitly, and activates a prepared setup tenant', async () => {
    await expect(organizations.tenantContext(legacyOrganizationAdminId,'legacy-ownerless-application')).resolves.toMatchObject({organization_id:legacyOrganizationId,organization_slug:'legacy-ownerless-application',role_codes:['ORG_ADMIN']});
    await expect(organizations.tenantContext(legacyOrganizationAdminId,`setup-${fixtureId}`)).rejects.toBeInstanceOf(NotFoundException);
    expect(await organizations.platformOwners(platformAdminId,legacyOrganizationId)).toEqual([]);
    await expect(organizations.assignPlatformOwner(platformAdminId,legacyOrganizationId,legacyOrganizationAdminId)).resolves.toMatchObject({userId:legacyOrganizationAdminId});
    await expect(organizations.platformOwners(platformAdminId,legacyOrganizationId)).resolves.toEqual([expect.objectContaining({user_id:legacyOrganizationAdminId})]);
    const ownerActor={userId:setupOwnerId,organizationId:setupOrganizationId,roles:['ORG_ADMIN','ORG_OWNER']};
    await expect(organizations.completeTenantSetup(ownerActor)).rejects.toBeInstanceOf(BadRequestException);
    await database.withOrganization(setupOrganizationId,async client=>{await client.query('INSERT INTO organization_settings(organization_id) VALUES($1)',[setupOrganizationId]);await client.query('INSERT INTO categories(organization_id,code,name) VALUES($1,$2,$3)',[setupOrganizationId,'GENERAL','عمومی']);});
    await expect(organizations.completeTenantSetup(ownerActor)).resolves.toEqual({status:'active'});
    await expect(organizations.tenantSetup(ownerActor)).resolves.toMatchObject({status:'active',settingsReady:true,categories:1});
  });

  it('lets an owner preview and idempotently import CSV members without exposing passwords', async () => {
    const email = `csv-member-${fixtureId}@jupiter.test`;
    createdEmails.push(email);
    const actor = { userId: setupOwnerId, organizationId: setupOrganizationId, roles: ['ORG_OWNER'] };
    const rows = [{ email, displayName: 'عضو CSV', username: `csv-${fixtureId}`, password: 'safe-password-123', roles: ['REQUESTER'] }];
    const preview = await organizations.previewMemberImport(actor, rows);
    expect(preview).toMatchObject({ valid: true, rows: [expect.objectContaining({ email, action: 'CREATE_OR_UPDATE', errors: [] })] });
    expect(JSON.stringify(preview)).not.toContain('safe-password-123');
    const key = uuid('351');
    const confirmed = await organizations.confirmMemberImport(actor, rows, key);
    expect(confirmed).toMatchObject({ created: 1, updated: 0, rows: [{ email, status: 'CREATED' }] });
    await expect(organizations.confirmMemberImport(actor, rows, key)).resolves.toEqual(confirmed);
    const membership = await database.withOrganization(setupOrganizationId, (client) => client.query<{email:string;roles:string[]}>(
      `SELECT u.email,array_agg(r.code ORDER BY r.code) AS roles FROM memberships m
       JOIN users u ON u.id=m.user_id JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id
       WHERE u.email=$1 GROUP BY u.email`, [email],
    ));
    expect(membership.rows).toEqual([{ email, roles: ['REQUESTER'] }]);
    const otherTenant = await database.withOrganization(directoryOrganizationA, (client) => client.query('SELECT id FROM memberships WHERE user_id=(SELECT id FROM users WHERE email=$1)', [email]));
    expect(otherTenant.rows).toEqual([]);
    const invalidRows = [...rows, { ...rows[0], displayName: 'تکراری' }];
    await expect(organizations.previewMemberImport(actor, invalidRows)).resolves.toMatchObject({ valid: false });
    await expect(organizations.confirmMemberImport(actor, invalidRows, uuid('352'))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('binds directory pairing to one tenant, consumes it once, and revokes the device identity', async () => {
    const actor = { userId: setupOwnerId, organizationId: setupOrganizationId, roles: ['ORG_OWNER'] };
    const connector = await connectors.create(actor, 'اتصال دفتر مرکزی');
    await expect(connectors.create({ ...actor, roles: ['REQUESTER'] }, 'بدون مجوز')).rejects.toBeInstanceOf(ForbiddenException);
    const pairing = await connectors.createPairing(actor, connector.id);
    expect(pairing.pairingCode).toHaveLength(43);
    const storedPairing = (await database.withOrganization(setupOrganizationId, client => client.query<{pairing_hash:string}>('SELECT pairing_hash FROM directory_connector_pairings WHERE connector_id=$1',[connector.id]))).rows[0];
    expect(storedPairing.pairing_hash).not.toContain(pairing.pairingCode);
    const paired = await connectors.pair(pairing.pairingCode, 'Jupiter AD Connector');
    expect(paired).toMatchObject({ connectorId: connector.id, organizationId: setupOrganizationId });
    expect(paired.deviceToken).toHaveLength(43);
    await expect(connectors.pair(pairing.pairingCode, 'Jupiter AD Connector')).rejects.toBeInstanceOf(BadRequestException);
    expect(await connectors.list({ ...actor, organizationId: directoryOrganizationA })).toEqual([]);
    const expiring = await connectors.createPairing(actor, connector.id);
    await database.withOrganization(setupOrganizationId, client => client.query('UPDATE directory_connector_pairings SET created_at=now()-interval \'16 minutes\',expires_at=now()-interval \'1 second\' WHERE pairing_hash=$1',[createHash('sha256').update(expiring.pairingCode).digest('hex')]));
    await expect(connectors.pair(expiring.pairingCode, 'Expired Connector')).rejects.toBeInstanceOf(BadRequestException);
    const revocable = await connectors.createPairing(actor, connector.id);
    await expect(connectors.revoke(actor, connector.id)).resolves.toEqual({ status: 'REVOKED' });
    await expect(connectors.pair(revocable.pairingCode, 'Revoked Connector')).rejects.toBeInstanceOf(BadRequestException);
    const storedConnector = (await database.withOrganization(setupOrganizationId, client => client.query<{status:string;device_token_hash:string|null}>('SELECT status,device_token_hash FROM directory_connectors WHERE id=$1',[connector.id]))).rows[0];
    expect(storedConnector).toEqual({ status: 'REVOKED', device_token_hash: null });
    const audits = await database.withOrganization(setupOrganizationId, client => client.query<{metadata:Record<string,unknown>}>('SELECT metadata FROM audit_logs WHERE target_id=$1',[connector.id]));
    expect(JSON.stringify(audits.rows)).not.toContain(pairing.pairingCode);
    expect(JSON.stringify(audits.rows)).not.toContain(paired.deviceToken);
  });

  it('previews and applies a tenant-bound directory lifecycle with rotating device credentials', async () => {
    const actor = { userId: setupOwnerId, organizationId: setupOrganizationId, roles: ['ORG_OWNER'] };
    const connector = await connectors.create(actor, 'همگام‌سازی آزمایشی');
    const paired = await connectors.pair((await connectors.createPairing(actor, connector.id)).pairingCode, 'Lifecycle Connector');
    const heartbeat = await connectors.heartbeat(connector.id, paired.deviceId, paired.deviceToken, '1.0.0');
    expect(heartbeat.deviceToken).not.toBe(paired.deviceToken);
    const externalObjectId = randomUUID();
    const preview = await connectors.preview(connector.id, paired.deviceId, heartbeat.deviceToken, {
      requestId: randomUUID(), kind: 'FULL', scopeFingerprint: 'pns-jupiter-ou-v1', connectorVersion: '1.0.0',
      entries: [{ externalObjectId, accountName: 'directory-user', displayName: 'کاربر دایرکتوری', enabled: true, roles: ['REQUESTER'] }],
    }) as { runId:string; deviceToken:string; status:string; summary:{create:number} };
    expect(preview).toMatchObject({ status: 'PREVIEWED', summary: { create: 1 } });
    const applied = await connectors.apply(connector.id, paired.deviceId, preview.deviceToken, preview.runId);
    expect(applied).toMatchObject({ status: 'APPLIED', summary: { create: 1 } });
    await expect(connectors.heartbeat(connector.id, paired.deviceId, paired.deviceToken, '1.0.0')).rejects.toBeInstanceOf(UnauthorizedException);
    const principal = await database.withOrganization(setupOrganizationId, client => client.query<{email:string|null;status:string;roles:string[]}>(
      `SELECT u.email,dp.status,array_agg(r.code ORDER BY r.code) AS roles FROM directory_principals dp
       JOIN users u ON u.id=dp.user_id JOIN memberships m ON m.user_id=u.id AND m.organization_id=dp.organization_id
       JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id
       WHERE dp.external_object_id=$1 GROUP BY u.email,dp.status`, [externalObjectId],
    ));
    expect(principal.rows).toEqual([{ email: null, status: 'ACTIVE', roles: ['REQUESTER'] }]);
    expect(await connectors.runs(actor, connector.id)).toEqual([expect.objectContaining({ id: preview.runId, status: 'APPLIED' })]);
  });

  it('keeps the commercial core platform-managed and preserves tenant isolation without billing provider operations', async () => {
    commercialProductCode = `COMM_${fixtureId.toUpperCase()}`;
    await expect(commercial.products(legacyOrganizationAdminId)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(commercial.saveProduct(platformAdminId, { code: commercialProductCode, name: 'بستهٔ آزمایشی', status: 'DRAFT' })).resolves.toEqual(expect.objectContaining({ id: expect.any(String) }));
    expect(await commercial.products(platformAdminId)).toEqual(expect.arrayContaining([expect.objectContaining({ code: commercialProductCode, name: 'بستهٔ آزمایشی', status: 'DRAFT' })]));
    await expect(commercial.saveAgreement(platformAdminId, { organizationId: setupOrganizationId, agreementReference: `AGR-${fixtureId}`, status: 'ACTIVE', startsAt: '2026-08-01' })).resolves.toEqual(expect.objectContaining({ id: expect.any(String) }));
    expect(await commercial.agreements(platformAdminId)).toEqual(expect.arrayContaining([expect.objectContaining({ organization_id: setupOrganizationId, status: 'ACTIVE' })]));
    const ledgerBefore = await database.withOrganization(directoryOrganizationA, client => client.query('SELECT id FROM commercial_usage_ledger'));
    await commercial.saveAvailability(platformAdminId, { capabilityCode: 'SMART_ACTION_TEST', isAvailable: true });
    await commercial.saveFeatureSetting(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', enabled: true });
    const ownSettings = await database.withOrganization(directoryOrganizationA, client => client.query<{enabled:boolean}>('SELECT enabled FROM organization_feature_settings WHERE capability_code=$1', ['SMART_ACTION_TEST']));
    const otherSettings = await database.withOrganization(directoryOrganizationB, client => client.query('SELECT enabled FROM organization_feature_settings WHERE capability_code=$1', ['SMART_ACTION_TEST']));
    const ledgerAfter = await database.withOrganization(directoryOrganizationA, client => client.query('SELECT id FROM commercial_usage_ledger'));
    expect(ownSettings.rows).toEqual([{ enabled: true }]);
    expect(otherSettings.rows).toEqual([]);
    expect(ledgerAfter.rows).toEqual(ledgerBefore.rows);
  });

  it('resolves a capability only when active entitlement, organization setting and platform availability all allow it', async () => {
    const actor = { userId: legacyOrganizationAdminId, organizationId: directoryOrganizationA, roles: ['ORG_ADMIN'] };
    await commercial.saveEntitlement(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', status: 'ACTIVE', startsAt: '2020-01-01', productId: null });
    await commercial.saveFeatureSetting(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', enabled: true });
    await commercial.saveAvailability(platformAdminId, { capabilityCode: 'SMART_ACTION_TEST', isAvailable: false });
    await expect(commercial.requireEffective(actor, 'SMART_ACTION_TEST')).rejects.toBeInstanceOf(ForbiddenException);
    await commercial.saveAvailability(platformAdminId, { capabilityCode: 'SMART_ACTION_TEST', isAvailable: true });
    await expect(commercial.requireEffective(actor, 'SMART_ACTION_TEST')).resolves.toMatchObject({ effective: true, checks: { entitlement: true, organizationSetting: true, platformAvailability: true } });
    await commercial.saveFeatureSetting(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', enabled: false });
    await expect(commercial.requireEffective(actor, 'SMART_ACTION_TEST')).rejects.toBeInstanceOf(ForbiddenException);
    await commercial.saveFeatureSetting(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', enabled: true });
    await commercial.saveEntitlement(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', status: 'SUSPENDED', startsAt: '2020-01-01', productId: null });
    await expect(commercial.requireEffective(actor, 'SMART_ACTION_TEST')).rejects.toBeInstanceOf(ForbiddenException);
    await commercial.saveEntitlement(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', status: 'ACTIVE', startsAt: '2020-01-01', endsAt: '2020-01-02', productId: null });
    await expect(commercial.requireEffective(actor, 'SMART_ACTION_TEST')).rejects.toBeInstanceOf(ForbiddenException);
    await commercial.saveEntitlement(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', status: 'ACTIVE', startsAt: '2020-01-01', productId: null });
    expect(await commercial.effectiveCapabilities(actor)).toEqual(expect.arrayContaining([expect.objectContaining({ capabilityCode: 'SMART_ACTION_TEST', effective: true })]));
    expect(await commercial.resolve(directoryOrganizationB, 'SMART_ACTION_TEST')).toMatchObject({ effective: false, checks: { entitlement: false, organizationSetting: false, platformAvailability: true } });
  });

  it('allocates allowances and add-on packs idempotently without allowing provider work to consume or mutate the ledger', async () => {
    addonPackageCode = `ADDON_${fixtureId.toUpperCase()}`;
    await expect(commercial.saveAddonPackage(legacyOrganizationAdminId, { code: addonPackageCode, name: 'بستهٔ آزمون', capabilityCode: 'SMART_ACTION_TEST', unitCount: 50, status: 'ACTIVE' })).rejects.toBeInstanceOf(ForbiddenException);
    const packageRecord = await commercial.saveAddonPackage(platformAdminId, { code: addonPackageCode, name: 'بستهٔ آزمون', capabilityCode: 'SMART_ACTION_TEST', unitCount: 50, status: 'ACTIVE' });
    const allowanceKey = randomUUID();
    const allowance = await commercial.allocateAllowance(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', periodStartsAt: '2026-01-01', periodEndsAt: '2027-01-01', grantedUnits: 250, idempotencyKey: allowanceKey });
    await expect(commercial.allocateAllowance(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', periodStartsAt: '2026-01-01', periodEndsAt: '2027-01-01', grantedUnits: 250, idempotencyKey: allowanceKey })).resolves.toEqual({ id: allowance.id, idempotent: true });
    const addonKey = randomUUID();
    const allocation = await commercial.allocateAddon(platformAdminId, { organizationId: directoryOrganizationA, addonPackageId: packageRecord.id, grantedUnits: 50, idempotencyKey: addonKey });
    await expect(commercial.allocateAddon(platformAdminId, { organizationId: directoryOrganizationA, addonPackageId: packageRecord.id, grantedUnits: 50, idempotencyKey: addonKey })).resolves.toEqual({ id: allocation.id, idempotent: true });
    const actor = { userId: legacyOrganizationAdminId, organizationId: directoryOrganizationA, roles: ['ORG_ADMIN'] };
    const state = await commercial.commercialState(actor);
    expect(state.allowances).toEqual(expect.arrayContaining([expect.objectContaining({ capability_code: 'SMART_ACTION_TEST', granted_units: 250 })]));
    expect(state.addons).toEqual(expect.arrayContaining([expect.objectContaining({ capability_code: 'SMART_ACTION_TEST', granted_units: 50 })]));
    expect(state.ledger.filter((entry: { event_type: string; capability_code:string }) => entry.capability_code === 'SMART_ACTION_TEST' && (entry.event_type === 'ALLOWANCE_ALLOCATED' || entry.event_type === 'ADDON_ALLOCATED'))).toHaveLength(2);
    await commercial.resolve(directoryOrganizationA, 'SMART_ACTION_TEST');
    const afterProviderLikeOperation = await commercial.commercialState(actor);
    expect(afterProviderLikeOperation.ledger.filter((entry: { event_type: string; capability_code:string }) => entry.capability_code === 'SMART_ACTION_TEST' && (entry.event_type === 'ALLOWANCE_ALLOCATED' || entry.event_type === 'ADDON_ALLOCATED'))).toHaveLength(2);
    await expect(database.query('UPDATE commercial_usage_ledger SET unit_count=999 WHERE organization_id=$1 AND idempotency_key=$2', [directoryOrganizationA, allowanceKey])).rejects.toThrow();
    await expect(database.withOrganization(directoryOrganizationA, client => client.query('DELETE FROM commercial_usage_ledger WHERE idempotency_key=$1', [allowanceKey]))).rejects.toThrow();
    const otherState = await commercial.commercialState({ ...actor, organizationId: directoryOrganizationB });
    expect(otherState.allowances).not.toEqual(expect.arrayContaining([expect.objectContaining({ capability_code: 'SMART_ACTION_TEST', granted_units: 250 })]));
  });

  it('reserves and settles a permitted Smart Action once, while a released action consumes no unit', async () => {
    const actor = { userId: legacyOrganizationAdminId, organizationId: directoryOrganizationA, roles: ['ORG_ADMIN'] };
    await commercial.saveAvailability(platformAdminId, { capabilityCode: 'SMART_ACTION_TEST', isAvailable: true });
    await commercial.saveFeatureSetting(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', enabled: true });
    await commercial.saveEntitlement(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: 'SMART_ACTION_TEST', status: 'ACTIVE', startsAt: '2020-01-01', productId: null });
    const settleKey = randomUUID();
    const reserved = await commercial.reserveSmartAction(actor, 'SMART_ACTION_TEST', settleKey);
    expect(reserved).toMatchObject({ status: 'RESERVED', reservation_source: 'PERIODIC', idempotent: false });
    const settled = await commercial.settleSmartAction(directoryOrganizationA, settleKey, randomUUID());
    await expect(commercial.settleSmartAction(directoryOrganizationA, settleKey, randomUUID())).resolves.toEqual({ id: settled.id, idempotent: true });
    const releasedKey = randomUUID();
    await commercial.reserveSmartAction(actor, 'SMART_ACTION_TEST', releasedKey);
    await expect(commercial.releaseSmartAction(directoryOrganizationA, releasedKey)).resolves.toEqual({ released: true });
    const ledger = await database.withOrganization(directoryOrganizationA, client => client.query<{event_type:string;unit_count:number}>('SELECT event_type,unit_count FROM commercial_usage_ledger WHERE idempotency_key=$1', [settleKey]));
    expect(ledger.rows).toEqual([{ event_type: 'SMART_ACTION_SETTLED', unit_count: -1 }]);
    const releasedLedger = await database.withOrganization(directoryOrganizationA, client => client.query('SELECT id FROM commercial_usage_ledger WHERE idempotency_key=$1', [releasedKey]));
    expect(releasedLedger.rows).toEqual([]);
    const concurrencyCapability = 'SMART_ACTION_CONCURRENCY';
    await commercial.saveAvailability(platformAdminId, { capabilityCode: concurrencyCapability, isAvailable: true });
    await commercial.saveFeatureSetting(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: concurrencyCapability, enabled: true });
    await commercial.saveEntitlement(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: concurrencyCapability, status: 'ACTIVE', startsAt: '2020-01-01', productId: null });
    await commercial.allocateAllowance(platformAdminId, { organizationId: directoryOrganizationA, capabilityCode: concurrencyCapability, periodStartsAt: '2026-01-01', periodEndsAt: '2027-01-01', grantedUnits: 1, idempotencyKey: randomUUID() });
    const concurrent = await Promise.allSettled([commercial.reserveSmartAction(actor, concurrencyCapability, randomUUID()), commercial.reserveSmartAction(actor, concurrencyCapability, randomUUID())]);
    expect(concurrent.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(concurrent.filter(result => result.status === 'rejected')).toHaveLength(1);
  });

  it('keeps Jupiter Assist access outside memberships and enforces scope, expiry and restricted-ticket grants', async () => {
    await expect(assist.saveAgent(legacyOrganizationAdminId, { userId: assistAgentId, status: 'ACTIVE' })).rejects.toBeInstanceOf(ForbiddenException);
    await assist.saveAgent(platformAdminId, { userId: assistAgentId, status: 'ACTIVE' });
    expect((await database.query('SELECT 1 FROM memberships WHERE user_id=$1', [assistAgentId])).rowCount).toBe(0);
    await expect(assist.savePolicy(legacyOrganizationAdminId, { organizationId: directoryOrganizationA, requestPolicy: 'USER_REQUEST_ALLOWED', defaultAccessScope: 'ROUTED_ONLY', capacityUnits: 5 })).rejects.toBeInstanceOf(ForbiddenException);
    await assist.savePolicy(platformAdminId, { organizationId: directoryOrganizationA, requestPolicy: 'USER_REQUEST_ALLOWED', defaultAccessScope: 'ROUTED_ONLY', capacityUnits: 5 });
    const normalTicket = (await database.query<{id:string}>('INSERT INTO tickets(organization_id,requester_user_id,title,description) VALUES($1,$2,$3,$4) RETURNING id', [directoryOrganizationA, platformAdminId, 'Normal assist ticket', 'Normal test ticket'])).rows[0].id;
    const restrictedTicket = (await database.query<{id:string}>('INSERT INTO tickets(organization_id,requester_user_id,title,description,is_restricted) VALUES($1,$2,$3,$4,true) RETURNING id', [directoryOrganizationA, platformAdminId, 'Restricted assist ticket', 'Restricted test ticket'])).rows[0].id;
    const full = await assist.createGrant(platformAdminId, { organizationId: directoryOrganizationA, supportAgentUserId: assistAgentId, scope: 'FULL_SUPPORT', expiresAt: new Date(Date.now() + 86_400_000).toISOString() });
    expect(await assist.canAccessTicket(assistAgentId, directoryOrganizationA, normalTicket)).toBe(true);
    expect(await assist.canAccessTicket(assistAgentId, directoryOrganizationA, restrictedTicket)).toBe(false);
    const restricted = await assist.createGrant(platformAdminId, { organizationId: directoryOrganizationA, supportAgentUserId: assistAgentId, scope: 'ROUTED_ONLY', ticketId: restrictedTicket, allowsRestricted: true, expiresAt: new Date(Date.now() + 86_400_000).toISOString() });
    expect(await assist.canAccessTicket(assistAgentId, directoryOrganizationA, restrictedTicket)).toBe(true);
    await assist.revokeGrant(platformAdminId, restricted.id);
    expect(await assist.canAccessTicket(assistAgentId, directoryOrganizationA, restrictedTicket)).toBe(false);
    const otherTicket = (await database.query<{id:string}>('INSERT INTO tickets(organization_id,requester_user_id,title,description) VALUES($1,$2,$3,$4) RETURNING id', [directoryOrganizationB, platformAdminId, 'Other assist ticket', 'Other test ticket'])).rows[0].id;
    expect(await assist.canAccessTicket(assistAgentId, directoryOrganizationB, otherTicket)).toBe(false);
    await database.query("INSERT INTO support_access_grants(organization_id,support_agent_user_id,scope,starts_at,expires_at,created_by_user_id) VALUES($1,$2,'FULL_SUPPORT',now()-interval '2 hours',now()-interval '1 hour',$3)", [directoryOrganizationB, assistAgentId, platformAdminId]);
    expect(await assist.canAccessTicket(assistAgentId, directoryOrganizationB, otherTicket)).toBe(false);
    await assist.revokeGrant(platformAdminId, full.id);
  });

  it('runs Assist independently of ticket status and settles capacity only on permitted acceptance', async () => {
    const actor={userId:setupOwnerId,organizationId:setupOrganizationId,roles:['ORG_OWNER','ORG_ADMIN']};
    await assist.saveAgent(platformAdminId,{userId:assistAgentId,status:'ACTIVE'});
    await assist.savePolicy(platformAdminId,{organizationId:setupOrganizationId,requestPolicy:'USER_REQUEST_ALLOWED',defaultAccessScope:'ROUTED_ONLY',capacityUnits:1});
    const ticket=(await database.query<{id:string;status:string}>('INSERT INTO tickets(organization_id,requester_user_id,title,description,status) VALUES($1,$2,$3,$4,\'OPEN\') RETURNING id,status',[setupOrganizationId,setupOwnerId,'Lifecycle assist ticket','Independent lifecycle ticket'])).rows[0];
    const requested=await assist.request(actor,ticket.id,'کمک لازم است');
    expect(requested.status).toBe('REQUESTED'); expect((await database.query<{status:string}>('SELECT status FROM tickets WHERE id=$1',[ticket.id])).rows[0].status).toBe('OPEN');
    await assist.approve(actor,requested.id);
    await assist.createGrant(platformAdminId,{organizationId:setupOrganizationId,supportAgentUserId:assistAgentId,scope:'ROUTED_ONLY',ticketId:ticket.id,expiresAt:new Date(Date.now()+86_400_000).toISOString()});
    await assist.accept(assistAgentId,requested.id);
    await expect(assist.accept(assistAgentId,requested.id)).rejects.toBeDefined();
    expect((await database.withOrganization(setupOrganizationId,c=>c.query<{capacity_units:number}>('SELECT capacity_units FROM organization_assist_policies'))).rows[0].capacity_units).toBe(0);
    await assist.agentState(assistAgentId,requested.id,'IN_PROGRESS'); await assist.agentState(assistAgentId,requested.id,'COMPLETED');
    expect((await database.query<{status:string}>('SELECT status FROM tickets WHERE id=$1',[ticket.id])).rows[0].status).toBe('OPEN');
  });

  it('shows the commercial dashboard only to the explicit organization owner', async () => {
    const owner={userId:setupOwnerId,organizationId:setupOrganizationId,roles:['ORG_OWNER','ORG_ADMIN']};
    await expect(commercial.ownerDashboard({userId:legacyOrganizationAdminId,organizationId:legacyOrganizationId,roles:['ORG_ADMIN']})).rejects.toBeInstanceOf(ForbiddenException);
    const dashboard=await commercial.ownerDashboard(owner);
    expect(dashboard.assist).toMatchObject({capacity_units:0,request_policy:'USER_REQUEST_ALLOWED'});
    expect(dashboard.ai).toHaveProperty('request_count');
  });

  it('enforces owner-only, capped overage reservations and idempotent commercial requests', async () => {
    const owner={userId:setupOwnerId,organizationId:setupOrganizationId,roles:['ORG_OWNER','ORG_ADMIN']};
    const admin={userId:legacyOrganizationAdminId,organizationId:legacyOrganizationId,roles:['ORG_ADMIN']};
    const capability=`OVERAGE_${fixtureId.toUpperCase()}`;
    await commercial.saveAvailability(platformAdminId,{capabilityCode:capability,isAvailable:true});
    await commercial.saveFeatureSetting(platformAdminId,{organizationId:setupOrganizationId,capabilityCode:capability,enabled:true});
    await commercial.saveEntitlement(platformAdminId,{organizationId:setupOrganizationId,capabilityCode:capability,status:'ACTIVE',startsAt:'2020-01-01',productId:null});
    await expect(commercial.saveOverage(admin,{capabilityCode:capability,enabled:true,limitUnits:1})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(commercial.createRequest(admin,{requestType:'ADDON',capabilityCode:capability,requestedUnits:1,idempotencyKey:randomUUID()})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(commercial.reserveSmartAction(owner,capability,randomUUID())).rejects.toBeInstanceOf(ForbiddenException);
    await commercial.saveOverage(owner,{capabilityCode:capability,enabled:true,limitUnits:1});
    const allowed=await commercial.reserveSmartAction(owner,capability,randomUUID());
    expect(allowed.reservation_source).toBe('OVERAGE');
    await expect(commercial.reserveSmartAction(owner,capability,randomUUID())).rejects.toBeInstanceOf(ForbiddenException);
    await commercial.releaseSmartAction(setupOrganizationId,(await database.withOrganization(setupOrganizationId,c=>c.query<{idempotency_key:string}>('SELECT idempotency_key FROM commercial_smart_actions WHERE id=$1',[allowed.id]))).rows[0].idempotency_key);
    const concurrent=await Promise.allSettled([commercial.reserveSmartAction(owner,capability,randomUUID()),commercial.reserveSmartAction(owner,capability,randomUUID())]);
    expect(concurrent.filter(x=>x.status==='fulfilled')).toHaveLength(1);
    const key=randomUUID(); const request=await commercial.createRequest(owner,{requestType:'ADDON',capabilityCode:capability,requestedUnits:2,idempotencyKey:key});
    await expect(commercial.createRequest(owner,{requestType:'ADDON',capabilityCode:capability,requestedUnits:2,idempotencyKey:key})).resolves.toEqual({id:request.id,idempotent:true});
    expect((await database.withOrganization(setupOrganizationId,c=>c.query('SELECT id FROM commercial_requests WHERE idempotency_key=$1',[key]))).rowCount).toBe(1);
    expect((await database.withOrganization(setupOrganizationId,c=>c.query("SELECT action FROM audit_logs WHERE target_id=$1",[request.id]))).rows).toEqual(expect.arrayContaining([expect.objectContaining({action:'COMMERCIAL_REQUEST_CREATED'})]));
    const packageRecord=await commercial.saveAddonPackage(platformAdminId,{code:`APPLY_${fixtureId.toUpperCase()}`,name:'بسته اعمال',capabilityCode:capability,unitCount:2,status:'ACTIVE'});
    await commercial.reviewRequest(platformAdminId,request.id,{organizationId:setupOrganizationId,decision:'APPROVED'});
    await expect(commercial.reviewRequest(platformAdminId,request.id,{organizationId:setupOrganizationId,decision:'APPROVED'})).resolves.toMatchObject({status:'APPROVED'});
    await commercial.applyRequest(platformAdminId,request.id,{organizationId:setupOrganizationId,addonPackageId:packageRecord.id});
    await expect(commercial.applyRequest(platformAdminId,request.id,{organizationId:setupOrganizationId,addonPackageId:packageRecord.id})).resolves.toMatchObject({idempotent:true});
    expect((await database.withOrganization(setupOrganizationId,c=>c.query('SELECT id FROM commercial_addon_allocations WHERE idempotency_key=$1',[request.id]))).rowCount).toBe(1);
    expect((await database.withOrganization(setupOrganizationId,c=>c.query("SELECT action FROM audit_logs WHERE target_id=$1",[request.id]))).rows).toEqual(expect.arrayContaining([expect.objectContaining({action:'COMMERCIAL_REQUEST_APPROVED'}),expect.objectContaining({action:'COMMERCIAL_REQUEST_APPLIED'})]));
    const product=await commercial.saveProduct(platformAdminId,{code:`RENEW_${fixtureId.toUpperCase()}`,name:'تمدید آزمایشی',status:'ACTIVE'});
    const foreignSubscription=(await database.withOrganization(directoryOrganizationB,c=>c.query<{id:string}>('INSERT INTO commercial_subscriptions(organization_id,product_id,status,starts_at,ends_at) VALUES($1,$2,\'ACTIVE\',now(),now()+interval \'1 day\') RETURNING id',[directoryOrganizationB,product.id]))).rows[0].id;
    await expect(commercial.createRequest(owner,{requestType:'RENEWAL',subscriptionId:foreignSubscription,idempotencyKey:randomUUID()})).rejects.toBeInstanceOf(NotFoundException);
    const malformed=(await database.withOrganization(setupOrganizationId,c=>c.query<{id:string}>('INSERT INTO commercial_requests(organization_id,request_type,status,subscription_id,idempotency_key,created_by_user_id) VALUES($1,\'RENEWAL\',\'APPROVED\',$2,$3,$4) RETURNING id',[setupOrganizationId,foreignSubscription,randomUUID(),setupOwnerId]))).rows[0].id;
    await expect(commercial.applyRequest(platformAdminId,malformed,{organizationId:setupOrganizationId,endsAt:'2030-01-01'})).rejects.toBeInstanceOf(NotFoundException);
    expect((await database.withOrganization(setupOrganizationId,c=>c.query<{status:string}>('SELECT status FROM commercial_requests WHERE id=$1',[malformed]))).rows[0].status).toBe('APPROVED');
  });

  it('applies the subscription lifecycle safely, including grace, expiry and tenant isolation', async () => {
    lifecycleProductCode = `LIFECYCLE_${fixtureId.toUpperCase()}`;
    const product = await commercial.saveProduct(platformAdminId, { code: lifecycleProductCode, name: 'اشتراک چرخهٔ عمر', status: 'ACTIVE' });
    const subscription = (await database.withOrganization(setupOrganizationId, client => client.query<{id:string}>("INSERT INTO commercial_subscriptions(organization_id,product_id,status,starts_at,ends_at) VALUES($1,$2,'TRIAL',now(),now()+interval '1 day') RETURNING id", [setupOrganizationId, product.id]))).rows[0];
    await expect(subscriptions.activate(platformAdminId, setupOrganizationId, subscription.id)).resolves.toMatchObject({ status: 'ACTIVE', idempotent: false });
    await expect(subscriptions.pastDue(platformAdminId, setupOrganizationId, subscription.id, 0)).resolves.toMatchObject({ status: 'PAST_DUE' });
    await expect(subscriptions.pastDue(platformAdminId, setupOrganizationId, subscription.id, 0)).resolves.toMatchObject({ status: 'PAST_DUE', idempotent: true });
    await expect(subscriptions.suspend(legacyOrganizationAdminId, setupOrganizationId, subscription.id, 'بدون مجوز')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(subscriptions.suspend(platformAdminId, directoryOrganizationA, subscription.id, 'سازمان نادرست')).rejects.toBeInstanceOf(NotFoundException);
    await database.withOrganization(setupOrganizationId, client => client.query("UPDATE commercial_subscriptions SET grace_ends_at=now()-interval '1 minute' WHERE id=$1", [subscription.id]));
    await expect(subscriptions.expireDue()).resolves.toMatchObject({ processed: expect.any(Number) });
    expect((await database.withOrganization(setupOrganizationId, client => client.query<{status:string}>('SELECT status FROM commercial_subscriptions WHERE id=$1', [subscription.id]))).rows[0].status).toBe('SUSPENDED');
    await expect(subscriptions.renew(platformAdminId, setupOrganizationId, subscription.id, '2030-01-01')).resolves.toMatchObject({ status: 'ACTIVE' });
    await expect(subscriptions.activate(platformAdminId, setupOrganizationId, subscription.id)).resolves.toMatchObject({ status: 'ACTIVE', idempotent: true });
    await expect(subscriptions.cancel(platformAdminId, setupOrganizationId, subscription.id, 'درخواست مشتری')).resolves.toMatchObject({ status: 'CANCELLED' });
    await expect(subscriptions.activate(platformAdminId, setupOrganizationId, subscription.id)).rejects.toBeInstanceOf(BadRequestException);
    expect((await database.withOrganization(setupOrganizationId, client => client.query<{action:string}>('SELECT action FROM audit_logs WHERE target_id=$1', [subscription.id]))).rows).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'SUBSCRIPTION_PAST_DUE' }), expect.objectContaining({ action: 'SUBSCRIPTION_SUSPENDED' }), expect.objectContaining({ action: 'SUBSCRIPTION_CANCELLED' })]));
  });

  it('keeps platform appearance preset-only, auditable and platform-admin controlled', async () => {
    const original = await appearance.current();
    await expect(appearance.save(legacyOrganizationAdminId, { brandPreset: 'OCEAN', densityPreset: 'COMPACT', radiusPreset: 'SMALL', logoUrl: '/jupiter-logo.png' })).rejects.toBeInstanceOf(ForbiddenException);
    const saved = await appearance.save(platformAdminId, { brandPreset: 'OCEAN', densityPreset: 'COMPACT', radiusPreset: 'SMALL', logoUrl: '/jupiter-logo.png' });
    expect(saved).toMatchObject({ brandPreset: 'OCEAN', densityPreset: 'COMPACT', radiusPreset: 'SMALL', logoUrl: '/jupiter-logo.png' });
    await expect(appearance.save(platformAdminId, { brandPreset: 'OCEAN', densityPreset: 'COMPACT', radiusPreset: 'SMALL', logoUrl: 'https://untrusted.example/logo.png' })).rejects.toBeDefined();
    await appearance.save(platformAdminId, original);
  });
});
