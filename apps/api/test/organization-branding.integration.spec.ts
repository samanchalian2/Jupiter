import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrganizationService } from '../src/organization/organization.service.js';
import { AttachmentStorage, StoredObject } from '../src/attachments/attachment-storage.js';
import { DatabaseService } from '../src/database/database.service.js';

class FakeBrandStorage implements AttachmentStorage {
  readonly objects = new Map<string, StoredObject>();
  async createUploadUrl(key: string) { return `https://storage.test/upload/${key}`; }
  async createDownloadUrl(key: string) { return `https://storage.test/download/${key}`; }
  async createViewUrl(key: string) { return `https://storage.test/view/${key}`; }
  async head(key: string) { return this.objects.get(key); }
  async read() { return new Uint8Array(); }
  async delete(key: string) { this.objects.delete(key); }
}

const database = new DatabaseService();
const storage = new FakeBrandStorage();
const organizations = new OrganizationService(database, storage);
let organizationId = '';
let adminId = '';
let requesterId = '';
const actor = (userId: string, roles: string[]) => ({ userId, organizationId, roles });

beforeAll(async () => {
  organizationId = (await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id', ['branding-test', 'Branding Test'])).rows[0].id;
  const users = await database.query<{id:string;email:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3),($4,$5,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id,email', ['branding-admin@jupiter.local', 'Branding Admin', 'scrypt$AA$AA', 'branding-requester@jupiter.local', 'Branding Requester']);
  adminId = users.rows.find((user) => user.email === 'branding-admin@jupiter.local')!.id;
  requesterId = users.rows.find((user) => user.email === 'branding-requester@jupiter.local')!.id;
  await database.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2),($1,$3) ON CONFLICT DO NOTHING', [organizationId, adminId, requesterId]);
  await database.query("INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code=CASE m.user_id WHEN $2 THEN 'ORG_ADMIN' ELSE 'REQUESTER' END WHERE m.organization_id=$1 AND m.user_id IN($2,$3) ON CONFLICT DO NOTHING", [organizationId, adminId, requesterId]);
});

afterAll(async () => {
  await database.query('DELETE FROM audit_logs WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM organization_ai_settings WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=$1)', [organizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM organization_settings WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM organizations WHERE id=$1', [organizationId]);
  await database.query('DELETE FROM users WHERE email IN($1,$2)', ['branding-admin@jupiter.local', 'branding-requester@jupiter.local']);
  await database.onModuleDestroy();
});

describe('Organization branding', () => {
  it('lets only the organization administrator enable smart intake after platform AI configuration', async () => {
    const admin=actor(adminId,['ORG_ADMIN']);
    const initial=await organizations.settings(admin) as {smart_intake_available:boolean;smart_intake_enabled:boolean};
    expect(initial.smart_intake_available).toBe(false); expect(initial.smart_intake_enabled).toBe(false);
    await expect(organizations.saveSettings(admin,{closurePolicy:'STAFF_ONLY',reopenWindowDays:7,businessTimezone:'Asia/Tehran',smartIntakeEnabled:true})).rejects.toBeInstanceOf(BadRequestException);
    await database.query(`INSERT INTO organization_ai_settings(organization_id,enabled,smart_intake_enabled,model,analysis_model,transcription_model,provider_base_url,api_key_ciphertext,api_key_iv,api_key_auth_tag)
      VALUES($1,true,false,'analysis-test','analysis-test','transcription-test','https://ai.test/v1',$2,$3,$4)`,[organizationId,Buffer.from('cipher'),Buffer.from('iv'),Buffer.from('tag')]);
    const enabled=await organizations.saveSettings(admin,{closurePolicy:'STAFF_ONLY',reopenWindowDays:7,businessTimezone:'Asia/Tehran',smartIntakeEnabled:true}) as {smart_intake_available:boolean;smart_intake_enabled:boolean};
    expect(enabled).toMatchObject({smart_intake_available:true,smart_intake_enabled:true});
    await expect(organizations.saveSettings(actor(requesterId,['REQUESTER']),{closurePolicy:'STAFF_ONLY',reopenWindowDays:7,businessTimezone:'Asia/Tehran',smartIntakeEnabled:false})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows only organization administrators to complete a size- and media-validated logo upload', async () => {
    await expect(organizations.requestBrandingUpload(actor(adminId, ['ORG_ADMIN']), { filename: 'logo.svg', contentType: 'image/svg+xml', byteSize: 100 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(organizations.requestBrandingUpload(actor(requesterId, ['REQUESTER']), { filename: 'logo.png', contentType: 'image/png', byteSize: 100 })).rejects.toBeInstanceOf(ForbiddenException);
    const pending = await organizations.requestBrandingUpload(actor(adminId, ['ORG_ADMIN']), { filename: 'logo.png', contentType: 'image/png', byteSize: 100 });
    storage.objects.set(pending.storageKey, { contentType: 'image/png', contentLength: 100 });
    const completed = await organizations.completeBrandingUpload(actor(adminId, ['ORG_ADMIN']), { storageKey: pending.storageKey, contentType: 'image/png', byteSize: 100 });
    expect(completed.logo_url).toContain('/view/organizations/');
    expect((await organizations.branding(actor(requesterId, ['REQUESTER']))).logo_url).toContain('/view/organizations/');
  });
});
