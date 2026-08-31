import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service.js';
import { hashPassword, verifyPassword } from './password.js';

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService, private readonly jwt: JwtService) {}
  async login(identifier: string, password: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.passwordUser(normalizedIdentifier);
    if (!user || !(await verifyPassword(password, user.password_hash))) throw new UnauthorizedException('Invalid credentials');
    const memberships = await this.memberships(user.id);
    return this.issueSession(user, memberships);
  }
  async refresh(token: string) {
    const tokenHash = this.hashToken(token);
    const session = (await this.database.query<{ id: string; user_id: string; email: string | null; display_name: string; is_platform_admin: boolean }>(
      `SELECT s.id,s.user_id,u.email,u.display_name,u.is_platform_admin
       FROM refresh_sessions s JOIN users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.is_active=true`, [tokenHash],
    )).rows[0];
    if (!session) throw new UnauthorizedException('Session expired. Please sign in again.');
    const memberships = await this.memberships(session.user_id);
    const next = await this.issueSession({ id: session.user_id, email: session.email, display_name: session.display_name, is_platform_admin: session.is_platform_admin }, memberships);
    await this.database.query('UPDATE refresh_sessions SET revoked_at=now(),replaced_by_session_id=$2,last_used_at=now() WHERE id=$1', [session.id, next.refreshSessionId]);
    return next;
  }
  async logout(token?: string) {
    if (token) await this.database.query('UPDATE refresh_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL', [this.hashToken(token)]);
  }
  private async memberships(userId: string) {
    return (await this.database.query<{organization_id:string;organization_name:string;organization_slug:string;organization_status:string;role_codes:string[]}>(
      'SELECT m.organization_id,o.name AS organization_name,o.slug AS organization_slug,o.status AS organization_status,array_agg(r.code ORDER BY r.code) AS role_codes FROM memberships m JOIN organizations o ON o.id=m.organization_id LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id WHERE m.user_id=$1 AND m.status=\'active\' GROUP BY m.organization_id,o.name,o.slug,o.status ORDER BY o.name', [userId],
    )).rows;
  }
  private async passwordUser(identifier: string) {
    const legacy = (await this.database.query<{id:string;email:string|null;display_name:string;password_hash:string;is_platform_admin:boolean}>(
      'SELECT id,email,display_name,password_hash,is_platform_admin FROM users WHERE (email=$1 OR username=$1) AND password_hash IS NOT NULL AND is_active=true', [identifier],
    )).rows[0];
    if (legacy) return legacy;
    return (await this.database.query<{id:string;email:string|null;display_name:string;password_hash:string;is_platform_admin:boolean}>(
      `SELECT u.id,u.email,u.display_name,i.password_hash,u.is_platform_admin
       FROM authentication_identities i JOIN users u ON u.id=i.user_id
       WHERE i.identity_type='EMAIL_PASSWORD' AND i.organization_id IS NULL
         AND i.identifier=$1 AND i.status='ACTIVE' AND u.is_active=true`, [identifier],
    )).rows[0];
  }
  private async issueSession(user: {id:string;email:string|null;display_name:string;is_platform_admin:boolean}, memberships: {organization_id:string;organization_name:string;role_codes:string[]}[]) {
    const rawRefreshToken = randomBytes(48).toString('base64url');
    const refreshSessionId = (await this.database.query<{id:string}>(
      'INSERT INTO refresh_sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval \'30 days\') RETURNING id', [user.id, this.hashToken(rawRefreshToken)],
    )).rows[0].id;
    return { accessToken: await this.jwt.signAsync({ sub: user.id, platformAdmin: user.is_platform_admin }), refreshToken: rawRefreshToken, refreshSessionId, user: { id:user.id, email:user.email, displayName:user.display_name, platformAdmin:user.is_platform_admin, memberships } };
  }
  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
  async profile(userId: string) {
    const result = await this.database.query<{id:string;email:string|null;display_name:string;is_platform_admin:boolean}>('SELECT id,email,display_name,is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId]);
    if (!result.rows[0]) throw new UnauthorizedException();
    return result.rows[0];
  }
  async updateProfile(userId: string, input: { displayName?: string; currentPassword?: string; nextPassword?: string }) {
    const user = (await this.database.query<{ id: string; password_hash: string | null }>('SELECT id,password_hash FROM users WHERE id=$1 AND is_active=true', [userId])).rows[0];
    if (!user) throw new UnauthorizedException();
    const identity = user.password_hash ? undefined : (await this.database.query<{id:string;password_hash:string}>(
      `SELECT id,password_hash FROM authentication_identities
       WHERE user_id=$1 AND identity_type='EMAIL_PASSWORD' AND organization_id IS NULL AND status='ACTIVE'`, [userId],
    )).rows[0];
    const displayName = input.displayName?.trim();
    if (displayName !== undefined && (displayName.length < 2 || displayName.length > 120)) throw new UnauthorizedException('Display name is invalid');
    if (input.nextPassword !== undefined) {
      const currentHash = user.password_hash ?? identity?.password_hash;
      if (!currentHash || !input.currentPassword || !(await verifyPassword(input.currentPassword, currentHash))) throw new UnauthorizedException('Current password is invalid');
      if (input.nextPassword.length < 10 || input.nextPassword.length > 200) throw new UnauthorizedException('Password must be at least 10 characters');
      const nextHash = await hashPassword(input.nextPassword);
      await this.database.query('UPDATE users SET password_hash=CASE WHEN password_hash IS NULL THEN NULL ELSE $2 END,display_name=COALESCE($3,display_name),updated_at=now() WHERE id=$1', [userId, nextHash, displayName ?? null]);
      if (identity) await this.database.query('UPDATE authentication_identities SET password_hash=$2,updated_at=now() WHERE id=$1', [identity.id,nextHash]);
      await this.database.query('UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [userId]);
    } else if (displayName !== undefined) {
      await this.database.query('UPDATE users SET display_name=$2,updated_at=now() WHERE id=$1', [userId, displayName]);
    }
    return this.profile(userId);
  }
  async verify(token: string) { return this.jwt.verifyAsync<{sub:string}>(token); }
}
