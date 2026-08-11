import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { hashPassword } from '../auth/password.js';

type Actor = { userId: string; organizationId: string; roles: string[] };
const catalogTables = new Set(['departments', 'locations', 'disciplines', 'categories']);

@Injectable()
export class OrganizationService {
  constructor(private readonly database: DatabaseService) {}
  private admin(actor: Actor) { if (!actor.roles.includes('ORG_ADMIN')) throw new ForbiddenException(); }
  async members(actor: Actor) { this.admin(actor); return this.database.withOrganization(actor.organizationId, async c => (await c.query('SELECT m.id,u.id AS user_id,u.email,u.display_name,m.status,array_remove(array_agg(r.code),NULL) AS roles FROM memberships m JOIN users u ON u.id=m.user_id LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id GROUP BY m.id,u.id ORDER BY u.display_name')).rows); }
  async addMember(actor: Actor, input: { email: string; displayName: string; password: string; roles: string[] }) { this.admin(actor); return this.database.withOrganization(actor.organizationId, async c => { const user=(await c.query<{id:string}>('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id',[input.email.toLowerCase(),input.displayName,await hashPassword(input.password)])).rows[0]; const member=(await c.query<{id:string}>('INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,\'active\') ON CONFLICT(organization_id,user_id) DO UPDATE SET status=\'active\' RETURNING id',[actor.organizationId,user.id])).rows[0]; await c.query('DELETE FROM membership_roles WHERE membership_id=$1',[member.id]); await c.query('INSERT INTO membership_roles(membership_id,role_id) SELECT $1,id FROM roles WHERE code=ANY($2::text[])',[member.id,input.roles]); await c.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,\'member.upserted\',\'membership\',$3,$4)',[actor.organizationId,actor.userId,member.id,{roles:input.roles}]); return { id:member.id,userId:user.id }; }); }
  async catalog(actor: Actor, kind: string) { this.admin(actor); if(!catalogTables.has(kind)) throw new ForbiddenException(); return this.database.withOrganization(actor.organizationId, async c => (await c.query(`SELECT id,code,name FROM ${kind} ORDER BY name`)).rows); }
  async addCatalog(actor: Actor, kind: string, input: { code: string; name: string }) { this.admin(actor); if(!catalogTables.has(kind)) throw new ForbiddenException(); return this.database.withOrganization(actor.organizationId, async c => (await c.query(`INSERT INTO ${kind}(organization_id,code,name) VALUES($1,$2,$3) ON CONFLICT(organization_id,code) DO UPDATE SET name=EXCLUDED.name RETURNING id,code,name`,[actor.organizationId,input.code,input.name])).rows[0]); }
}
