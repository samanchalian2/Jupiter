import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { hashPassword } from '../auth/password.js';
import { AttachmentStorage } from '../attachments/attachment-storage.js';
import { createHash, randomUUID } from 'node:crypto';
import { OrganizationAccessPolicy } from './organization-access.policy.js';
import { OrganizationSetupService } from './organization-setup.service.js';

type Actor = { userId: string; organizationId: string; roles: string[] };
type MemberInput = { email: string; username?: string; displayName: string; password?: string; roles: string[] };
const catalogTables = new Set(['departments', 'locations', 'disciplines', 'categories']);
const suggestionKinds = new Set(['category','subcategory','department','location','discipline']);
const roleCodes = new Set(['ORG_ADMIN', 'SUPERVISOR', 'EXPERT', 'REQUESTER']);
const usernamePattern = /^[a-z0-9][a-z0-9._-]{1,62}$/;
const enterpriseItTemplate = [
  ['HARDWARE','سخت‌افزار و تجهیزات',['COMPUTER','لپ‌تاپ و رایانه'],['PERIPHERAL','تجهیزات جانبی']],
  ['PRINT','چاپ و اسناد',['PRINTER','پرینتر'],['SCANNER','اسکنر'],['PRINT-ERROR','خطاهای چاپ']],
  ['NETWORK','شبکه و ارتباطات',['WIRED','شبکه کابلی'],['WIFI','شبکه بی‌سیم'],['INTERNET','اینترنت و VPN']],
  ['SOFTWARE','نرم‌افزار و سامانه‌ها',['OS','سیستم‌عامل'],['BUSINESS-APP','سامانه‌های سازمانی'],['APP-INSTALL','نصب و به‌روزرسانی']],
  ['ACCESS','حساب و دسترسی',['PASSWORD','رمز عبور'],['PERMISSION','مجوز دسترسی'],['ONBOARDING','حساب کاربری جدید']],
  ['SECURITY','امنیت اطلاعات',['PHISHING','ایمیل مشکوک'],['MALWARE','بدافزار'],['SECURITY-ACCESS','دسترسی امنیتی']],
  ['MEETING','تجهیزات جلسات',['VIDEO','ویدئوکنفرانس'],['PROJECTOR','ویدئوپروژکتور'],['AUDIO','صوت جلسه']],
  ['TELEPHONY','تلفن و ارتباطات',['PHONE','تلفن سازمانی'],['MOBILE','ارتباطات همراه']],
  ['FACILITIES','خدمات و تأسیسات',['OFFICE','تجهیزات اداری'],['MAINTENANCE','نگهداری و تعمیرات']],
] as const;

@Injectable()
export class OrganizationService {
  constructor(private readonly database: DatabaseService, @Inject('AttachmentStorage') private readonly storage: AttachmentStorage, private readonly access: OrganizationAccessPolicy = new OrganizationAccessPolicy(), @Optional() private readonly setup?: OrganizationSetupService) {}

