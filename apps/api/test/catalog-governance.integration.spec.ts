import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { OrganizationService } from '../src/organization/organization.service.js';
import { AttachmentStorage, StoredObject } from '../src/attachments/attachment-storage.js';
import { DatabaseService } from '../src/database/database.service.js';

class Storage implements AttachmentStorage {
  async createUploadUrl() { return 'https://storage.test/upload'; }
  async createDownloadUrl() { return 'https://storage.test/download'; }
  async createViewUrl() { return 'https://storage.test/view'; }
  async head(): Promise<StoredObject | undefined> { return undefined; }
  async read() { return new Uint8Array(); }
  async delete() {}
}

const database = new DatabaseService();
const organizations = new OrganizationService(database, new Storage());
let organizationId = ''; let otherOrganizationId = ''; let adminId = ''; let requesterId = '';
const actor = (userId:string, organizationId:string, roles:string[]) => ({userId,organizationId,roles});

beforeAll(async () => {
  organizationId=(await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) RETURNING id',['catalog-governance-test','Catalog Governance Test'])).rows[0].id;
  otherOrganizationId=(await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) RETURNING id',['catalog-governance-other','Catalog Governance Other'])).rows[0].id;
  const users=(await database.query<{id:string;email:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3),($4,$5,$3) RETURNING id,email',['catalog-governance-admin@jupiter.local','Catalog Admin','scrypt$AA$AA','catalog-governance-requester@jupiter.local','Catalog Requester'])).rows;
  adminId=users.find(user=>user.email==='catalog-governance-admin@jupiter.local')!.id; requesterId=users.find(user=>user.email==='catalog-governance-requester@jupiter.local')!.id;
  await database.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2),($1,$3)',[organizationId,adminId,requesterId]);
  await database.query("INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code=CASE m.user_id WHEN $2 THEN 'ORG_ADMIN' ELSE 'REQUESTER' END WHERE m.organization_id=$1 ON CONFLICT DO NOTHING",[organizationId,adminId]);
});

afterAll(async()=>{
  await database.query('DELETE FROM audit_logs WHERE organization_id IN($1,$2)',[organizationId,otherOrganizationId]);
  await database.query('DELETE FROM catalog_suggestions WHERE organization_id IN($1,$2)',[organizationId,otherOrganizationId]);
  await database.query('DELETE FROM organization_catalog_template_installs WHERE organization_id IN($1,$2)',[organizationId,otherOrganizationId]);
  await database.query('DELETE FROM subcategories WHERE organization_id IN($1,$2)',[organizationId,otherOrganizationId]);
  await database.query('DELETE FROM categories WHERE organization_id IN($1,$2)',[organizationId,otherOrganizationId]);
  await database.query('DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM memberships WHERE organization_id=$1)',[organizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1',[organizationId]);
  await database.query('DELETE FROM organizations WHERE id IN($1,$2)',[organizationId,otherOrganizationId]);
  await database.query('DELETE FROM users WHERE id IN($1,$2)',[adminId,requesterId]);
  await database.onModuleDestroy();
});

describe('catalog governance',()=>{
  it('installs the approved IT template idempotently and exposes readiness only to organization administrators',async()=>{
    await expect(organizations.catalogReadiness(actor(requesterId,organizationId,['REQUESTER']))).rejects.toBeInstanceOf(ForbiddenException);
    expect((await organizations.catalogReadiness(actor(adminId,organizationId,['ORG_ADMIN']))).aiReady).toBe(false);
    const installed=await organizations.installCatalogTemplate(actor(adminId,organizationId,['ORG_ADMIN']));
    expect(installed.categoryCount).toBe(9); expect(installed.subcategoryCount).toBeGreaterThan(20);
    await organizations.installCatalogTemplate(actor(adminId,organizationId,['ORG_ADMIN']));
    const readiness=await organizations.catalogReadiness(actor(adminId,organizationId,['ORG_ADMIN']));
    expect(readiness).toMatchObject({aiReady:true,template_installed:true,categories:9});
    expect((await organizations.catalog(actor(adminId,organizationId,['ORG_ADMIN']),'categories')).some(item=>item.name==='چاپ و اسناد')).toBe(true);
  });

  it('does not expose a pending catalog suggestion from another organization',async()=>{
    await database.query("INSERT INTO catalog_suggestions(organization_id,kind,name,source) VALUES($1,'category','دسته محرمانه','AI_INTAKE')",[otherOrganizationId]);
    const own=await organizations.catalogSuggestions(actor(adminId,organizationId,['ORG_ADMIN']));
    expect(own.find(item=>(item as {name:string}).name==='دسته محرمانه')).toBeUndefined();
  });
});
