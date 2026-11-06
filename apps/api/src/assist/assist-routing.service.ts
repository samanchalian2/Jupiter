import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { CommercialService } from '../commercial/commercial.service.js';
import type { TicketActor } from '../tickets/ticket-actor.service.js';

export type AssistAvailability = {enabled:boolean;available:boolean;direct:boolean;reason:string|null};
type Policy = {request_policy:string;self_service_enabled:boolean|null};

@Injectable()
export class AssistRoutingService {
  constructor(private readonly database:DatabaseService,private readonly commercial:CommercialService) {}

  async availabilityWithClient(client:PoolClient,actor:TicketActor):Promise<AssistAvailability> {
    const org=(await client.query<{status:string;workspace_type:string}>('SELECT status,workspace_type FROM organizations WHERE id=$1',[actor.organizationId])).rows[0];
    const policy=(await client.query<Policy>('SELECT request_policy,self_service_enabled FROM organization_assist_policies WHERE organization_id=$1',[actor.organizationId])).rows[0];
    const enabled=policy?.self_service_enabled??Boolean(policy&&policy.request_policy!=='DISABLED');
    const direct=policy?.self_service_enabled===true||Boolean(policy&&['AUTO_OVERFLOW','ALWAYS_ROUTE'].includes(policy.request_policy));
    const deny=(reason:string)=>({enabled,available:false,direct,reason});
    if(org?.workspace_type!=='ORGANIZATION')return deny('ORGANIZATION_ONLY');
    if(!enabled)return deny('ORGANIZATION_DISABLED');
    if(org.status!=='active')return deny('ORGANIZATION_NOT_ACTIVE');
    const effective=await this.commercial.resolve(actor.organizationId,'JUPITER_ASSIST');
    if(!effective.effective)return deny('SERVICE_UNAVAILABLE');
    const capacity=await client.query(`SELECT a.id FROM organization_assist_capacity_allocations a
      LEFT JOIN assist_capacity_packages p ON p.id=a.assist_capacity_package_id
      LEFT JOIN assist_capacity_ledger l ON l.allocation_id=a.id
      WHERE a.organization_id=$1 AND a.status='ACTIVE' AND a.starts_at<=now()
      AND (a.expires_at IS NULL OR a.expires_at>now()) AND (p.id IS NULL OR p.status='ACTIVE')
      GROUP BY a.id HAVING COALESCE(sum(l.unit_delta),0)>0 LIMIT 1`,[actor.organizationId]);
    if(!capacity.rowCount)return deny('CAPACITY_UNAVAILABLE');
    return {enabled,available:true,direct,reason:null};
  }
  availability(actor:TicketActor) {return this.database.withOrganization(actor.organizationId,c=>this.availabilityWithClient(c,actor));}

  async saveSetting(actor:TicketActor,enabled:unknown) {
    if(!actor.roles.some(r=>r==='ORG_ADMIN'||r==='ORG_OWNER'))throw new ForbiddenException();
    if(typeof enabled!=='boolean')throw new BadRequestException('فعال یا غیرفعال بودن را مشخص کنید.');
    return this.database.withOrganization(actor.organizationId,async c=>{
      if(!(await c.query("SELECT id FROM organizations WHERE id=$1 AND workspace_type='ORGANIZATION' FOR UPDATE",[actor.organizationId])).rowCount)throw new ForbiddenException();
      await c.query(`INSERT INTO organization_assist_policies(organization_id,self_service_enabled,updated_by_user_id)
        VALUES($1,$2,$3) ON CONFLICT(organization_id) DO UPDATE SET self_service_enabled=$2,updated_by_user_id=$3,updated_at=now()`,[actor.organizationId,enabled,actor.userId]);
      await c.query("INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,'assist.organization_permission_changed','organization_assist_policy',$1,$3)",[actor.organizationId,actor.userId,{enabled}]);
      return this.availabilityWithClient(c,actor);
    });
  }

  async requestWithClient(c:PoolClient,actor:TicketActor,ticketId:string,note?:string) {
    const ticket=(await c.query<{id:string;status:string}>("SELECT id,status FROM tickets WHERE id=$1 AND requester_user_id=$2 FOR UPDATE",[ticketId,actor.userId])).rows[0];
    if(!ticket)throw new NotFoundException('تیکت در دسترس نیست.');
    const existing=(await c.query<{id:string;status:string}>('SELECT id,status FROM assist_cases WHERE ticket_id=$1',[ticketId])).rows[0];
    if(existing)return existing;
    if(['DRAFT','RESOLVED','CLOSED'].includes(ticket.status))throw new BadRequestException('برای این وضعیت تیکت درخواست پشتیبانی مجاز نیست.');
    const message=note?.trim()||null;
    if(message&&message.length>1000)throw new BadRequestException('توضیح درخواست طولانی است.');
    const policy=(await c.query<Policy>('SELECT request_policy,self_service_enabled FROM organization_assist_policies WHERE organization_id=$1 FOR SHARE',[actor.organizationId])).rows[0];
    const availability=await this.availabilityWithClient(c,actor);
    // Legacy policies may queue at zero capacity; ACCEPT still enforces all gates.
    // Explicit organization self-service consent uses the new preflight gates.
    if(policy?.self_service_enabled!==null&&policy?.self_service_enabled!==undefined){
      if(!availability.available)throw new ForbiddenException({message:'پشتیبانی تیم ژوپیتر در دسترس نیست؛ روش رسیدگی را بررسی کنید.',reason:availability.reason});
    }else if(!policy||policy.request_policy==='DISABLED')throw new ForbiddenException('پشتیبانی ژوپیتر برای سازمان فعال نیست.');
    const status=availability.direct?'QUEUED':policy?.request_policy==='ADMIN_APPROVAL_REQUIRED'?'PENDING_APPROVAL':'REQUESTED';
    const row=(await c.query<{id:string;status:string}>(`INSERT INTO assist_cases(organization_id,ticket_id,requested_by_user_id,status,request_note,ticket_only_delegation)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status`,[actor.organizationId,ticketId,actor.userId,status,message,policy?.self_service_enabled===true])).rows[0];
    await c.query("INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,'assist.requested','assist_case',$3,$4)",[actor.organizationId,actor.userId,row.id,{status}]);
    // Durable once per new case; never emitted for retries or rolled-back submissions.
    await c.query("INSERT INTO user_notifications(organization_id,user_id,event_type,ticket_id,occurred_at) VALUES($1,$2,'assist.queued',$3,now())",[actor.organizationId,actor.userId,ticketId]);
    return row;
  }
}
