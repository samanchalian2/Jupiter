import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { assertTransition, TicketStatus } from './ticket-lifecycle.js';
import { addBusinessMinutes } from '../sla/business-time.js';

type Actor = { userId: string; organizationId: string; roles: string[] };
export type CreateDraftData = { title:string; description:string; priority?:string; departmentId?:string; categoryId?:string; subcategoryId?:string; locationId?:string; disciplineId?:string; customFields?:Record<string,unknown> };
export type IntakeTagInput = { id?:string; name?:string; kind?:'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER' };
const managerRoles = new Set(['ORG_ADMIN', 'SUPERVISOR']);
const workerRoles = new Set(['ORG_ADMIN', 'SUPERVISOR', 'EXPERT']);
const readableCatalogs = new Set(['departments', 'categories', 'subcategories', 'locations', 'disciplines']);

@Injectable()
export class TicketService {
  constructor(private readonly database: DatabaseService) {}

  async createDraft(actor: Actor, data: CreateDraftData) {
    return this.database.withOrganization(actor.organizationId, (client) => this.createDraftWithClient(client, actor, data));
  }

  async createDraftWithClient(client: PoolClient, actor: Actor, data: CreateDraftData) {
      const result = await client.query(
        'INSERT INTO tickets(organization_id,requester_user_id,title,description,priority,department_id,category_id,subcategory_id,location_id,discipline_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,ticket_number,status,title,description,priority,created_at',
        [actor.organizationId, actor.userId, data.title, data.description, data.priority ?? 'NORMAL', data.departmentId ?? null, data.categoryId ?? null, data.subcategoryId ?? null, data.locationId ?? null, data.disciplineId ?? null],
      );
      const definitions=(await client.query<{id:string;field_key:string;field_type:string;options:unknown[];is_required:boolean}>('SELECT id,field_key,field_type,options,is_required FROM ticket_custom_field_definitions WHERE is_active=true ORDER BY sort_order,label')).rows;
      for(const definition of definitions){const value=data.customFields?.[definition.field_key];if((value===undefined||value===''||value===null)&&definition.is_required) throw new ForbiddenException(`Custom field ${definition.field_key} is required`);if(value===undefined||value===''||value===null)continue;if(definition.field_type==='NUMBER'&&typeof value!=='number'&&Number.isNaN(Number(value)))throw new ForbiddenException(`Custom field ${definition.field_key} must be numeric`);if(definition.field_type==='BOOLEAN'&&typeof value!=='boolean')throw new ForbiddenException(`Custom field ${definition.field_key} must be boolean`);if(definition.field_type==='SELECT'&&!(definition.options??[]).includes(value))throw new ForbiddenException(`Custom field ${definition.field_key} has invalid option`);await client.query('INSERT INTO ticket_custom_field_values(organization_id,ticket_id,field_id,value) VALUES($1,$2,$3,$4)',[actor.organizationId,result.rows[0].id,definition.id,JSON.stringify(value)]);}
      const policy = (await client.query<{id:string;first_response_minutes:number;resolution_minutes:number}>('SELECT id,first_response_minutes,resolution_minutes FROM sla_policies WHERE priority=$1 AND is_active=true ORDER BY id LIMIT 1',[data.priority ?? 'NORMAL'])).rows[0];
      if (policy) { const calendar=(await client.query<{timezone:string;workdays:number[];start_minute:number;end_minute:number}>('SELECT timezone,workdays,start_minute,end_minute FROM business_calendars WHERE organization_id=$1',[actor.organizationId])).rows[0]??{timezone:'UTC',workdays:[1,2,3,4,5],start_minute:480,end_minute:1020}; const now=new Date(); await client.query('INSERT INTO ticket_sla_clocks(ticket_id,organization_id,policy_id,first_response_due_at,resolution_due_at) VALUES($1,$2,$3,$4,$5)',[result.rows[0].id,actor.organizationId,policy.id,addBusinessMinutes(now,policy.first_response_minutes,{timezone:calendar.timezone,workdays:calendar.workdays,startMinute:calendar.start_minute,endMinute:calendar.end_minute}),addBusinessMinutes(now,policy.resolution_minutes,{timezone:calendar.timezone,workdays:calendar.workdays,startMinute:calendar.start_minute,endMinute:calendar.end_minute})]); }
      const assignmentRule=(await client.query<{assignee_user_id:string}>('SELECT assignee_user_id FROM assignment_rules WHERE is_active=true AND (department_id=$1 OR department_id IS NULL) ORDER BY department_id NULLS LAST LIMIT 1',[data.departmentId??null])).rows[0];
      if (assignmentRule) { await client.query('INSERT INTO ticket_assignments(organization_id,ticket_id,assigned_to_user_id,assigned_by_user_id) VALUES($1,$2,$3,$4)',[actor.organizationId,result.rows[0].id,assignmentRule.assignee_user_id,actor.userId]); await this.activity(client,actor,result.rows[0].id,'ticket.auto_assigned','STAFF',{assignedToUserId:assignmentRule.assignee_user_id}); }
      await this.activity(client, actor, result.rows[0].id, 'ticket.draft_created', 'REQUESTER');
      return result.rows[0];
  }

