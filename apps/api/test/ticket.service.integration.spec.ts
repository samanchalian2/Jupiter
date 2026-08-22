import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { TicketService } from '../src/tickets/ticket.service.js';

const database = new DatabaseService();
const tickets = new TicketService(database);
let organizationId = '';
let managerId = '';
let expertId = '';
const actor = () => ({ userId: managerId, organizationId, roles: ['ORG_ADMIN'] });

beforeAll(async () => {
  const organization = await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id', ['goal4-test','GOAL 4 Test']);
  organizationId = organization.rows[0].id;
  const users = await database.query<{id:string;email:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3),($4,$5,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id,email', ['goal4-manager@jupiter.local','Goal 4 Manager','scrypt$AA$AA','goal4-expert@jupiter.local','Goal 4 Expert']);
  managerId = users.rows.find((user) => user.email === 'goal4-manager@jupiter.local')!.id;
  expertId = users.rows.find((user) => user.email === 'goal4-expert@jupiter.local')!.id;
  await database.query('INSERT INTO memberships(organization_id,user_id) VALUES($1,$2),($1,$3) ON CONFLICT DO NOTHING', [organizationId,managerId,expertId]);
  await database.query('INSERT INTO membership_roles(membership_id,role_id) SELECT m.id,r.id FROM memberships m JOIN roles r ON r.code=CASE WHEN m.user_id=$2 THEN \'ORG_ADMIN\' ELSE \'EXPERT\' END WHERE m.organization_id=$1 AND m.user_id IN($2,$3) ON CONFLICT DO NOTHING', [organizationId,managerId,expertId]);
});

afterAll(async () => {
  await database.query('DELETE FROM assignment_rules WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_assignments WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_status_transitions WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM tickets WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM ticket_tags WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM memberships WHERE organization_id=$1', [organizationId]);
  await database.query('DELETE FROM organizations WHERE id=$1', [organizationId]);
  await database.query('DELETE FROM users WHERE email IN($1,$2)', ['goal4-manager@jupiter.local','goal4-expert@jupiter.local']);
  await database.onModuleDestroy();
});

describe('TicketService integration', () => {
  it('creates, submits, assigns, and transitions a tenant-scoped ticket', async () => {
    const draft = await tickets.createDraft(actor(), { title:'Lifecycle validation', description:'Exercise the ticket core.' });
    expect(draft.status).toBe('DRAFT');
    const submitted = await tickets.submit(actor(), draft.id);
    expect(submitted.status).toBe('OPEN');
    const assignment = await tickets.assign(actor(), draft.id, expertId);
    expect(assignment.assigned_to_user_id).toBe(expertId);
    expect((await tickets.assignees(actor())).map((user) => user.id)).toContain(expertId);
    const active = await tickets.changeStatus({ userId:expertId,organizationId,roles:['EXPERT'] }, draft.id, 'IN_PROGRESS');
    expect(active.status).toBe('IN_PROGRESS');
    const queue = await tickets.page(actor(), { sort: 'recent' });
    const queued = queue.items.find((ticket) => ticket.id === draft.id) as { updated_at?: Date; last_activity_at?: Date } | undefined;
    expect(queued?.last_activity_at).toBeTruthy();
    expect(new Date(queued!.last_activity_at!).getTime()).toBeGreaterThanOrEqual(new Date(queued!.updated_at!).getTime());
    expect((await tickets.get(actor(), draft.id) as { id:string }).id).toBe(draft.id);
    expect((await tickets.get({ userId:expertId,organizationId,roles:['EXPERT'] }, draft.id) as { id:string }).id).toBe(draft.id);
    const activeQueue = await tickets.page(actor(), { status: 'OPEN,IN_PROGRESS' });
    expect(activeQueue.items.map((ticket) => ticket.id)).toContain(draft.id);
  });

  it('applies an active organization assignment rule to a new ticket', async () => {
    await database.query('INSERT INTO assignment_rules(organization_id,assignee_user_id) VALUES($1,$2) ON CONFLICT(organization_id,department_id) DO UPDATE SET assignee_user_id=EXCLUDED.assignee_user_id,is_active=true', [organizationId, expertId]);
    const draft = await tickets.createDraft(actor(), { title:'Automatic assignment', description:'Exercise the assignment rule.' });
    const assignment = await database.query<{assigned_to_user_id:string}>('SELECT assigned_to_user_id FROM ticket_assignments WHERE ticket_id=$1 AND ended_at IS NULL', [draft.id]);
    expect(assignment.rows[0]?.assigned_to_user_id).toBe(expertId);
  });

  it('links approved tags at draft creation and filters/searches the tenant queue by tag', async () => {
    const tag=(await database.query<{id:string}>("INSERT INTO ticket_tags(organization_id,name,color,kind,status,normalized_name) VALUES($1,'پرینتر','#6d5587','SERVICE_ASSET','ACTIVE','پرینتر') RETURNING id",[organizationId])).rows[0];
    const draft=await tickets.createDraft(actor(),{title:'خطای چاپ پرینتر',description:'پرینتر اتاق جلسات چاپ نمی‌کند.',tags:[{id:tag.id,name:'پرینتر',kind:'SERVICE_ASSET'}]});
    const byTag=await tickets.page(actor(),{tag:tag.id});
    const bySearch=await tickets.list(actor(),{query:'پرینتر'});
    expect(byTag.items.map(ticket=>ticket.id)).toContain(draft.id);
    expect(bySearch.map(ticket=>ticket.id)).toContain(draft.id);
    expect((await tickets.tags(actor())).map(item=>item.id)).toContain(tag.id);
  });
});
