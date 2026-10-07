import { ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';

type PersonalWorkspaceRow = {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  organization_status: 'active' | 'suspended';
  workspace_type: 'PERSONAL';
  role_codes: string[];
};

@Injectable()
export class PersonalWorkspaceService {
  constructor(private readonly database: DatabaseService) {}

  async ensureForEligibleUser(userId: string) {
    return this.database.transaction((client) => this.ensureVerifiedWithClient(client, userId));
  }

  async requireForVerifiedUser(userId: string) {
    const workspace = await this.ensureForEligibleUser(userId);
    if (!workspace) throw new ForbiddenException('برای ساخت فضای شخصی ابتدا ایمیل حساب را تأیید کنید.');
    return workspace;
  }

  async ensureVerifiedWithClient(client: PoolClient, userId: string): Promise<PersonalWorkspaceRow | null> {
    const owner = (await client.query<{id:string;display_name:string}>(
      `SELECT user_account.id,user_account.display_name
       FROM users user_account
       WHERE user_account.id=$1 AND user_account.is_active=true
         AND EXISTS (
           SELECT 1 FROM authentication_identities identity
           WHERE identity.user_id=user_account.id
             AND identity.identity_type='EMAIL_PASSWORD'
             AND identity.organization_id IS NULL
             AND identity.status='ACTIVE'
             AND identity.email_verified_at IS NOT NULL
         )
       FOR UPDATE`, [userId],
    )).rows[0];
    if (!owner) return null;

    let organization = (await client.query<{id:string}>(
      `SELECT id FROM organizations
       WHERE workspace_type='PERSONAL' AND personal_owner_user_id=$1`, [userId],
    )).rows[0];
    let created = false;
    if (!organization) {
      organization = (await client.query<{id:string}>(
        `INSERT INTO organizations(slug,name,status,workspace_type,personal_owner_user_id)
         VALUES($1,left('فضای شخصی ' || $2,160),'active','PERSONAL',$3)
         RETURNING id`, [`personal-${randomUUID().replace(/-/g, '')}`,owner.display_name,userId],
      )).rows[0];
      created = true;
    }

    const membership = (await client.query<{id:string}>(
      `INSERT INTO memberships(organization_id,user_id,status)
       VALUES($1,$2,'active')
       ON CONFLICT(organization_id,user_id) DO UPDATE SET status='active'
       RETURNING id`, [organization.id,userId],
    )).rows[0];
    await client.query(
      `INSERT INTO membership_roles(membership_id,role_id)
       SELECT $1,id FROM roles WHERE code='REQUESTER'
       ON CONFLICT DO NOTHING`, [membership.id],
    );
    if (created) {
      await client.query(
        `INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata)
         VALUES($1,$2,'personal_workspace.provisioned','organization',$1,$3::jsonb)`,
        [organization.id,userId,JSON.stringify({ source: 'verified_public_account' })],
      );
    }
    return this.projection(client, userId, organization.id);
  }

  private async projection(client: PoolClient, userId: string, organizationId: string) {
    return (await client.query<PersonalWorkspaceRow>(
      `SELECT membership.organization_id,organization.name AS organization_name,
        organization.slug AS organization_slug,organization.status AS organization_status,
        organization.workspace_type,
        array_remove(array_agg(role.code ORDER BY role.code),NULL) AS role_codes
       FROM memberships membership
       JOIN organizations organization ON organization.id=membership.organization_id
       LEFT JOIN membership_roles membership_role ON membership_role.membership_id=membership.id
       LEFT JOIN roles role ON role.id=membership_role.role_id
       WHERE membership.user_id=$1 AND membership.organization_id=$2
         AND membership.status='active' AND organization.workspace_type='PERSONAL'
       GROUP BY membership.organization_id,organization.name,organization.slug,
         organization.status,organization.workspace_type`, [userId,organizationId],
    )).rows[0];
  }
}
