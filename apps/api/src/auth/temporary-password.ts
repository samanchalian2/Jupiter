import { BadRequestException } from '@nestjs/common';
import type { PoolClient } from 'pg';

/** Caller owns authorization, scoped membership check, transaction and Audit. */
export async function setTemporaryPassword(client: PoolClient, userId: string, hash: string) {
  const user=(await client.query<{password_hash:string|null}>('SELECT password_hash FROM users WHERE id=$1 AND is_active=true FOR UPDATE',[userId])).rows[0];
  if(!user)throw new BadRequestException('حساب فعال برای تغییر رمز پیدا نشد.');
  const identity=(await client.query<{id:string}>("SELECT id FROM authentication_identities WHERE user_id=$1 AND identity_type='EMAIL_PASSWORD' AND organization_id IS NULL AND status='ACTIVE'",[userId])).rows[0];
  if(!user.password_hash&&!identity)throw new BadRequestException('این حساب رمز محلی ندارد؛ رمز دایرکتوری از ژوپیتر تغییر نمی‌کند.');
  await client.query('UPDATE users SET password_hash=CASE WHEN password_hash IS NULL THEN NULL ELSE $2 END,must_change_password=true,credential_version=credential_version+1,updated_at=now() WHERE id=$1',[userId,hash]);
  if(identity)await client.query('UPDATE authentication_identities SET password_hash=$2,updated_at=now() WHERE id=$1',[identity.id,hash]);
  await client.query('UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[userId]);
}