  async attachIntakeTagsWithClient(client: PoolClient, actor: Actor, ticketId: string, inputs: IntakeTagInput[]) {
    const acceptedKinds = new Set(['DOMAIN','SERVICE_ASSET','ISSUE_TYPE','IMPACT_SCOPE','CONTEXT','OTHER']);
    for (const input of inputs.slice(0,5)) {
      let tag: {id:string;status:string}|undefined;
      if (input.id) tag=(await client.query<{id:string;status:string}>('SELECT id,status FROM ticket_tags WHERE id=$1 AND status=\'ACTIVE\'',[input.id])).rows[0];
      else if (input.name && input.kind && acceptedKinds.has(input.kind)) {
        const name=input.name.trim().replace(/\s+/g,' '); if(name.length<2||name.length>50) continue;
        const normalized=name.toLocaleLowerCase('fa-IR');
        tag=(await client.query<{id:string;status:string}>(`INSERT INTO ticket_tags(organization_id,name,color,kind,status,normalized_name) VALUES($1,$2,'#6d5587',$3,'PENDING',$4)
          ON CONFLICT(organization_id,normalized_name) DO UPDATE SET name=ticket_tags.name RETURNING id,status`,[actor.organizationId,name,input.kind,normalized])).rows[0];
      }
      if (!tag) continue;
      const linked=await client.query('INSERT INTO ticket_tag_links(ticket_id,tag_id,organization_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING tag_id',[ticketId,tag.id,actor.organizationId]);
      if(linked.rowCount) await client.query('UPDATE ticket_tags SET usage_count=usage_count+1 WHERE id=$1',[tag.id]);
    }
  }

  async submit(actor: Actor, ticketId: string) { return this.changeStatus(actor, ticketId, 'OPEN'); }

