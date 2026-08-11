import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { NotificationService } from '../src/notifications/notification.service.js';
import { SlaService } from '../src/sla/sla.service.js';

const database = new DatabaseService();
const service = new SlaService(database, new NotificationService());
const organizations: string[] = [];
const tickets: string[] = [];
let requester = '';

beforeAll(async () => {
  requester = (await database.query<{id:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id',['sla-test-requester@jupiter.local','SLA Test Requester','scrypt$AA$AA'])).rows[0].id;
  for (const suffix of ['a','b']) {
    const organization=(await database.query<{id:string}>('INSERT INTO organizations(slug,name) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id',[`sla-test-${suffix}`,`SLA Test ${suffix}`])).rows[0];
    organizations.push(organization.id);
    const policy=(await database.query<{id:string}>('INSERT INTO sla_policies(organization_id,name,priority,first_response_minutes,resolution_minutes,warning_minutes,escalation_role) VALUES($1,$2,\'NORMAL\',1,1,1,\'ORG_ADMIN\') ON CONFLICT(organization_id,priority) DO UPDATE SET resolution_minutes=1 RETURNING id',[organization.id,`SLA ${suffix}`])).rows[0];
    const ticket=(await database.query<{id:string}>('INSERT INTO tickets(organization_id,requester_user_id,title,description,priority) VALUES($1,$2,$3,$4,\'NORMAL\') RETURNING id',[organization.id,requester,`SLA ticket ${suffix}`,'deterministic escalation test'])).rows[0];
    tickets.push(ticket.id);
    await database.query('INSERT INTO ticket_sla_clocks(ticket_id,organization_id,policy_id,resolution_due_at) VALUES($1,$2,$3,$4)',[ticket.id,organization.id,policy.id,new Date('2020-01-01T00:00:00.000Z')]);
  }
});

afterAll(async () => { await database.query('DELETE FROM tickets WHERE id=ANY($1::uuid[])',[tickets]); await database.query('DELETE FROM sla_policies WHERE organization_id=ANY($1::uuid[])',[organizations]); await database.query('DELETE FROM organizations WHERE id=ANY($1::uuid[])',[organizations]); await database.query('DELETE FROM users WHERE id=$1',[requester]); await database.onModuleDestroy(); });

describe('SlaService integration', () => {
  it('breaches and escalates each tenant independently', async () => {
    const at = new Date('2020-01-02T00:00:00.000Z');
    const outcomes = await Promise.all(organizations.map(organizationId => service.evaluateOrganization(organizationId, at)));
    expect(outcomes.map(rows => rows[0]?.stage)).toEqual(['breach','breach']);
    const clocks = await database.query<{organization_id:string;breached_at:Date;escalated_at:Date}>('SELECT organization_id,breached_at,escalated_at FROM ticket_sla_clocks WHERE ticket_id=ANY($1::uuid[]) ORDER BY organization_id',[tickets]);
    expect(clocks.rows).toHaveLength(2);
    expect(clocks.rows.every(clock => clock.breached_at && clock.escalated_at)).toBe(true);
  });
});
