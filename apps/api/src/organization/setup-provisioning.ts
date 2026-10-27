import { BadRequestException } from '@nestjs/common';
import type { PoolClient } from 'pg';

/** Caller owns the transaction, authorization, idempotency and command Audit. */
export async function provisionSetupOrganization(client: PoolClient, input: {name:string;slug:string;legalName?:string;ownerUserId:string;actorUserId:string}) {
  const legalName=input.legalName?.trim()||null;
  if(legalName&&(legalName.length<2||legalName.length>160))throw new BadRequestException('نام حقوقی باید بین ۲ و ۱۶۰ نویسه باشد.');
  const owner=(await client.query('SELECT id FROM users WHERE id=$1 AND is_active=true FOR SHARE',[input.ownerUserId])).rows[0];
  if(!owner)throw new BadRequestException('مالک اولیه باید یک حساب فعال معتبر باشد.');
  const organization=(await client.query<{id:string;slug:string;name:string;status:string}>(
    "INSERT INTO organizations(name,slug,status,legal_name) VALUES($1,$2,'setup',$3) RETURNING id,slug,name,status",[input.name,input.slug,legalName],
  )).rows[0];
  const membership=(await client.query<{id:string}>("INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active') RETURNING id",[organization.id,input.ownerUserId])).rows[0];
  const roles=await client.query("INSERT INTO membership_roles(membership_id,role_id) SELECT $1,id FROM roles WHERE code IN ('ORG_OWNER','ORG_ADMIN') RETURNING role_id",[membership.id]);
  if(roles.rowCount!==2)throw new Error('Required organization roles are not provisioned.');
  await client.query(`INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata)
    VALUES($1,$2,'organization.owner_assigned','organization',$1,$3::jsonb)`,[organization.id,input.actorUserId,JSON.stringify({ownerUserId:input.ownerUserId,source:'SETUP_PROVISIONING'})]);
  return organization;
}