  private admin(actor: Actor) { this.access.operator(actor); }
  private memberAdmin(actor: Actor) { this.access.operator(actor); }
  private validRoles(roles: string[]) {
    const unique = [...new Set(roles ?? [])];
    if (!unique.length || unique.some((role) => !roleCodes.has(role))) throw new BadRequestException('Select at least one valid role.');
    return unique;
  }
  private username(value: string | undefined) {
    if (!value?.trim()) return undefined;
    const username = value.trim().toLowerCase();
    if (!usernamePattern.test(username)) throw new BadRequestException('نام کاربری باید با حروف کوچک انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.');
    return username;
  }
  private usernameConflict(cause: unknown): never {
    if (typeof cause === 'object' && cause && (cause as { code?: string; constraint?: string }).code === '23505' && (cause as { constraint?: string }).constraint === 'users_username_unique') throw new BadRequestException('نام کاربری قبلاً استفاده شده است.');
    throw cause;
  }
  private audit(client: { query(query: string, values?: unknown[]): Promise<unknown> }, actor: Actor, action: string, targetType: string, targetId: string, metadata: object = {}) {
    return client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5,$6)', [actor.organizationId, actor.userId, action, targetType, targetId, metadata]);
  }

  async members(actor: Actor) {
    this.memberAdmin(actor);
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query(
      `SELECT m.id,u.id AS user_id,u.email,u.username,u.display_name,m.status,m.created_at,
       array_remove(array_agg(r.code ORDER BY r.code),NULL) AS roles
       FROM memberships m JOIN users u ON u.id=m.user_id
       LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id
       GROUP BY m.id,u.id ORDER BY u.display_name`,
    )).rows);
  }

  async addMember(actor: Actor, input: MemberInput) {
    this.memberAdmin(actor);
    const roles = this.validRoles(input.roles);
    const password = input.password;
    const username = this.username(input.username);
    if (!/^\S+@\S+\.\S+$/.test(input.email ?? '') || !input.displayName?.trim() || !password || password.length < 10) throw new BadRequestException('Provide a valid email, name, and a temporary password of at least 10 characters.');
    try { return await this.database.withOrganization(actor.organizationId, async (client) => {
      const existing = (await client.query<{ id: string }>('SELECT id FROM users WHERE email=$1', [input.email.toLowerCase()])).rows[0];
      const user = existing ?? (await client.query<{id:string}>('INSERT INTO users(email,username,display_name,password_hash) VALUES($1,$2,$3,$4) RETURNING id', [input.email.toLowerCase(), username ?? null, input.displayName.trim(), await hashPassword(password)])).rows[0];
      if (existing) await client.query('UPDATE users SET display_name=$1,username=COALESCE($2,username),updated_at=now() WHERE id=$3', [input.displayName.trim(), username ?? null, user.id]);
      const member = (await client.query<{id:string}>('INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,\'active\') ON CONFLICT(organization_id,user_id) DO UPDATE SET status=\'active\' RETURNING id', [actor.organizationId,user.id])).rows[0];
      await this.replaceRoles(client, member.id, roles);
      await this.audit(client, actor, 'member.created', 'membership', member.id, { roles });
      return { id: member.id, userId: user.id };
    }); } catch (cause) { this.usernameConflict(cause); }
  }

  async updateMember(actor: Actor, membershipId: string, input: { displayName?: string; username?: string; roles?: string[]; status?: 'active' | 'inactive' }) {
    this.memberAdmin(actor);
    try { return await this.database.withOrganization(actor.organizationId, async (client) => {
      const member = (await client.query<{id:string;user_id:string;status:string}>('SELECT id,user_id,status FROM memberships WHERE id=$1', [membershipId])).rows[0];
      if (!member) throw new NotFoundException('Member not found.');
      if (member.user_id === actor.userId && input.status === 'inactive') throw new BadRequestException('You cannot deactivate your own membership.');
      const username = this.username(input.username);
      if (input.displayName?.trim() || username !== undefined) await client.query('UPDATE users SET display_name=COALESCE($1,display_name),username=COALESCE($2,username),updated_at=now() WHERE id=$3', [input.displayName?.trim() ?? null, username ?? null, member.user_id]);
      if (input.status) await client.query('UPDATE memberships SET status=$1 WHERE id=$2', [input.status, member.id]);
      const roles = input.roles ? this.validRoles(input.roles) : undefined;
      if (roles) await this.replaceRoles(client, member.id, roles);
      await this.audit(client, actor, 'member.updated', 'membership', member.id, { status: input.status, roles });
      return { id: member.id, status: input.status ?? member.status, roles };
    }); } catch (cause) { this.usernameConflict(cause); }
  }

  async resetMemberPassword(actor: Actor, membershipId: string, password: string) {
    this.memberAdmin(actor);
    if (!password || password.length < 10) throw new BadRequestException('Temporary password must be at least 10 characters.');
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const member = (await client.query<{user_id:string}>('SELECT user_id FROM memberships WHERE id=$1', [membershipId])).rows[0];
      if (!member) throw new NotFoundException('Member not found.');
      await client.query('UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2', [await hashPassword(password), member.user_id]);
      await client.query('UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [member.user_id]);
      await this.audit(client, actor, 'member.password_reset', 'membership', membershipId);
      return { ok: true };
    });
  }

  async catalog(actor: Actor, kind: string) { this.admin(actor); this.catalogKind(kind); return this.database.withOrganization(actor.organizationId, async c => (await c.query(`SELECT id,code,name FROM ${kind} ORDER BY name`)).rows); }
  async addCatalog(actor: Actor, kind: string, input: { code: string; name: string }) {
    this.admin(actor); this.catalogKind(kind);
    if (!/^[A-Za-z0-9_-]{2,64}$/.test(input.code ?? '') || !input.name?.trim()) throw new BadRequestException('Catalog code and name are required.');
    return this.database.withOrganization(actor.organizationId, async c => {
      const result = (await c.query(`INSERT INTO ${kind}(organization_id,code,name) VALUES($1,$2,$3) ON CONFLICT(organization_id,code) DO UPDATE SET name=EXCLUDED.name RETURNING id,code,name`,[actor.organizationId,input.code.trim(),input.name.trim()])).rows[0] as { id: string };
      await this.audit(c, actor, 'catalog.saved', kind, result.id, { code: input.code.trim() });
      return result;
    });
  }

  async catalogReadiness(actor: Actor) {
    this.admin(actor);
    return this.database.withOrganization(actor.organizationId, async c => {
      const counts = (await c.query<{categories:number;subcategories:number;departments:number;locations:number;disciplines:number;custom_fields:number;template_installed:boolean}>(`SELECT
        (SELECT count(*)::int FROM categories) categories,(SELECT count(*)::int FROM subcategories) subcategories,
        (SELECT count(*)::int FROM departments) departments,(SELECT count(*)::int FROM locations) locations,
        (SELECT count(*)::int FROM disciplines) disciplines,(SELECT count(*)::int FROM ticket_custom_field_definitions WHERE is_active=true) custom_fields,
        EXISTS(SELECT 1 FROM organization_catalog_template_installs WHERE template_code='it-enterprise') template_installed`)).rows[0];
      return { ...counts, aiReady: counts.categories > 0 && counts.subcategories > 0 };
    });
  }

  async catalogTemplate(actor: Actor) {
    this.admin(actor);
    return this.database.withOrganization(actor.organizationId, async c => ({
      code:'it-enterprise', name:'خدمات IT و پشتیبانی سازمانی',
      installed:Boolean((await c.query("SELECT 1 FROM organization_catalog_template_installs WHERE template_code='it-enterprise'")).rowCount),
      categories:enterpriseItTemplate.map(([code,name,...subcategories])=>({code,name,subcategories:subcategories.map(([subcode,subname])=>({code:subcode,name:subname}))})),
    }));
  }

  async installCatalogTemplate(actor: Actor) {
    this.admin(actor);
    return this.database.withOrganization(actor.organizationId, async c => {
      let subcategoryCount=0;
      for(const [code,name,...subcategories] of enterpriseItTemplate){
        const category=(await c.query<{id:string}>(`INSERT INTO categories(organization_id,code,name) VALUES($1,$2,$3) ON CONFLICT(organization_id,code) DO UPDATE SET name=EXCLUDED.name RETURNING id`,[actor.organizationId,code,name])).rows[0];
        for(const [subcode,subname] of subcategories){ await c.query(`INSERT INTO subcategories(organization_id,category_id,code,name) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id,code) DO UPDATE SET category_id=EXCLUDED.category_id,name=EXCLUDED.name`,[actor.organizationId,category.id,`${code}-${subcode}`,subname]); subcategoryCount+=1; }
      }
      await c.query(`INSERT INTO organization_catalog_template_installs(organization_id,template_code,installed_by_user_id) VALUES($1,'it-enterprise',$2) ON CONFLICT(organization_id,template_code) DO UPDATE SET installed_by_user_id=EXCLUDED.installed_by_user_id,installed_at=now()`,[actor.organizationId,actor.userId]);
      await this.audit(c,actor,'catalog.template_installed','organization',actor.organizationId,{templateCode:'it-enterprise',categoryCount:enterpriseItTemplate.length,subcategoryCount});
      return {templateCode:'it-enterprise',categoryCount:enterpriseItTemplate.length,subcategoryCount};
    });
  }

  async catalogSuggestions(actor: Actor) { this.admin(actor); return this.database.withOrganization(actor.organizationId,async c=>(await c.query(`SELECT id,kind,name,parent_category_id,status,source,confidence,created_at FROM catalog_suggestions WHERE status='PENDING' ORDER BY created_at DESC LIMIT 100`)).rows); }

  async titleLibrary(actor: Actor, status='PENDING') { this.admin(actor); if(!['PENDING','ACTIVE','DISABLED'].includes(status)) throw new BadRequestException('Invalid title status.'); return this.database.withOrganization(actor.organizationId,async c=>(await c.query('SELECT id,title,status,usage_count,created_at,reviewed_at FROM ticket_title_library WHERE status=$1 ORDER BY usage_count DESC,created_at DESC LIMIT 200',[status])).rows); }
  async reviewTitle(actor:Actor,id:string,decision:'ACTIVE'|'DISABLED') { this.admin(actor); if(!['ACTIVE','DISABLED'].includes(decision)) throw new BadRequestException('Invalid title decision.'); return this.database.withOrganization(actor.organizationId,async c=>{const row=(await c.query('UPDATE ticket_title_library SET status=$2,reviewed_by_user_id=$3,reviewed_at=now(),updated_at=now() WHERE id=$1 AND status=\'PENDING\' RETURNING id,title,status',[id,decision,actor.userId])).rows[0]; if(!row) throw new NotFoundException('Pending title not found.');await this.audit(c,actor,'title_library.reviewed','ticket_title',id,{decision});return row;}); }
  async tagVocabulary(actor:Actor,status='PENDING') { this.admin(actor); if(!['PENDING','ACTIVE','DISABLED'].includes(status)) throw new BadRequestException('Invalid tag status.'); return this.database.withOrganization(actor.organizationId,async c=>(await c.query('SELECT id,name,kind,status,usage_count FROM ticket_tags WHERE status=$1 ORDER BY usage_count DESC,name LIMIT 200',[status])).rows); }
  async reviewTag(actor:Actor,id:string,decision:'ACTIVE'|'DISABLED') { this.admin(actor); if(!['ACTIVE','DISABLED'].includes(decision)) throw new BadRequestException('Invalid tag decision.'); return this.database.withOrganization(actor.organizationId,async c=>{const row=(await c.query('UPDATE ticket_tags SET status=$2 WHERE id=$1 AND status=\'PENDING\' RETURNING id,name,kind,status',[id,decision])).rows[0]; if(!row) throw new NotFoundException('Pending tag not found.');await this.audit(c,actor,'ticket_tag.reviewed','ticket_tag',id,{decision});return row;}); }

  async reviewCatalogSuggestion(actor: Actor,id:string,input:{decision:'APPROVED'|'REJECTED';code?:string;name?:string;parentCategoryId?:string}) {
    this.admin(actor); if(!['APPROVED','REJECTED'].includes(input.decision)) throw new BadRequestException('Invalid catalog suggestion decision.');
    return this.database.withOrganization(actor.organizationId,async c=>{
      const suggestion=(await c.query<{id:string;kind:string;name:string;parent_category_id:string|null}>("SELECT id,kind,name,parent_category_id FROM catalog_suggestions WHERE id=$1 AND status='PENDING' FOR UPDATE",[id])).rows[0];
      if(!suggestion) throw new NotFoundException('Catalog suggestion not found.');
      if(input.decision==='APPROVED'){
        const code=input.code?.trim();const name=input.name?.trim()||suggestion.name;
        if(!/^[A-Za-z0-9_-]{2,64}$/.test(code??'')||!name) throw new BadRequestException('Catalog code and name are required to approve a suggestion.');
        if(suggestion.kind==='subcategory') { const parentCategoryId=input.parentCategoryId??suggestion.parent_category_id; if(!parentCategoryId || !(await c.query('SELECT 1 FROM categories WHERE id=$1',[parentCategoryId])).rowCount) throw new BadRequestException('A category is required for a subcategory suggestion.'); await c.query(`INSERT INTO subcategories(organization_id,category_id,code,name) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id,code) DO UPDATE SET category_id=EXCLUDED.category_id,name=EXCLUDED.name`,[actor.organizationId,parentCategoryId,code,name]); }
        else { const table=this.suggestionTable(suggestion.kind); await c.query(`INSERT INTO ${table}(organization_id,code,name) VALUES($1,$2,$3) ON CONFLICT(organization_id,code) DO UPDATE SET name=EXCLUDED.name`,[actor.organizationId,code,name]); }
      }
      const result=(await c.query(`UPDATE catalog_suggestions SET status=$2,reviewed_by_user_id=$3,reviewed_at=now() WHERE id=$1 RETURNING id,status`,[id,input.decision,actor.userId])).rows[0];
      await this.audit(c,actor,'catalog.suggestion_reviewed','catalog_suggestion',id,{decision:input.decision}); return result;
    });
  }

  async teams(actor: Actor) {
    this.admin(actor);
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query(
      `SELECT team.id,team.name,team.is_active,team.created_at,
       COALESCE(json_agg(json_build_object('user_id',user_row.id,'display_name',user_row.display_name) ORDER BY user_row.display_name) FILTER (WHERE user_row.id IS NOT NULL),'[]'::json) AS members
       FROM teams team LEFT JOIN team_memberships tm ON tm.team_id=team.id LEFT JOIN users user_row ON user_row.id=tm.user_id
       GROUP BY team.id ORDER BY team.name`,
    )).rows);
  }
  async saveTeam(actor: Actor, input: { id?: string; name: string; memberIds: string[]; isActive?: boolean }) {
    this.admin(actor);
    if (!input.name?.trim() || input.name.trim().length > 120) throw new BadRequestException('Team name is required.');
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const team = input.id
        ? (await client.query<{id:string}>('UPDATE teams SET name=$1,is_active=$2,updated_at=now() WHERE id=$3 RETURNING id', [input.name.trim(), input.isActive ?? true, input.id])).rows[0]
        : (await client.query<{id:string}>('INSERT INTO teams(organization_id,name,is_active) VALUES($1,$2,$3) RETURNING id', [actor.organizationId, input.name.trim(), input.isActive ?? true])).rows[0];
      if (!team) throw new NotFoundException('Team not found.');
      const memberIds = [...new Set(input.memberIds ?? [])];
      if (memberIds.length) {
        const valid = await client.query<{user_id:string}>('SELECT user_id FROM memberships WHERE status=\'active\' AND user_id=ANY($1::uuid[])', [memberIds]);
        if (valid.rowCount !== memberIds.length) throw new BadRequestException('Every team member must be active in this organization.');
      }
      await client.query('DELETE FROM team_memberships WHERE team_id=$1', [team.id]);
      if (memberIds.length) await client.query('INSERT INTO team_memberships(team_id,organization_id,user_id) SELECT $1,$2,unnest($3::uuid[])', [team.id, actor.organizationId, memberIds]);
      await this.audit(client, actor, 'team.saved', 'team', team.id, { memberCount: memberIds.length });
      return team;
    });
  }

  async settings(actor: Actor) {
    this.admin(actor);
    return this.database.withOrganization(actor.organizationId, async c => {
      const settings=(await c.query('SELECT closure_policy,reopen_window_days,business_timezone FROM organization_settings WHERE organization_id=$1',[actor.organizationId])).rows[0] ?? {closure_policy:'STAFF_ONLY',reopen_window_days:7,business_timezone:'Asia/Tehran'};
      const ai=(await c.query<{enabled:boolean;has_api_key:boolean;analysis_model:string|null;smart_intake_enabled:boolean}>(`SELECT enabled,api_key_ciphertext IS NOT NULL AS has_api_key,
        COALESCE(NULLIF(btrim(analysis_model),''),NULLIF(btrim(model),'')) AS analysis_model,smart_intake_enabled
        FROM organization_ai_settings WHERE organization_id=$1`,[actor.organizationId])).rows[0];
      const smartIntakeAvailable=Boolean(ai?.enabled&&ai.has_api_key&&ai.analysis_model);
      return {...settings,smart_intake_enabled:Boolean(ai?.smart_intake_enabled&&smartIntakeAvailable),smart_intake_available:smartIntakeAvailable,
        smart_intake_reason:smartIntakeAvailable?null:'برای فعال‌سازی، مدیر پلتفرم باید AI، کلید API و مدل تحلیل را برای این سازمان تنظیم کند.'};
    });
  }
  async saveSettings(actor: Actor, input:{closurePolicy:'STAFF_ONLY'|'REQUESTER_CONFIRMATION'|'AUTO_EXPIRE';reopenWindowDays:number;businessTimezone:string;smartIntakeEnabled?:boolean}) {
    this.admin(actor);
    if(!Number.isInteger(input.reopenWindowDays)||input.reopenWindowDays<0||input.reopenWindowDays>90) throw new BadRequestException('Reopen window must be between 0 and 90 days.');
    await this.database.withOrganization(actor.organizationId,async c=>{
      const result=(await c.query('INSERT INTO organization_settings(organization_id,closure_policy,reopen_window_days,business_timezone) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id) DO UPDATE SET closure_policy=EXCLUDED.closure_policy,reopen_window_days=EXCLUDED.reopen_window_days,business_timezone=EXCLUDED.business_timezone,updated_at=now() RETURNING closure_policy,reopen_window_days,business_timezone',[actor.organizationId,input.closurePolicy,input.reopenWindowDays,input.businessTimezone])).rows[0] as { organization_id?: string };
      if(input.smartIntakeEnabled!==undefined){
        const ai=(await c.query<{enabled:boolean;has_api_key:boolean;analysis_model:string|null}>(`SELECT enabled,api_key_ciphertext IS NOT NULL AS has_api_key,
          COALESCE(NULLIF(btrim(analysis_model),''),NULLIF(btrim(model),'')) AS analysis_model FROM organization_ai_settings WHERE organization_id=$1`,[actor.organizationId])).rows[0];
        if(input.smartIntakeEnabled&&!(ai?.enabled&&ai.has_api_key&&ai.analysis_model)) throw new BadRequestException('Smart intake requires a platform-configured AI key and analysis model.');
        await c.query(`UPDATE organization_ai_settings SET smart_intake_enabled=$2,updated_by_user_id=$3,updated_at=now()
          WHERE organization_id=$1`,[actor.organizationId,input.smartIntakeEnabled,actor.userId]);
        await this.audit(c,actor,'organization.smart_intake_changed','organization',actor.organizationId,{enabled:input.smartIntakeEnabled});
      }
      await this.audit(c,actor,'organization.settings_saved','organization',actor.organizationId);
    });
    return this.settings(actor);
  }
  async branding(actor: Actor) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const row = (await client.query<{ logo_storage_key: string | null }>('SELECT logo_storage_key FROM organization_settings WHERE organization_id=$1', [actor.organizationId])).rows[0];
      return { logo_url: row?.logo_storage_key ? await this.storage.createViewUrl(row.logo_storage_key, 60 * 60) : null };
    });
  }
  async requestBrandingUpload(actor: Actor, input: { filename: string; contentType: string; byteSize: number }) {
    this.admin(actor);
    this.validateBrandLogo(input);
    const storageKey = `organizations/${actor.organizationId}/branding/${randomUUID()}`;
    return { storageKey, uploadUrl: await this.storage.createUploadUrl(storageKey, input.contentType, 300), expiresInSeconds: 300 };
  }
  async completeBrandingUpload(actor: Actor, input: { storageKey: string; contentType: string; byteSize: number }) {
    this.admin(actor);
    this.validateBrandLogo({ filename: 'logo', ...input });
    const prefix = `organizations/${actor.organizationId}/branding/`;
    if (!input.storageKey.startsWith(prefix) || !/^[a-f0-9-]{36}$/i.test(input.storageKey.slice(prefix.length))) throw new BadRequestException('Invalid logo upload reference.');
    const object = await this.storage.head(input.storageKey);
    if (!object || object.contentLength !== input.byteSize || object.contentType?.toLowerCase() !== input.contentType.toLowerCase()) throw new BadRequestException('Uploaded logo does not match the approved metadata.');
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await client.query(`INSERT INTO organization_settings(organization_id,logo_storage_key)
        VALUES($1,$2)
        ON CONFLICT(organization_id) DO UPDATE SET logo_storage_key=EXCLUDED.logo_storage_key,updated_at=now()`, [actor.organizationId, input.storageKey]);
      await this.audit(client, actor, 'organization.brand_logo_saved', 'organization', actor.organizationId, { contentType: input.contentType, byteSize: input.byteSize });
      return { logo_url: await this.storage.createViewUrl(input.storageKey, 60 * 60) };
    });
  }
  private validateBrandLogo(input: { filename: string; contentType: string; byteSize: number }) {
    if (typeof input.filename !== 'string' || !input.filename.trim() || input.filename.length > 255 || /[\\/\u0000-\u001f]/.test(input.filename)) throw new BadRequestException('Invalid logo filename.');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(input.contentType)) throw new BadRequestException('Logo format must be PNG, JPEG, or WebP.');
    if (!Number.isInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > 2 * 1024 * 1024) throw new BadRequestException('Logo must be no larger than 2 MB.');
  }
  async templates(actor: Actor) { this.admin(actor); return this.database.withOrganization(actor.organizationId,async c=>(await c.query('SELECT id,name,body,created_at,updated_at FROM response_templates ORDER BY name')).rows); }
  async saveTemplate(actor: Actor, input:{name:string;body:string}) { this.admin(actor); return this.database.withOrganization(actor.organizationId,async c=>{const result=(await c.query('INSERT INTO response_templates(organization_id,name,body,created_by_user_id) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id,name) DO UPDATE SET body=EXCLUDED.body,updated_at=now() RETURNING id,name,body',[actor.organizationId,input.name.trim(),input.body.trim(),actor.userId])).rows[0] as { id:string }; await this.audit(c,actor,'template.saved','response_template',result.id); return result;}); }

  async customFields(actor: Actor) { this.admin(actor); return this.database.withOrganization(actor.organizationId,async c=>(await c.query('SELECT id,field_key,label,field_type,options,is_required,is_active,sort_order FROM ticket_custom_field_definitions ORDER BY sort_order,label')).rows); }
  async saveCustomField(actor: Actor, input:{id?:string;fieldKey:string;label:string;fieldType:'TEXT'|'NUMBER'|'DATE'|'SELECT'|'BOOLEAN';options?:string[];isRequired?:boolean;isActive?:boolean;sortOrder?:number}) { this.admin(actor); const label=input.label?.trim(); if(!/^[a-z][a-z0-9_]{1,63}$/.test(input.fieldKey||'')||!label || label.includes('?') || label.includes('\uFFFD')) throw new BadRequestException('عنوان فیلد سفارشی معتبر نیست؛ عنوان خوانا و بدون نویسهٔ خراب وارد کنید.'); if(!['TEXT','NUMBER','DATE','SELECT','BOOLEAN'].includes(input.fieldType)|| (input.fieldType==='SELECT'&&!(input.options??[]).length)) throw new BadRequestException('Custom field type or options are invalid.'); return this.database.withOrganization(actor.organizationId,async c=>{const row=(await c.query(`INSERT INTO ticket_custom_field_definitions(organization_id,field_key,label,field_type,options,is_required,is_active,sort_order) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8) ON CONFLICT(organization_id,field_key) DO UPDATE SET label=EXCLUDED.label,field_type=EXCLUDED.field_type,options=EXCLUDED.options,is_required=EXCLUDED.is_required,is_active=EXCLUDED.is_active,sort_order=EXCLUDED.sort_order,updated_at=now() RETURNING id,field_key,label,field_type,options,is_required,is_active,sort_order`,[actor.organizationId,input.fieldKey,label,input.fieldType,JSON.stringify(input.options??[]),input.isRequired??false,input.isActive??true,input.sortOrder??0])).rows[0] as {id:string}; await this.audit(c,actor,'custom_field.saved','ticket_custom_field',row.id,{fieldKey:input.fieldKey});return row;}); }
  async emailIntegration(actor: Actor) { this.admin(actor); return this.database.withOrganization(actor.organizationId,async c=>(await c.query('SELECT inbound_address,sender_name,enabled,updated_at FROM email_integration_settings WHERE organization_id=$1',[actor.organizationId])).rows[0]??{inbound_address:`support+${actor.organizationId.slice(0,8)}@jupiter.local`,sender_name:'Jupiter Support',enabled:false}); }
  async saveEmailIntegration(actor: Actor, input:{inboundAddress:string;senderName:string;enabled:boolean}) { this.admin(actor); if(!/^\S+@\S+\.\S+$/.test(input.inboundAddress??'')||!input.senderName?.trim()) throw new BadRequestException('Email integration settings are invalid.'); return this.database.withOrganization(actor.organizationId,async c=>{const row=(await c.query('INSERT INTO email_integration_settings(organization_id,inbound_address,sender_name,enabled) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id) DO UPDATE SET inbound_address=EXCLUDED.inbound_address,sender_name=EXCLUDED.sender_name,enabled=EXCLUDED.enabled,updated_at=now() RETURNING inbound_address,sender_name,enabled,updated_at',[actor.organizationId,input.inboundAddress.toLowerCase(),input.senderName.trim(),input.enabled])).rows[0]; await this.audit(c,actor,'email_integration.saved','organization',actor.organizationId,{enabled:input.enabled,inboundAddress:input.inboundAddress}); return row;}); }

  private catalogKind(kind: string) { if (!catalogTables.has(kind)) throw new NotFoundException('Unknown catalog.'); }
  private suggestionTable(kind:string) { if(!suggestionKinds.has(kind)||kind==='subcategory') throw new BadRequestException('Invalid suggestion kind.'); return `${kind}s`; }
  private async replaceRoles(client: { query(query: string, values?: unknown[]): Promise<unknown> }, membershipId: string, roles: string[]) { await client.query('DELETE FROM membership_roles WHERE membership_id=$1',[membershipId]); await client.query('INSERT INTO membership_roles(membership_id,role_id) SELECT $1,id FROM roles WHERE code=ANY($2::text[])',[membershipId,roles]); }
  private async platform(userId:string) { const user=(await this.database.query<{is_platform_admin:boolean}>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true',[userId])).rows[0]; if(!user?.is_platform_admin) throw new ForbiddenException(); }
  async platformOrganizations(userId:string) { await this.platform(userId); return (await this.database.query('SELECT id,slug,name,status,created_at FROM organizations ORDER BY created_at DESC')).rows; }
  async createPlatformOrganization(userId: string, input: { name: string; slug: string }) { await this.platform(userId); if(!input.name?.trim() || !/^[a-z0-9-]{3,63}$/.test(input.slug ?? '')) throw new BadRequestException('Organization name and slug are invalid.'); const result=(await this.database.query<{id:string;name:string;slug:string;status:string}>('INSERT INTO organizations(name,slug) VALUES($1,$2) RETURNING id,name,slug,status',[input.name.trim(),input.slug.trim()])); await this.database.query('INSERT INTO audit_logs(actor_user_id,action,target_type,target_id,metadata) VALUES($1,\'platform.organization_created\',\'organization\',$2,$3)',[userId,result.rows[0].id,{slug:input.slug.trim()}]); return result.rows[0]; }
  async platformUsers(userId: string) { await this.platform(userId); return (await this.database.query('SELECT id,email,display_name,is_platform_admin,is_active,created_at FROM users ORDER BY display_name')).rows; }
  async createPlatformUser(actorUserId: string, input: { email: string; username?: string; displayName: string; password: string; isPlatformAdmin?: boolean }) { await this.platform(actorUserId); if(!/^\S+@\S+\.\S+$/.test(input.email ?? '') || !input.displayName?.trim() || !input.password || input.password.length<10) throw new BadRequestException('Provide valid user details and a password of at least 10 characters.'); try { const result=(await this.database.query<{id:string;email:string;display_name:string;is_platform_admin:boolean;is_active:boolean}>('INSERT INTO users(email,username,display_name,password_hash,is_platform_admin) VALUES($1,$2,$3,$4,$5) RETURNING id,email,display_name,is_platform_admin,is_active',[input.email.toLowerCase(),this.username(input.username)??null,input.displayName.trim(),await hashPassword(input.password),input.isPlatformAdmin??false])).rows[0]; await this.database.query('INSERT INTO audit_logs(actor_user_id,action,target_type,target_id,metadata) VALUES($1,\'platform.user_created\',\'user\',$2,$3)',[actorUserId,result.id,{isPlatformAdmin:result.is_platform_admin}]); return result; } catch (cause) { this.usernameConflict(cause); } }
  async updatePlatformUser(actorUserId: string, targetUserId: string, input: { displayName?: string; username?: string; isPlatformAdmin?: boolean; isActive?: boolean; password?: string }) { await this.platform(actorUserId); if(targetUserId===actorUserId && (input.isActive===false || input.isPlatformAdmin===false)) throw new BadRequestException('You cannot remove your own platform access.'); if(input.password !== undefined && (input.password.length < 10 || input.password.length > 200)) throw new BadRequestException('Password must be between 10 and 200 characters.'); const { password, ...auditInput } = input; try { const passwordHash=password ? await hashPassword(password) : null; const result=(await this.database.query<{id:string;email:string;display_name:string;is_platform_admin:boolean;is_active:boolean}>('UPDATE users SET display_name=COALESCE($1,display_name),username=COALESCE($2,username),is_platform_admin=COALESCE($3,is_platform_admin),is_active=COALESCE($4,is_active),password_hash=COALESCE($5,password_hash),updated_at=now() WHERE id=$6 RETURNING id,email,display_name,is_platform_admin,is_active',[input.displayName?.trim()||null,this.username(input.username)??null,input.isPlatformAdmin??null,input.isActive??null,passwordHash,targetUserId])).rows[0]; if(!result) throw new NotFoundException('Platform user not found.'); if(passwordHash) await this.database.query('UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[targetUserId]); await this.database.query('INSERT INTO audit_logs(actor_user_id,action,target_type,target_id,metadata) VALUES($1,\'platform.user_updated\',\'user\',$2,$3)',[actorUserId,targetUserId,{...auditInput,passwordChanged:Boolean(passwordHash)}]); return result; } catch (cause) { this.usernameConflict(cause); } }
  async setOrganizationStatus(userId:string, organizationId:string, status:'active'|'suspended') {
    await this.platform(userId);
    return this.database.transaction(async client=>{
      const organization=(await client.query<{status:string}>('SELECT status FROM organizations WHERE id=$1 FOR UPDATE',[organizationId])).rows[0];
      if(!organization) throw new NotFoundException('Organization not found.');
      if(organization.status==='setup'&&status==='active') throw new BadRequestException('سازمان در مرحلهٔ راه‌اندازی فقط از مسیر Go-Live فعال می‌شود.');
      const result=await client.query('UPDATE organizations SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,name,status',[status,organizationId]);
      await client.query('INSERT INTO audit_logs(actor_user_id,action,target_type,target_id,metadata) VALUES($1,\'platform.organization_status_changed\',\'organization\',$2,$3)',[userId,organizationId,{status}]);
      return result.rows[0];
    });
  }
  async tenantContext(userId:string, slug:string) {
    const context=(await this.database.query<{organization_id:string;organization_name:string;organization_slug:string;organization_status:string;role_codes:string[]}>(
      `SELECT m.organization_id,o.name AS organization_name,o.slug AS organization_slug,o.status AS organization_status,
        array_remove(array_agg(r.code ORDER BY r.code),NULL) AS role_codes
       FROM memberships m JOIN organizations o ON o.id=m.organization_id
       LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id
       WHERE m.user_id=$1 AND m.status='active' AND o.slug=$2 GROUP BY m.organization_id,o.name,o.slug,o.status`,[userId,slug],
    )).rows[0];
    if(!context) throw new NotFoundException('سازمان در دسترس نیست.');
    return context;
  }

  private importRows(rows: unknown[]) {
    if(!Array.isArray(rows)||rows.length<1||rows.length>500) throw new BadRequestException('فایل باید بین ۱ تا ۵۰۰ ردیف داشته باشد.');
    const seen=new Set<string>();
    return rows.map((raw,index)=>{const row=raw as Record<string,unknown>;const email=typeof row.email==='string'?row.email.trim().toLowerCase():'';const displayName=typeof row.displayName==='string'?row.displayName.trim():'';const username=this.username(typeof row.username==='string'?row.username:undefined);const password=typeof row.password==='string'?row.password:'';const roles=Array.isArray(row.roles)?row.roles.filter((role):role is string=>typeof role==='string'):['REQUESTER'];const errors:string[]=[];if(!/^\S+@\S+\.\S+$/.test(email))errors.push('ایمیل نامعتبر است.');if(displayName.length<2||displayName.length>120)errors.push('نام نمایشی نامعتبر است.');if(password.length<10||password.length>200)errors.push('رمز موقت باید ۱۰ تا ۲۰۰ نویسه باشد.');try{this.validRoles(roles);}catch{errors.push('نقش‌ها نامعتبرند.');}if(seen.has(email))errors.push('ایمیل در فایل تکراری است.');seen.add(email);return {row:index+2,email,displayName,username,password,roles,errors};});
  }
  async previewMemberImport(actor:Actor,rows:unknown[]) { this.memberAdmin(actor); const parsed=this.importRows(rows); return {valid:parsed.every(row=>!row.errors.length),rows:parsed.map(({password,...row})=>({...row,action:row.errors.length?'ERROR':'CREATE_OR_UPDATE'}))}; }
  async confirmMemberImport(actor:Actor,rows:unknown[],idempotencyKey?:string) {
    this.memberAdmin(actor); if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey??'')) throw new BadRequestException('Idempotency-Key معتبر لازم است.');
    const parsed=this.importRows(rows); if(parsed.some(row=>row.errors.length)) throw new BadRequestException('پیش‌نمایش دارای خطا است.');
    const payloadHash=createHash('sha256').update(JSON.stringify(parsed.map(({password,...row})=>row))).digest('hex');
    return this.database.withOrganization(actor.organizationId,async client=>{
      const previous=(await client.query<{payload_hash:string;result:object}>('SELECT payload_hash,result FROM organization_user_imports WHERE organization_id=$1 AND idempotency_key=$2',[actor.organizationId,idempotencyKey])).rows[0];
      if(previous){if(previous.payload_hash!==payloadHash)throw new BadRequestException('این کلید قبلاً با محتوای دیگری استفاده شده است.');return previous.result;}
      const resultRows=[] as {row:number;email:string;status:string}[];
      for(const row of parsed){const existing=(await client.query<{id:string}>('SELECT id FROM users WHERE email=$1',[row.email])).rows[0];const user=existing??(await client.query<{id:string}>('INSERT INTO users(email,username,display_name,password_hash) VALUES($1,$2,$3,$4) RETURNING id',[row.email,row.username??null,row.displayName,await hashPassword(row.password)])).rows[0];if(existing)await client.query('UPDATE users SET display_name=$1,username=COALESCE($2,username),updated_at=now() WHERE id=$3',[row.displayName,row.username??null,user.id]);const member=(await client.query<{id:string}>('INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,\'active\') ON CONFLICT(organization_id,user_id) DO UPDATE SET status=\'active\' RETURNING id',[actor.organizationId,user.id])).rows[0];await this.replaceRoles(client,member.id,this.validRoles(row.roles));resultRows.push({row:row.row,email:row.email,status:existing?'UPDATED':'CREATED'});}
      const result={created:resultRows.filter(row=>row.status==='CREATED').length,updated:resultRows.filter(row=>row.status==='UPDATED').length,rows:resultRows};
      await client.query('INSERT INTO organization_user_imports(organization_id,idempotency_key,payload_hash,result,created_by_user_id) VALUES($1,$2,$3,$4,$5)',[actor.organizationId,idempotencyKey,payloadHash,JSON.stringify(result),actor.userId]);
      await this.audit(client,actor,'members.csv_imported','organization',actor.organizationId,{created:result.created,updated:result.updated,rowCount:resultRows.length});return result;
    });
  }
  async tenantSetup(actor:Actor) {
    return this.database.withOrganization(actor.organizationId,async client=>{
      const organization=(await client.query<{id:string;name:string;slug:string;status:string}>('SELECT id,name,slug,status FROM organizations WHERE id=$1',[actor.organizationId])).rows[0];
      if(!organization) throw new NotFoundException('Organization not found.');
      const readiness=(await client.query<{settings_ready:boolean;categories:number}>(`SELECT EXISTS(SELECT 1 FROM organization_settings WHERE organization_id=$1) AS settings_ready,(SELECT count(*)::int FROM categories) AS categories`,[actor.organizationId])).rows[0];
      const progress=(await client.query<{confirmed_by_user_id:string|null;completed_at:string|null}>('SELECT confirmed_by_user_id,completed_at FROM organization_setup_progress WHERE organization_id=$1',[actor.organizationId])).rows[0];
      return {...organization,isOwner:actor.roles.includes('ORG_OWNER'),settingsReady:readiness.settings_ready,categories:readiness.categories,completedAt:progress?.completed_at??null};
    });
  }
  async completeTenantSetup(actor:Actor) {
    if (!this.setup) throw new NotFoundException('سرویس راه‌اندازی سازمان در دسترس نیست.');
    // Compatibility endpoint only: the canonical setup service owns readiness,
    // authorization, locking, idempotency, audit and lifecycle transition.
    return this.setup.goLive(actor);
  }
  async platformOwners(userId:string,organizationId:string) { await this.platform(userId); return (await this.database.query(`SELECT m.id AS membership_id,u.id AS user_id,u.display_name,u.email FROM memberships m JOIN users u ON u.id=m.user_id JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.status='active' AND r.code='ORG_OWNER' ORDER BY u.display_name`,[organizationId])).rows; }
  async platformOrganizationMembers(userId:string,organizationId:string) { await this.platform(userId); return (await this.database.query(`SELECT m.id AS membership_id,u.id AS user_id,u.display_name,u.email,array_remove(array_agg(r.code ORDER BY r.code),NULL) AS roles FROM memberships m JOIN users u ON u.id=m.user_id LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.status='active' GROUP BY m.id,u.id ORDER BY u.display_name`,[organizationId])).rows; }
  async assignPlatformOwner(actorUserId:string,organizationId:string,targetUserId:string) {
    await this.platform(actorUserId);
    return this.database.transaction(async client=>{
      const member=(await client.query<{id:string}>('SELECT id FROM memberships WHERE organization_id=$1 AND user_id=$2 AND status=\'active\' FOR UPDATE',[organizationId,targetUserId])).rows[0];
      if(!member) throw new BadRequestException('مالک باید عضو فعال همین سازمان باشد.');
      const ownerRole=(await client.query<{id:string}>('SELECT id FROM roles WHERE code=\'ORG_OWNER\'')).rows[0]; if(!ownerRole) throw new NotFoundException('Owner role not found.');
      await client.query(`DELETE FROM membership_roles WHERE role_id=$1 AND membership_id IN (SELECT id FROM memberships WHERE organization_id=$2)`,[ownerRole.id,organizationId]);
      await client.query('INSERT INTO membership_roles(membership_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[member.id,ownerRole.id]);
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,\'platform.organization_owner_assigned\',\'membership\',$3,$4)',[organizationId,actorUserId,member.id,{replaced:true}]);
      return {membershipId:member.id,userId:targetUserId};
    });
  }
  async revokePlatformOwner(actorUserId:string,organizationId:string) {
    await this.platform(actorUserId);
    return this.database.transaction(async client=>{
      const ownerRole=(await client.query<{id:string}>('SELECT id FROM roles WHERE code=\'ORG_OWNER\'')).rows[0]; if(!ownerRole) throw new NotFoundException('Owner role not found.');
      const owners=(await client.query<{id:string,user_id:string}>('SELECT m.id,m.user_id FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id WHERE m.organization_id=$1 AND mr.role_id=$2 FOR UPDATE',[organizationId,ownerRole.id])).rows;
      await client.query('DELETE FROM membership_roles WHERE role_id=$1 AND membership_id IN (SELECT id FROM memberships WHERE organization_id=$2)',[ownerRole.id,organizationId]);
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,\'platform.organization_owner_revoked\',\'organization\',$1,$3)',[organizationId,actorUserId,{previousOwnerUserIds:owners.map(owner=>owner.user_id),reason:'explicit_platform_revoke'}]);
      return {revoked:owners.length};
    });
  }
}
