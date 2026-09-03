import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CommercialService } from '../commercial/commercial.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { OrganizationAccessPolicy } from './organization-access.policy.js';
import type { PoolClient } from 'pg';

type Actor={userId:string;organizationId:string;roles:string[]};
type Step='PROFILE'|'STRUCTURE'|'TICKET_CONFIGURATION'|'SLA'|'USERS'|'DIRECTORY'|'AI'|'ASSIST'|'APPEARANCE'|'REVIEW';
type State='NOT_STARTED'|'IN_PROGRESS'|'COMPLETE'|'SKIPPED'|'BLOCKED';
const steps:Step[]=['PROFILE','STRUCTURE','TICKET_CONFIGURATION','SLA','USERS','DIRECTORY','AI','ASSIST','APPEARANCE','REVIEW'];
const optional=new Set<Step>(['STRUCTURE','SLA','USERS','DIRECTORY','AI','ASSIST','APPEARANCE']);

@Injectable()
export class OrganizationSetupService {
  constructor(private readonly database:DatabaseService,private readonly access:OrganizationAccessPolicy,private readonly commercial:CommercialService,private readonly notifications:NotificationService) {}
  private audit(c:PoolClient,a:Actor,action:string,metadata:object={}) { return c.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,\'organization_setup\',$1,$4)',[a.organizationId,a.userId,action,metadata]); }
  private phone(value:unknown) { if(value===undefined||value===null||String(value).trim()==='') return null; const phone=String(value).trim(); if(phone.length<5||phone.length>40) throw new BadRequestException('شمارهٔ تماس سازمان معتبر نیست.'); return phone; }
  private timezone(value:unknown) { const zone=typeof value==='string'?value.trim():''; try { if(!zone||Intl.DateTimeFormat(undefined,{timeZone:zone}).resolvedOptions().timeZone!==zone) throw new Error(); } catch { throw new BadRequestException('منطقهٔ زمانی معتبر نیست.'); } return zone; }
  private name(value:unknown) { const name=typeof value==='string'?value.trim():''; if(name.length<2||name.length>160) throw new BadRequestException('نام سازمان معتبر نیست.'); return name; }
  private async ownerExists(c:PoolClient,org:string) { return Boolean((await c.query("SELECT EXISTS(SELECT 1 FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 AND m.status='active' AND u.is_active AND r.code='ORG_OWNER') x",[org])).rows[0]?.x); }
  private async snapshot(c:PoolClient,org:string) {
    const [organization,settings,categories,teams,members,slas,connectors]=await Promise.all([
      c.query<{name:string;status:string}>('SELECT name,status FROM organizations WHERE id=$1',[org]),
      c.query<{business_timezone:string;contact_phone:string|null;logo_storage_key:string|null}>('SELECT business_timezone,contact_phone,logo_storage_key FROM organization_settings WHERE organization_id=$1',[org]),
      c.query<{count:string}>('SELECT count(*) count FROM categories',[ ]),
      c.query<{count:string}>('SELECT count(*) count FROM teams WHERE is_active=true'),
      c.query<{count:string}>('SELECT count(*) count FROM memberships WHERE status=\'active\''),
      c.query<{count:string}>('SELECT count(*) count FROM sla_policies WHERE is_active=true'),
      c.query<{status:string;operational_status?:string}>('SELECT status FROM directory_connectors ORDER BY created_at DESC LIMIT 1'),
    ]);
    const row=organization.rows[0]; if(!row) throw new NotFoundException('سازمان یافت نشد.');
    const setting=settings.rows[0]; let timezoneValid=false; try { timezoneValid=Boolean(setting?.business_timezone)&&Intl.DateTimeFormat(undefined,{timeZone:setting.business_timezone}).resolvedOptions().timeZone===setting.business_timezone; } catch { timezoneValid=false; }
    const [ticketReview,smartIntake,assist]=await Promise.all(['AI_TICKET_REVIEW','AI_SMART_INTAKE','JUPITER_ASSIST'].map(code=>this.commercial.resolve(org,code)));
    return {organization:row,setting,timezoneValid,categories:Number(categories.rows[0]?.count??0),teams:Number(teams.rows[0]?.count??0),members:Number(members.rows[0]?.count??0),slas:Number(slas.rows[0]?.count??0),connector:connectors.rows[0]??null,ai:Boolean(ticketReview.effective||smartIntake.effective),assist:Boolean(assist.effective)};
  }
  private states(current:Record<string,State>,data:Awaited<ReturnType<OrganizationSetupService['snapshot']>>,owner:boolean) {
    const next:Record<Step,State>={PROFILE:'NOT_STARTED',STRUCTURE:'NOT_STARTED',TICKET_CONFIGURATION:'NOT_STARTED',SLA:'NOT_STARTED',USERS:'NOT_STARTED',DIRECTORY:'NOT_STARTED',AI:'NOT_STARTED',ASSIST:'NOT_STARTED',APPEARANCE:'NOT_STARTED',REVIEW:'NOT_STARTED'};
    const complete=(step:Step,yes:boolean)=>{ if(yes) next[step]='COMPLETE'; else if(current[step]==='SKIPPED'&&optional.has(step)) next[step]='SKIPPED'; else if(current[step]==='COMPLETE'&&!optional.has(step)) next[step]='BLOCKED'; };
    complete('PROFILE',data.organization.name.trim().length>=2&&data.timezoneValid);
    complete('STRUCTURE',data.teams>0);
    complete('TICKET_CONFIGURATION',data.categories>0);
    complete('SLA',data.slas>0);
    complete('USERS',data.members>1);
    complete('DIRECTORY',data.connector?.status==='PAIRED');
    complete('AI',data.ai); complete('ASSIST',data.assist);
    complete('APPEARANCE',Boolean((data.setting as any)?.logo_storage_key));
    const blockers:string[]=[]; if(data.organization.status!=='setup') blockers.push('سازمان در وضعیت راه‌اندازی نیست.'); if(!owner) blockers.push('مالک فعال سازمان تعیین نشده است.'); if(next.PROFILE!=='COMPLETE') blockers.push('نام سازمان و منطقهٔ زمانی معتبر را تکمیل کنید.'); if(next.TICKET_CONFIGURATION!=='COMPLETE') blockers.push('حداقل یک دسته‌بندی تیکت معتبر بسازید.');
    next.REVIEW=blockers.length?'BLOCKED':'COMPLETE';
    return {states:next,blockers};
  }
  private warnings(data:Awaited<ReturnType<OrganizationSetupService['snapshot']>>) { const result:string[]=[]; if(!data.teams)result.push('تیم یا ساختار فعال تعریف نشده است.'); if(!data.slas)result.push('SLA فعال تعریف نشده است.'); if(data.members<=1)result.push('کاربر فعال دیگری افزوده نشده است.'); if(!data.connector)result.push('Connector دایرکتوری پیکربندی نشده است.'); else if(data.connector.status!=='PAIRED')result.push('Connector دایرکتوری هنوز متصل نیست.'); if(!data.ai)result.push('هوش مصنوعی برای سازمان فعال نیست.'); if(!data.assist)result.push('Jupiter Assist فعال نیست.'); if(!(data.setting as any)?.logo_storage_key)result.push('لوگوی سازمان تنظیم نشده است.'); return result; }
  private first(states:Record<Step,State>) { return steps.find(step=>step!=='REVIEW'&&states[step]!=='COMPLETE'&&states[step]!=='SKIPPED')??'REVIEW'; }
  private async reconcile(c:PoolClient,a:Actor) {
    const progress=(await c.query<{step_states:Record<string,State>;version:number;started_at:string;completed_at:string|null}>('SELECT step_states,version,started_at,completed_at FROM organization_setup_progress WHERE organization_id=$1 FOR UPDATE',[a.organizationId])).rows[0];
    const data=await this.snapshot(c,a.organizationId); const owner=await this.ownerExists(c,a.organizationId); const current=(progress?.step_states??{}) as Record<string,State>; const result=this.states(current,data,owner); const currentStep=this.first(result.states);
    if(!progress) { await c.query("INSERT INTO organization_setup_progress(organization_id,current_step,step_states,started_at) VALUES($1,$2,$3,now())",[a.organizationId,currentStep,JSON.stringify(result.states)]); await this.audit(c,a,'ORGANIZATION_SETUP_STARTED'); }
    else if(steps.some(step=>current[step]!==result.states[step])||currentStep!==((await c.query<{current_step:string}>('SELECT current_step FROM organization_setup_progress WHERE organization_id=$1',[a.organizationId])).rows[0]?.current_step)) { for(const step of steps) if(current[step]!=='COMPLETE'&&result.states[step]==='COMPLETE') await this.audit(c,a,'ORGANIZATION_SETUP_STEP_COMPLETED',{step}); await c.query('UPDATE organization_setup_progress SET current_step=$2,step_states=$3,version=version+1,updated_at=now() WHERE organization_id=$1',[a.organizationId,currentStep,JSON.stringify(result.states)]); }
    const fresh=(await c.query<{wizard_version:number;current_step:Step;step_states:Record<string,State>;started_at:string;updated_at:string;completed_at:string|null;version:number}>('SELECT wizard_version,current_step,step_states,started_at,updated_at,completed_at,version FROM organization_setup_progress WHERE organization_id=$1',[a.organizationId])).rows[0];
    return {progress:fresh,readiness:{ready:result.blockers.length===0,blockers:result.blockers,warnings:this.warnings(data),completedSteps:steps.filter(step=>result.states[step]==='COMPLETE'),optionalRecommendations:this.warnings(data)},organization:{name:data.organization.name,status:data.organization.status,timezone:data.setting?.business_timezone??null,contactPhone:data.setting?.contact_phone??null},directory:data.connector?{status:data.connector.status}: {status:'NOT_CONFIGURED'},ai:{available:data.ai},assist:{available:data.assist}};
  }
  async get(actor:Actor) { return this.database.withOrganization(actor.organizationId,c=>this.reconcile(c,actor)); }
  async profile(actor:Actor,input:{name?:unknown;businessTimezone?:unknown;contactPhone?:unknown}) { this.access.operator(actor); const name=this.name(input.name),timezone=this.timezone(input.businessTimezone),phone=this.phone(input.contactPhone); return this.database.withOrganization(actor.organizationId,async c=>{const org=(await c.query<{status:string}>('SELECT status FROM organizations WHERE id=$1 FOR UPDATE',[actor.organizationId])).rows[0];if(!org||org.status!=='setup')throw new BadRequestException('پروفایل فقط در مرحلهٔ راه‌اندازی قابل تغییر است.');await c.query('UPDATE organizations SET name=$1,updated_at=now() WHERE id=$2',[name,actor.organizationId]);await c.query("INSERT INTO organization_settings(organization_id,business_timezone,contact_phone) VALUES($1,$2,$3) ON CONFLICT(organization_id) DO UPDATE SET business_timezone=EXCLUDED.business_timezone,contact_phone=EXCLUDED.contact_phone,updated_at=now()",[actor.organizationId,timezone,phone]);await this.audit(c,actor,'ORGANIZATION_SETUP_PROFILE_SAVED',{hasContactPhone:Boolean(phone)});return this.reconcile(c,actor);}); }
  async skip(actor:Actor,step:string,version:number) { this.access.owner(actor); const item=step as Step;if(!optional.has(item))throw new BadRequestException('این مرحله قابل رد نیست.');return this.database.withOrganization(actor.organizationId,async c=>{const row=(await c.query<{step_states:Record<string,State>;version:number}>('SELECT step_states,version FROM organization_setup_progress WHERE organization_id=$1 FOR UPDATE',[actor.organizationId])).rows[0];if(!row)throw new ConflictException('ابتدا وضعیت راه‌اندازی را دریافت کنید.');if(row.version!==version)throw new ConflictException('وضعیت راه‌اندازی تغییر کرده است؛ صفحه را تازه‌سازی کنید.');const states={...row.step_states,[item]:'SKIPPED'};await c.query('UPDATE organization_setup_progress SET step_states=$2,version=version+1,updated_at=now() WHERE organization_id=$1',[actor.organizationId,JSON.stringify(states)]);await this.audit(c,actor,'ORGANIZATION_SETUP_STEP_SKIPPED',{step:item});return this.reconcile(c,actor);}); }
  async goLive(actor:Actor) { this.access.owner(actor); const result=await this.database.withOrganization(actor.organizationId,async c=>{const organization=(await c.query<{status:string}>('SELECT status FROM organizations WHERE id=$1 FOR UPDATE',[actor.organizationId])).rows[0];if(!organization)throw new NotFoundException('سازمان یافت نشد.');if(organization.status==='active')return{response:{status:'active',idempotent:true} as const,owners:[] as string[]};if(organization.status!=='setup')throw new BadRequestException('این سازمان قابل راه‌اندازی نیست.');const state=await this.reconcile(c,actor);if(!state.readiness.ready) throw new BadRequestException(state.readiness.blockers.join(' '));await c.query("UPDATE organizations SET status='active',updated_at=now() WHERE id=$1",[actor.organizationId]);await c.query('UPDATE organization_setup_progress SET completed_at=COALESCE(completed_at,now()),completed_by_user_id=COALESCE(completed_by_user_id,$2),updated_at=now() WHERE organization_id=$1',[actor.organizationId,actor.userId]);await this.audit(c,actor,'ORGANIZATION_SETUP_GO_LIVE');const owners=(await c.query<{user_id:string}>("SELECT DISTINCT m.user_id FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id JOIN users u ON u.id=m.user_id WHERE m.status='active' AND u.is_active AND r.code='ORG_OWNER'")).rows.map(x=>x.user_id);return{response:{status:'active',idempotent:false} as const,owners};});if(result.owners.length)await this.notifications.publish(actor.organizationId,result.owners,{type:'ORGANIZATION_SETUP_GO_LIVE',occurredAt:new Date().toISOString()});return result.response; }
}
