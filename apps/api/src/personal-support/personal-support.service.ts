import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { PersonalCapacityService } from '../personal-capacity/personal-capacity.service.js';
import { TicketActor } from '../tickets/ticket-actor.service.js';

type CatalogInput = {
  status?: 'ACTIVE' | 'SUSPENDED';
  displayName?: string;
  description?: string;
  slaMinutes?: number;
  accessGrantMinutes?: number;
};

type AgentCase = { organization_id:string;ticket_id:string;requested_by_user_id:string;status:string;assigned_support_agent_user_id:string|null };

@Injectable()
export class PersonalSupportService {
  constructor(private readonly database: DatabaseService, private readonly notifications: NotificationService, private readonly capacity: PersonalCapacityService) {}

  async effectiveCatalog(actor: TicketActor) {
    await this.personalOwner(actor);
    return (await this.database.query(
      `SELECT code,display_name,description,status,sla_minutes
       FROM personal_service_catalog WHERE code='PERSONAL_SUPPORT'`,
    )).rows[0];
  }

  async cases(actor: TicketActor) {
    await this.personalOwner(actor);
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query(
      `SELECT personal_case.id,personal_case.ticket_id,personal_case.status,
        personal_case.request_note,personal_case.sla_due_at,personal_case.created_at,
        personal_case.updated_at,agent.display_name AS assigned_agent_name
       FROM personal_support_cases personal_case
       LEFT JOIN users agent ON agent.id=personal_case.assigned_support_agent_user_id
       WHERE personal_case.requested_by_user_id=$1
       ORDER BY personal_case.created_at DESC`, [actor.userId],
    )).rows);
  }

  async request(actor: TicketActor, ticketId: string, note?: string) {
    await this.personalOwner(actor);
    const requestNote = note?.trim() || null;
    if (requestNote && requestNote.length > 1000) throw new BadRequestException('توضیح درخواست طولانی است.');
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const ticket = (await client.query<{id:string;status:string}>(
        `SELECT id,status FROM tickets
         WHERE id=$1 AND requester_user_id=$2 AND status<>'DRAFT'`, [ticketId,actor.userId],
      )).rows[0];
      if (!ticket) throw new NotFoundException('تیکت ارسال‌شده برای پشتیبانی یافت نشد.');
      const catalog = (await client.query<{code:string;sla_minutes:number;access_grant_minutes:number}>(
        `SELECT code,sla_minutes,access_grant_minutes FROM personal_service_catalog
         WHERE code='PERSONAL_SUPPORT' AND status='ACTIVE'`,
      )).rows[0];
      if (!catalog) throw new ForbiddenException('پشتیبانی شخصی در حال حاضر در دسترس نیست.');
      const existing=(await client.query<{id:string;status:string}>(
        'SELECT id,status FROM personal_support_cases WHERE ticket_id=$1',[ticket.id],
      )).rows[0];
      if(existing) return existing;
      const reservation=await this.capacity.reserve(client,{
        organizationId:actor.organizationId,poolCode:'SUPPORT',subjectType:'SUPPORT_CASE',
        idempotencyKey:`PERSONAL_SUPPORT:${ticket.id}`,actorId:actor.userId,
      });
      const inserted = (await client.query<{id:string;status:string}>(
        `INSERT INTO personal_support_cases(
          organization_id,ticket_id,requested_by_user_id,service_code,status,request_note,
          sla_minutes_snapshot,access_grant_minutes_snapshot,capacity_reservation_id
         ) VALUES($1,$2,$3,$4,'QUEUED',$5,$6,$7,$8)
         ON CONFLICT(organization_id,ticket_id) DO NOTHING
         RETURNING id,status`,
        [actor.organizationId,ticket.id,actor.userId,catalog.code,requestNote,catalog.sla_minutes,catalog.access_grant_minutes,reservation.id],
      )).rows[0];
      const record = inserted ?? (await client.query<{id:string;status:string}>(
        'SELECT id,status FROM personal_support_cases WHERE ticket_id=$1', [ticket.id],
      )).rows[0];
      if (inserted) await this.audit(client,actor.organizationId,actor.userId,'personal_support.requested',record.id,{status:record.status});
      return record;
    });
  }

  async cancel(actor: TicketActor, caseId: string) {
    await this.personalOwner(actor);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const record = (await client.query<{id:string;status:string;capacity_reservation_id:string|null}>(
        `UPDATE personal_support_cases SET status='CANCELLED',cancelled_at=now(),updated_at=now()
         WHERE id=$1 AND requested_by_user_id=$2 AND status='QUEUED'
         RETURNING id,status,capacity_reservation_id`, [caseId,actor.userId],
      )).rows[0];
      if (!record) throw new NotFoundException('درخواست قابل لغو نیست.');
      if(record.capacity_reservation_id) await this.capacity.release(client,record.capacity_reservation_id,actor.userId,'USER_CANCELLED');
      await this.audit(client,actor.organizationId,actor.userId,'personal_support.cancelled',caseId,{status:'CANCELLED'});
      return record;
    });
  }

  async platformCatalog(actorId: string) {
    await this.platform(actorId);
    return (await this.database.query(
      `SELECT code,display_name,description,status,sla_minutes,access_grant_minutes,updated_at
       FROM personal_service_catalog ORDER BY code`,
    )).rows;
  }

  async saveCatalog(actorId: string, input: CatalogInput) {
    await this.platform(actorId);
    const displayName=input.displayName?.trim()??'';
    const description=input.description?.trim()??'';
    const status=input.status??'';
    const sla=input.slaMinutes;
    const grant=input.accessGrantMinutes;
    if (!['ACTIVE','SUSPENDED'].includes(status) || displayName.length<2 || displayName.length>120 ||
      description.length<2 || description.length>1000 || !Number.isInteger(sla) || sla! < 15 || sla! > 43200 ||
      !Number.isInteger(grant) || grant! < 15 || grant! > 43200) {
      throw new BadRequestException('تنظیمات سرویس پشتیبانی شخصی معتبر نیست.');
    }
    return this.database.transaction(async (client) => {
      const record=(await client.query<{id:string;code:string}>(
        `UPDATE personal_service_catalog
         SET display_name=$1,description=$2,status=$3,sla_minutes=$4,
             access_grant_minutes=$5,updated_by_user_id=$6,updated_at=now()
         WHERE code='PERSONAL_SUPPORT' RETURNING id,code`,
        [displayName,description,status,sla,grant,actorId],
      )).rows[0];
      if (!record) throw new NotFoundException('سرویس پشتیبانی شخصی یافت نشد.');
      await this.audit(client,null,actorId,'personal_support.catalog_updated',record.id,{code:record.code,status,slaMinutes:sla,accessGrantMinutes:grant},'personal_service_catalog');
      return record;
    });
  }

  async platformCases(actorId: string) {
    const authority=await this.platformOrAgent(actorId);
    return (await this.database.query(
      `SELECT personal_case.id,personal_case.organization_id,personal_case.ticket_id,
        personal_case.status,personal_case.service_code,personal_case.sla_due_at,
        personal_case.created_at,personal_case.assigned_support_agent_user_id,
        requester.display_name AS requester_name,agent.display_name AS assigned_agent_name,
        $2::boolean AS can_administer,
        ($3::boolean AND (personal_case.status='QUEUED' OR personal_case.assigned_support_agent_user_id=$1)) AS can_operate
       FROM personal_support_cases personal_case
       JOIN organizations organization ON organization.id=personal_case.organization_id
         AND organization.workspace_type='PERSONAL'
       JOIN users requester ON requester.id=personal_case.requested_by_user_id
       LEFT JOIN users agent ON agent.id=personal_case.assigned_support_agent_user_id
       WHERE $2::boolean OR personal_case.status='QUEUED' OR personal_case.assigned_support_agent_user_id=$1
       ORDER BY CASE WHEN personal_case.status='QUEUED' THEN 0 ELSE 1 END,personal_case.created_at`,
      [actorId,authority.platform,authority.agent],
    )).rows;
  }

  async accept(agentId: string, caseId: string) {
    await this.activeAgent(agentId);
    const raw=await this.rawCase(caseId);
    return this.database.withOrganization(raw.organization_id, async (client) => {
      const personalCase=(await client.query<AgentCase & {access_grant_minutes_snapshot:number;sla_minutes_snapshot:number;capacity_reservation_id:string|null}>(
        `SELECT organization_id,ticket_id,requested_by_user_id,status,assigned_support_agent_user_id,
          access_grant_minutes_snapshot,sla_minutes_snapshot,capacity_reservation_id
         FROM personal_support_cases WHERE id=$1 FOR UPDATE`, [caseId],
      )).rows[0];
      if (!personalCase || personalCase.status!=='QUEUED') throw new NotFoundException('پرونده برای پذیرش در دسترس نیست.');
      await this.activeAgent(agentId,client);
      if(personalCase.capacity_reservation_id) await this.capacity.settle(client,personalCase.capacity_reservation_id,caseId,agentId);
      const grant=(await client.query<{id:string}>(
        `INSERT INTO support_access_grants(
          organization_id,support_agent_user_id,scope,ticket_id,allows_restricted,
          expires_at,created_by_user_id,grant_source,personal_support_case_id
         ) VALUES($1,$2,'ROUTED_ONLY',$3,true,
           now()+($4::text||' minutes')::interval,$2,'PERSONAL_SUPPORT',$5)
         RETURNING id`,
        [personalCase.organization_id,agentId,personalCase.ticket_id,personalCase.access_grant_minutes_snapshot,caseId],
      )).rows[0];
      const record=(await client.query<{id:string;status:string;sla_due_at:Date}>(
        `UPDATE personal_support_cases
         SET status='ACCEPTED',assigned_support_agent_user_id=$2,accepted_at=now(),
             sla_due_at=now()+($3::text||' minutes')::interval,updated_at=now()
         WHERE id=$1 RETURNING id,status,sla_due_at`,
        [caseId,agentId,personalCase.sla_minutes_snapshot],
      )).rows[0];
      await this.audit(client,personalCase.organization_id,agentId,'personal_support.accepted',caseId,{grantId:grant.id,status:'ACCEPTED'});
      return record;
    });
  }

  async changeState(agentId: string, caseId: string, status?: string) {
    if (!status || !['IN_PROGRESS','WAITING_FOR_USER','COMPLETED'].includes(status)) throw new BadRequestException('وضعیت پرونده معتبر نیست.');
    await this.activeAgent(agentId);
    const raw=await this.rawCase(caseId);
    return this.database.withOrganization(raw.organization_id, async (client) => {
      const personalCase=(await client.query<AgentCase & {capacity_reservation_id:string|null}>(
        `SELECT organization_id,ticket_id,requested_by_user_id,status,assigned_support_agent_user_id,capacity_reservation_id
         FROM personal_support_cases WHERE id=$1 FOR UPDATE`, [caseId],
      )).rows[0];
      if (!personalCase || personalCase.assigned_support_agent_user_id!==agentId) throw new ForbiddenException('این پرونده به کارشناس دیگری اختصاص دارد.');
      const allowed = personalCase.status==='ACCEPTED'
        ? ['IN_PROGRESS','WAITING_FOR_USER','COMPLETED']
        : personalCase.status==='IN_PROGRESS'
          ? ['WAITING_FOR_USER','COMPLETED']
          : personalCase.status==='WAITING_FOR_USER' ? ['IN_PROGRESS','COMPLETED'] : [];
      if (!allowed.includes(status)) throw new BadRequestException('گذار وضعیت پرونده مجاز نیست.');
      await this.requireActiveGrant(client,agentId,caseId);
      const record=(await client.query<{id:string;status:string}>(
        `UPDATE personal_support_cases SET status=$2,
          completed_at=CASE WHEN $2='COMPLETED' THEN now() ELSE completed_at END,updated_at=now()
         WHERE id=$1 RETURNING id,status`, [caseId,status],
      )).rows[0];
      if (status==='COMPLETED') await this.revokeGrant(client,caseId,agentId);
      await this.audit(client,personalCase.organization_id,agentId,'personal_support.state_changed',caseId,{status});
      return record;
    });
  }

  async reject(actorId: string, caseId: string, note?: string) {
    return this.closeByPlatform(actorId,caseId,'REJECTED',note);
  }

  async revoke(actorId: string, caseId: string, note?: string) {
    return this.closeByPlatform(actorId,caseId,'REVOKED',note);
  }

  async ticket(agentId: string, caseId: string) {
    return this.withAgentCase(agentId,caseId,async (client,personalCase)=>(await client.query(
      `SELECT ticket.id,ticket.ticket_number,ticket.title,ticket.description,ticket.status,
        ticket.priority,ticket.created_at,ticket.updated_at,requester.display_name AS requester_display_name
       FROM tickets ticket JOIN users requester ON requester.id=ticket.requester_user_id
       WHERE ticket.id=$1`, [personalCase.ticket_id],
    )).rows[0]);
  }

  async messages(agentId: string, caseId: string) {
    return this.withAgentCase(agentId,caseId,async (client,personalCase)=>(await client.query(
      `SELECT message.id,message.author_user_id,author.display_name AS author_display_name,
        message.body,message.created_at
       FROM ticket_messages message JOIN users author ON author.id=message.author_user_id
       WHERE message.ticket_id=$1 ORDER BY message.created_at,message.id`, [personalCase.ticket_id],
    )).rows);
  }

  async addMessage(agentId: string, caseId: string, body?: string) {
    const text=body?.trim()??'';
    if (!text || text.length>10000) throw new BadRequestException('متن پیام معتبر نیست.');
    const result=await this.withAgentCase(agentId,caseId,async (client,personalCase)=>{
      const record=(await client.query<{id:string;author_user_id:string;body:string;created_at:Date}>(
        `INSERT INTO ticket_messages(organization_id,ticket_id,author_user_id,body)
         VALUES($1,$2,$3,$4) RETURNING id,author_user_id,body,created_at`,
        [personalCase.organization_id,personalCase.ticket_id,agentId,text],
      )).rows[0];
      await client.query(
        `INSERT INTO ticket_activities(organization_id,ticket_id,actor_user_id,activity_type,visibility)
         VALUES($1,$2,$3,'personal_support.message_posted','REQUESTER')`,
        [personalCase.organization_id,personalCase.ticket_id,agentId],
      );
      await this.audit(client,personalCase.organization_id,agentId,'personal_support.message_posted',caseId,{});
      return {message:record,personalCase};
    });
    await this.notifications.publish(result.personalCase.organization_id,[result.personalCase.requested_by_user_id],{
      type:'personal_support.message_posted',ticketId:result.personalCase.ticket_id,occurredAt:result.message.created_at.toISOString(),
    });
    return result.message;
  }

  private async closeByPlatform(actorId:string,caseId:string,status:'REJECTED'|'REVOKED',note?:string) {
    await this.platform(actorId);
    const closureNote=note?.trim()??'';
    if (closureNote.length<2 || closureNote.length>1000) throw new BadRequestException('دلیل معتبر الزامی است.');
    const raw=await this.rawCase(caseId);
    return this.database.withOrganization(raw.organization_id,async client=>{
      const personalCase=(await client.query<AgentCase & {capacity_reservation_id:string|null}>(
        `SELECT organization_id,ticket_id,requested_by_user_id,status,assigned_support_agent_user_id,capacity_reservation_id
         FROM personal_support_cases WHERE id=$1 FOR UPDATE`,[caseId],
      )).rows[0];
      const allowed=status==='REJECTED' ? ['QUEUED'] : ['ACCEPTED','IN_PROGRESS','WAITING_FOR_USER'];
      if(!personalCase||!allowed.includes(personalCase.status)) throw new NotFoundException('پرونده در این وضعیت قابل تغییر نیست.');
      const record=(await client.query<{id:string;status:string}>(
        `UPDATE personal_support_cases SET status=$2,closure_note=$3,
          revoked_at=CASE WHEN $2='REVOKED' THEN now() ELSE revoked_at END,updated_at=now()
         WHERE id=$1 RETURNING id,status`,[caseId,status,closureNote],
      )).rows[0];
      if(status==='REJECTED'&&personalCase.capacity_reservation_id) await this.capacity.release(client,personalCase.capacity_reservation_id,actorId,'PLATFORM_REJECTED');
      if(status==='REVOKED') await this.revokeGrant(client,caseId,actorId);
      await this.audit(client,raw.organization_id,actorId,`personal_support.${status.toLowerCase()}`,caseId,{status});
      return record;
    });
  }

  private async withAgentCase<T>(agentId:string,caseId:string,work:(client:PoolClient,personalCase:AgentCase)=>Promise<T>) {
    await this.activeAgent(agentId);
    const raw=await this.rawCase(caseId);
    return this.database.withOrganization(raw.organization_id,async client=>{
      const personalCase=(await client.query<AgentCase>(
        `SELECT organization_id,ticket_id,requested_by_user_id,status,assigned_support_agent_user_id
         FROM personal_support_cases WHERE id=$1`,[caseId],
      )).rows[0];
      if(!personalCase||personalCase.assigned_support_agent_user_id!==agentId) throw new ForbiddenException('دسترسی به پرونده مجاز نیست.');
      await this.requireActiveGrant(client,agentId,caseId);
      return work(client,personalCase);
    });
  }

  private async requireActiveGrant(client:PoolClient,agentId:string,caseId:string) {
    const grant=await client.query(
      `SELECT 1 FROM support_access_grants
       WHERE personal_support_case_id=$1 AND support_agent_user_id=$2
         AND grant_source='PERSONAL_SUPPORT' AND revoked_at IS NULL
         AND starts_at<=now() AND expires_at>now()
       FOR UPDATE`,[caseId,agentId],
    );
    if(!grant.rowCount) throw new ForbiddenException('مجوز فعال این پرونده در دسترس نیست.');
  }

  private revokeGrant(client:PoolClient,caseId:string,actorId:string) {
    return client.query(
      `UPDATE support_access_grants
       SET revoked_at=COALESCE(revoked_at,now()),revoked_by_user_id=COALESCE(revoked_by_user_id,$2)
       WHERE personal_support_case_id=$1 AND grant_source='PERSONAL_SUPPORT'`,[caseId,actorId],
    );
  }

  private async rawCase(caseId:string) {
    const row=(await this.database.query<AgentCase>(
      `SELECT personal_case.organization_id,personal_case.ticket_id,personal_case.requested_by_user_id,
        personal_case.status,personal_case.assigned_support_agent_user_id
       FROM personal_support_cases personal_case
       JOIN organizations organization ON organization.id=personal_case.organization_id
         AND organization.workspace_type='PERSONAL'
       WHERE personal_case.id=$1`,[caseId],
    )).rows[0];
    if(!row) throw new NotFoundException('پرونده پشتیبانی شخصی یافت نشد.');
    return row;
  }

  private async personalOwner(actor:TicketActor) {
    const row=(await this.database.query<{personal_owner_user_id:string}>(
      `SELECT personal_owner_user_id FROM organizations
       WHERE id=$1 AND workspace_type='PERSONAL' AND status='active'`,[actor.organizationId],
    )).rows[0];
    if(!row||row.personal_owner_user_id!==actor.userId||!actor.roles.includes('REQUESTER')) throw new ForbiddenException('فضای شخصی معتبر نیست.');
  }

  private async platform(userId:string) {
    const row=(await this.database.query<{is_platform_admin:boolean}>(
      'SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true',[userId],
    )).rows[0];
    if(!row?.is_platform_admin) throw new ForbiddenException();
  }

  private async activeAgent(userId:string,client?:PoolClient) {
    const sql=`SELECT agent.user_id FROM jupiter_support_agents agent
      JOIN users user_account ON user_account.id=agent.user_id AND user_account.is_active=true
      WHERE agent.user_id=$1 AND agent.status='ACTIVE'`;
    const row=client
      ? (await client.query<{user_id:string}>(sql,[userId])).rows[0]
      : (await this.database.query<{user_id:string}>(sql,[userId])).rows[0];
    if(!row) throw new ForbiddenException('کارشناس فعال Jupiter نیستید.');
    return row;
  }

  private async platformOrAgent(userId:string) {
    const row=(await this.database.query<{is_platform_admin:boolean;is_agent:boolean}>(
      `SELECT user_account.is_platform_admin,
        EXISTS(SELECT 1 FROM jupiter_support_agents agent WHERE agent.user_id=user_account.id AND agent.status='ACTIVE') AS is_agent
       FROM users user_account WHERE user_account.id=$1 AND user_account.is_active=true`,[userId],
    )).rows[0];
    if(!row||( !row.is_platform_admin && !row.is_agent)) throw new ForbiddenException();
    return {platform:row.is_platform_admin,agent:row.is_agent};
  }

  private audit(client:PoolClient,organizationId:string|null,actorId:string,action:string,targetId:string,metadata:object,targetType='personal_support_case') {
    return client.query(
      `INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [organizationId,actorId,action,targetType,targetId,metadata],
    );
  }
}