  async changeStatus(actor: Actor, ticketId: string, to: TicketStatus, reason?: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const ticket = await this.ticket(client, ticketId);
      const isOwner = ticket.requester_user_id === actor.userId;
      if (ticket.status === 'DRAFT' && !isOwner) throw new ForbiddenException();
      if (ticket.status !== 'DRAFT' && !isOwner && !actor.roles.some((role) => workerRoles.has(role))) throw new ForbiddenException();
      if (to !== 'OPEN' && isOwner && !['RESOLVED', 'CLOSED'].includes(ticket.status)) throw new ForbiddenException();
      assertTransition(ticket.status, to);
      await client.query('UPDATE tickets SET status=$1,updated_at=now() WHERE id=$2', [to, ticketId]);
      await client.query('INSERT INTO ticket_status_transitions(organization_id,ticket_id,from_status,to_status,changed_by_user_id,reason) VALUES($1,$2,$3,$4,$5,$6)', [actor.organizationId,ticketId,ticket.status,to,actor.userId,reason ?? null]);
      await this.activity(client, actor, ticketId, 'ticket.status_changed', 'REQUESTER', { from: ticket.status, to });
      return { ...ticket, status: to };
    });
  }

  async assign(actor: Actor, ticketId: string, assignedToUserId: string) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ticket(client, ticketId);
      const assignee = await client.query('SELECT 1 FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.user_id=$2 AND m.status=\'active\' AND r.code IN (\'EXPERT\',\'SUPERVISOR\',\'ORG_ADMIN\')', [actor.organizationId,assignedToUserId]);
      if (!assignee.rowCount) throw new NotFoundException('Eligible assignee not found');
      await client.query('UPDATE ticket_assignments SET ended_at=now() WHERE ticket_id=$1 AND ended_at IS NULL', [ticketId]);
      const assignment = await client.query('INSERT INTO ticket_assignments(organization_id,ticket_id,assigned_to_user_id,assigned_by_user_id) VALUES($1,$2,$3,$4) RETURNING id,assigned_to_user_id,assigned_at', [actor.organizationId,ticketId,assignedToUserId,actor.userId]);
      await this.activity(client, actor, ticketId, 'ticket.assigned', 'STAFF', { assignedToUserId });
      return assignment.rows[0];
    });
  }

  async get(actor: Actor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const worker = actor.roles.some((role) => managerRoles.has(role));
      const expert = actor.roles.includes('EXPERT');
      const access = worker ? '' : expert
        ? ' AND EXISTS(SELECT 1 FROM ticket_assignments mine WHERE mine.ticket_id=t.id AND mine.assigned_to_user_id=$2 AND mine.ended_at IS NULL)'
        : ' AND t.requester_user_id=$2';
      const ticket = (await client.query(
        `SELECT t.id,t.ticket_number,t.title,t.description,t.status,t.priority,t.requester_user_id,t.created_at,t.updated_at,
         GREATEST(t.updated_at,
           COALESCE((SELECT max(message.created_at) FROM ticket_messages message WHERE message.ticket_id=t.id),t.updated_at),
           COALESCE((SELECT max(activity.created_at) FROM ticket_activities activity WHERE activity.ticket_id=t.id AND activity.visibility='REQUESTER'),t.updated_at)) AS last_activity_at,
         requester.display_name AS requester_display_name,
         department.name AS department_name,category.name AS category_name,location.name AS location_name,
         assignee.id AS assigned_to_user_id,assignee.display_name AS assignee_display_name,
         sla.resolution_due_at,sla.warning_at,sla.breached_at,
         COALESCE((SELECT json_agg(json_build_object('key',definition.field_key,'label',definition.label,'value',field_value.value) ORDER BY definition.sort_order,definition.label)
           FROM ticket_custom_field_values field_value JOIN ticket_custom_field_definitions definition ON definition.id=field_value.field_id
           WHERE field_value.ticket_id=t.id),'[]'::json) AS custom_fields,
         COALESCE((SELECT json_agg(json_build_object('id',tag.id,'name',tag.name,'color',tag.color) ORDER BY tag.name)
           FROM ticket_tag_links link JOIN ticket_tags tag ON tag.id=link.tag_id WHERE link.ticket_id=t.id),'[]'::json) AS tags
         FROM tickets t
         JOIN users requester ON requester.id=t.requester_user_id
         LEFT JOIN departments department ON department.id=t.department_id
         LEFT JOIN categories category ON category.id=t.category_id
         LEFT JOIN locations location ON location.id=t.location_id
         LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL
         LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id
         LEFT JOIN ticket_sla_clocks sla ON sla.ticket_id=t.id
         WHERE t.id=$1${access}`,
        worker ? [ticketId] : [ticketId, actor.userId],
      )).rows[0];
      if (!ticket) throw new NotFoundException('Ticket not found');
      return ticket;
    });
  }

  async list(actor: Actor, filters: { status?: string; priority?: string; query?: string; sort?: string } = {}) {
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const conditions = '($1::uuid IS NOT NULL) AND ($2::text IS NULL OR t.status=ANY(string_to_array($2,\',\'))) AND ($3::text IS NULL OR t.priority=$3) AND ($4::text IS NULL OR t.title ILIKE \'%\'||$4||\'%\')';
      const orderBy = filters.sort === 'oldest' ? 't.created_at ASC' : filters.sort === 'priority' ? "CASE t.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END, t.created_at DESC" : filters.sort === 'recent' ? 'last_activity_at DESC,t.created_at DESC' : 't.created_at DESC';
      const fields = `t.id,t.ticket_number,t.title,t.description,t.status,t.priority,t.requester_user_id,t.created_at,t.updated_at,
        GREATEST(t.updated_at,
          COALESCE((SELECT max(message.created_at) FROM ticket_messages message WHERE message.ticket_id=t.id),t.updated_at),
          COALESCE((SELECT max(activity.created_at) FROM ticket_activities activity WHERE activity.ticket_id=t.id AND activity.visibility='REQUESTER'),t.updated_at)) AS last_activity_at,
        assignee.id AS assigned_to_user_id, assignee.display_name AS assignee_display_name,
        COALESCE((SELECT json_agg(json_build_object('id',tag.id,'name',tag.name,'color',tag.color) ORDER BY tag.name)
          FROM ticket_tag_links link JOIN ticket_tags tag ON tag.id=link.tag_id WHERE link.ticket_id=t.id), '[]'::json) AS tags`;
      const values = [actor.userId, filters.status ?? null, filters.priority ?? null, filters.query?.trim() || null];
      if (actor.roles.some((role) => managerRoles.has(role))) return (await client.query(`SELECT ${fields} FROM tickets t LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id WHERE ${conditions} ORDER BY ${orderBy}`, values)).rows;
      if (actor.roles.includes('EXPERT')) return (await client.query(`SELECT ${fields} FROM tickets t JOIN ticket_assignments mine ON mine.ticket_id=t.id AND mine.ended_at IS NULL AND mine.assigned_to_user_id=$1 LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id WHERE ${conditions} ORDER BY ${orderBy}`, values)).rows;
      return (await client.query(`SELECT ${fields} FROM tickets t LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id WHERE t.requester_user_id=$1 AND ${conditions} ORDER BY ${orderBy}`, values)).rows;
    });
  }

  async page(actor: Actor, filters: { status?: string; priority?: string; query?: string; sort?: string; page?: number; pageSize?: number } = {}) {
    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const pageSize = Math.min(100, Math.max(10, Math.floor(filters.pageSize ?? 20)));
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const base = '($1::uuid IS NOT NULL) AND ($2::text IS NULL OR t.status=ANY(string_to_array($2,\',\'))) AND ($3::text IS NULL OR t.priority=$3) AND ($4::text IS NULL OR t.title ILIKE \'%\'||$4||\'%\')';
      const orderBy = filters.sort === 'oldest' ? 't.created_at ASC' : filters.sort === 'priority' ? "CASE t.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END, t.created_at DESC" : filters.sort === 'recent' ? 'last_activity_at DESC,t.created_at DESC' : 't.created_at DESC';
      const fields = `t.id,t.ticket_number,t.title,t.description,t.status,t.priority,t.requester_user_id,t.created_at,t.updated_at,
        GREATEST(t.updated_at,
          COALESCE((SELECT max(message.created_at) FROM ticket_messages message WHERE message.ticket_id=t.id),t.updated_at),
          COALESCE((SELECT max(activity.created_at) FROM ticket_activities activity WHERE activity.ticket_id=t.id AND activity.visibility='REQUESTER'),t.updated_at)) AS last_activity_at,
        assignee.id AS assigned_to_user_id,assignee.display_name AS assignee_display_name,
        COALESCE((SELECT json_agg(json_build_object('id',tag.id,'name',tag.name,'color',tag.color) ORDER BY tag.name)
          FROM ticket_tag_links link JOIN ticket_tags tag ON tag.id=link.tag_id WHERE link.ticket_id=t.id), '[]'::json) AS tags`;
      const values = [actor.userId, filters.status ?? null, filters.priority ?? null, filters.query?.trim() || null, pageSize, (page - 1) * pageSize];
      const manager = actor.roles.some((role) => managerRoles.has(role));
      const expert = actor.roles.includes('EXPERT');
      const scope = manager ? '' : expert ? 'JOIN ticket_assignments mine ON mine.ticket_id=t.id AND mine.ended_at IS NULL AND mine.assigned_to_user_id=$1' : '';
      const requester = manager || expert ? '' : ' AND t.requester_user_id=$1';
      const joins = `${scope} LEFT JOIN ticket_assignments assignment ON assignment.ticket_id=t.id AND assignment.ended_at IS NULL LEFT JOIN users assignee ON assignee.id=assignment.assigned_to_user_id`;
      const [items,total] = await Promise.all([
        client.query(`SELECT ${fields} FROM tickets t ${joins} WHERE ${base}${requester} ORDER BY ${orderBy} LIMIT $5 OFFSET $6`, values),
        client.query<{total:number}>(`SELECT count(*)::int AS total FROM tickets t ${scope} WHERE ${base}${requester}`, values.slice(0, 4)),
      ]);
      return { items: items.rows, total: total.rows[0]?.total ?? 0, page, pageSize };
    });
  }

  async savedViews(actor: Actor) {
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query(
      'SELECT id,name,filters,is_shared,updated_at FROM saved_ticket_views WHERE user_id=$1 OR is_shared=true ORDER BY is_shared DESC,name', [actor.userId],
    )).rows);
  }

  async saveView(actor: Actor, input: { name: string; filters: object; isShared?: boolean }) {
    if (!input.name?.trim() || input.name.trim().length > 80) throw new ForbiddenException('View name is required.');
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query(
      `INSERT INTO saved_ticket_views(organization_id,user_id,name,filters,is_shared) VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(organization_id,user_id,name) DO UPDATE SET filters=EXCLUDED.filters,is_shared=EXCLUDED.is_shared,updated_at=now()
       RETURNING id,name,filters,is_shared,updated_at`, [actor.organizationId, actor.userId, input.name.trim(), input.filters, input.isShared ?? false],
    )).rows[0]);
  }

  async assignees(actor: Actor) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('SELECT DISTINCT u.id,u.display_name,u.email FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id JOIN users u ON u.id=m.user_id WHERE m.status=\'active\' AND r.code IN (\'EXPERT\',\'SUPERVISOR\',\'ORG_ADMIN\') ORDER BY u.display_name')).rows);
  }

  async tags(actor: Actor) { return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('SELECT id,name,color FROM ticket_tags ORDER BY name')).rows); }
  async customFields(actor: Actor) { return this.database.withOrganization(actor.organizationId,async client=>(await client.query("SELECT field_key,label,field_type,options,is_required FROM ticket_custom_field_definitions WHERE is_active=true AND label !~ '[?]' AND position(chr(65533) IN label)=0 ORDER BY sort_order,label")).rows); }

  async catalog(actor: Actor, kind: string) {
    if (!readableCatalogs.has(kind)) throw new NotFoundException('Catalog not found');
    const columns = kind === 'subcategories' ? 'id,name,category_id' : 'id,name';
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query(`SELECT ${columns} FROM ${kind} ORDER BY name`)).rows);
  }

  async createTag(actor: Actor, name: string, color = '#1769aa') {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => (await client.query('INSERT INTO ticket_tags(organization_id,name,color) VALUES($1,$2,$3) ON CONFLICT(organization_id,name) DO UPDATE SET color=EXCLUDED.color RETURNING id,name,color', [actor.organizationId,name,color])).rows[0]);
  }

  async watch(actor: Actor, ticketId: string) {
    return this.database.withOrganization(actor.organizationId, async (client) => { await this.accessibleTicket(client, actor, ticketId); return (await client.query('INSERT INTO ticket_watchers(ticket_id,user_id,organization_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING ticket_id,user_id',[ticketId,actor.userId,actor.organizationId])).rows[0]; });
  }

  async linkTag(actor: Actor, ticketId: string, tagId: string) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => {
      await this.ticket(client, ticketId);
      const tag = await client.query('SELECT id,name,color FROM ticket_tags WHERE id=$1', [tagId]);
      if (!tag.rowCount) throw new NotFoundException('Tag not found');
      await client.query('INSERT INTO ticket_tag_links(ticket_id,tag_id,organization_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [ticketId, tagId, actor.organizationId]);
      await this.activity(client, actor, ticketId, 'ticket.tagged', 'STAFF', { tagId });
      return tag.rows[0];
    });
  }

  async bulkStatus(actor: Actor, ticketIds: string[], status: TicketStatus) {
    if (!actor.roles.some((role) => managerRoles.has(role))) throw new ForbiddenException();
    const outcomes: { id: string; ok: boolean }[] = [];
    for (const id of [...new Set(ticketIds)].slice(0, 100)) {
      try { await this.changeStatus(actor,id,status,'bulk operation'); outcomes.push({id,ok:true}); } catch { outcomes.push({id,ok:false}); }
    }
    return outcomes;
  }

  private async ticket(client: PoolClient, id: string) {
    const result = await client.query<{id:string;status:TicketStatus;requester_user_id:string}>('SELECT id,status,requester_user_id FROM tickets WHERE id=$1', [id]);
    if (!result.rows[0]) throw new NotFoundException('Ticket not found');
    return result.rows[0];
  }
  private async accessibleTicket(client: PoolClient, actor: Actor, id: string) {
    const ticket = await this.ticket(client, id);
    if (ticket.requester_user_id === actor.userId || actor.roles.some((role) => managerRoles.has(role))) return ticket;
    const assigned = await client.query('SELECT 1 FROM ticket_assignments WHERE ticket_id=$1 AND assigned_to_user_id=$2 AND ended_at IS NULL', [id, actor.userId]);
    if (assigned.rowCount) return ticket;
    throw new ForbiddenException();
  }
  private async activity(client: PoolClient, actor: Actor, ticketId: string, action: string, visibility: 'REQUESTER' | 'STAFF', metadata: object = {}) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,\'ticket\',$4,$5)', [actor.organizationId,actor.userId,action,ticketId,metadata]);
    await client.query('INSERT INTO ticket_activities(organization_id,ticket_id,actor_user_id,activity_type,visibility,metadata) VALUES($1,$2,$3,$4,$5,$6)', [actor.organizationId, ticketId, actor.userId, action, visibility, metadata]);
  }
}
