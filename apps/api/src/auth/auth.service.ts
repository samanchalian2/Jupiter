import { BadRequestException, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import type { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { hashPassword, verifyPassword } from './password.js';
import { PersonalWorkspaceService } from '../personal-workspaces/personal-workspace.service.js';
import { notifySessionRevocation } from '../observability/security-events.js';

type User={id:string;email:string|null;display_name:string;is_platform_admin:boolean;must_change_password:boolean;credential_version:number};
type PasswordUser=User&{password_hash:string};
type Membership={organization_id:string;organization_name:string;organization_slug:string;organization_status:string;workspace_type:'ORGANIZATION'|'PERSONAL';role_codes:string[]};
export type PasswordChangeChallenge={passwordChangeRequired:true;passwordChangeToken:string;expiresAt:string};
type Claims={sub:string;purpose?:string;credentialVersion?:number};
const challengePurpose='PASSWORD_CHANGE';

@Injectable()
export class AuthService {
  constructor(private readonly database:DatabaseService,private readonly jwt:JwtService,@Optional() private readonly personalWorkspaces?:PersonalWorkspaceService) {}
  async login(identifier:string,password:string) {
    const candidate=await this.passwordUser(identifier.trim().toLowerCase());
    if(!candidate||!(await verifyPassword(password,candidate.password_hash)))throw new UnauthorizedException('Invalid credentials');
    if(candidate.must_change_password) return this.challenge(candidate);
    await this.personalWorkspaces?.ensureForEligibleUser(candidate.id);
    return this.database.transaction(async client=>{
      const user=(await client.query<User>('SELECT id,email,display_name,is_platform_admin,must_change_password,credential_version FROM users WHERE id=$1 AND is_active=true FOR UPDATE',[candidate.id])).rows[0];
      if(!user||user.credential_version!==candidate.credential_version)throw new UnauthorizedException('Invalid credentials');
      if(user.must_change_password)return this.challenge(user);
      return this.issueSession(user,await this.memberships(user.id,client),client);
    });
  }
  private async challenge(user:User):Promise<PasswordChangeChallenge> {
    const passwordChangeToken=await this.jwt.signAsync({sub:user.id,purpose:challengePurpose,credentialVersion:user.credential_version},{expiresIn:'10m',audience:'jupiter-first-login'});
    return {passwordChangeRequired:true,passwordChangeToken,expiresAt:new Date(Date.now()+600000).toISOString()};
  }
  async completeFirstLogin(token:string,nextPassword:string) {
    if(typeof token!=='string'||!token||token.length>4096)throw new UnauthorizedException('درخواست تغییر رمز معتبر نیست.');
    if(typeof nextPassword!=='string'||nextPassword.length<10||nextPassword.length>200)throw new BadRequestException('رمز جدید باید بین ۱۰ و ۲۰۰ کاراکتر باشد.');
    let claims:Claims;
    try{claims=await this.jwt.verifyAsync<Claims>(token,{audience:'jupiter-first-login'});}catch{throw new UnauthorizedException('مهلت تغییر رمز تمام شده است؛ دوباره وارد شوید.');}
    if(claims.purpose!==challengePurpose||!claims.sub||!Number.isInteger(claims.credentialVersion))throw new UnauthorizedException('درخواست تغییر رمز معتبر نیست.');
    const result=await this.database.transaction(async client=>{
      const user=(await client.query<User&{password_hash:string|null}>('SELECT id,email,display_name,is_platform_admin,must_change_password,credential_version,password_hash FROM users WHERE id=$1 AND is_active=true FOR UPDATE',[claims.sub])).rows[0];
      if(!user||!user.must_change_password||user.credential_version!==claims.credentialVersion)throw new UnauthorizedException('درخواست تغییر رمز معتبر نیست؛ دوباره وارد شوید.');
      const identity=(await client.query<{id:string;password_hash:string}>("SELECT id,password_hash FROM authentication_identities WHERE user_id=$1 AND identity_type='EMAIL_PASSWORD' AND organization_id IS NULL AND status='ACTIVE'",[user.id])).rows[0];
      const oldHash=user.password_hash??identity?.password_hash;
      if(!oldHash)throw new UnauthorizedException('حساب رمز محلی ندارد.');
      if(await verifyPassword(nextPassword,oldHash))throw new BadRequestException('رمز جدید باید با رمز موقت متفاوت باشد.');
      const hash=await hashPassword(nextPassword);
      await client.query('UPDATE users SET password_hash=CASE WHEN password_hash IS NULL THEN NULL ELSE $2 END,must_change_password=false,credential_version=credential_version+1,updated_at=now() WHERE id=$1',[user.id,hash]);
      if(identity)await client.query('UPDATE authentication_identities SET password_hash=$2,updated_at=now() WHERE id=$1',[identity.id,hash]);
      await client.query('UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[user.id]);
      await client.query("INSERT INTO audit_logs(actor_user_id,action,target_type,target_id,metadata) VALUES($1,'auth.first_login_password_changed','user',$1,'{}'::jsonb)",[user.id]);
      return this.issueSession({...user,must_change_password:false,credential_version:user.credential_version+1},await this.memberships(user.id,client),client);
    });
    notifySessionRevocation(claims.sub);
    return result;
  }
  async refresh(token:string) {
    if(!token)throw new UnauthorizedException('Session expired. Please sign in again.');
    const result=await this.database.transaction(async client=>{
      const session=(await client.query<User&{session_id:string}>(`SELECT u.id,u.email,u.display_name,u.is_platform_admin,u.must_change_password,u.credential_version,s.id AS session_id FROM refresh_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.is_active=true FOR UPDATE OF u,s`,[this.hashToken(token)])).rows[0];
      if(!session||session.must_change_password)throw new UnauthorizedException('Session expired. Please sign in again.');
      const next=await this.issueSession(session,await this.memberships(session.id,client),client);
      await client.query('UPDATE refresh_sessions SET revoked_at=now(),replaced_by_session_id=$2,last_used_at=now() WHERE id=$1',[session.session_id,next.refreshSessionId]);
      return next;
    });
    await this.personalWorkspaces?.ensureForEligibleUser(result.user.id);
    // Provisioning may have supplied the first personal membership.
    result.user.memberships=await this.memberships(result.user.id);
    return result;
  }
  async logout(token?:string) {
    if(token){const rows=(await this.database.query<{user_id:string}>('UPDATE refresh_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING user_id',[this.hashToken(token)])).rows;for(const row of rows)notifySessionRevocation(row.user_id);}
  }
  private async memberships(userId:string,client?:PoolClient) {
    return (await this.query<Membership>(
      "SELECT m.organization_id,o.name AS organization_name,o.slug AS organization_slug,o.status AS organization_status,o.workspace_type,array_remove(array_agg(r.code ORDER BY r.code),NULL) AS role_codes FROM memberships m JOIN organizations o ON o.id=m.organization_id LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id WHERE m.user_id=$1 AND m.status='active' AND o.status<>'archived' GROUP BY m.organization_id,o.name,o.slug,o.status,o.workspace_type ORDER BY o.workspace_type DESC,o.name",[userId],client,
    )).rows;
  }
  private async passwordUser(identifier:string) {
    const legacy=(await this.database.query<PasswordUser>('SELECT id,email,display_name,password_hash,is_platform_admin,must_change_password,credential_version FROM users WHERE (email=$1 OR username=$1) AND password_hash IS NOT NULL AND is_active=true',[identifier])).rows[0];
    if(legacy)return legacy;
    return (await this.database.query<PasswordUser>(`SELECT u.id,u.email,u.display_name,i.password_hash,u.is_platform_admin,u.must_change_password,u.credential_version FROM authentication_identities i JOIN users u ON u.id=i.user_id WHERE i.identity_type='EMAIL_PASSWORD' AND i.organization_id IS NULL AND i.identifier=$1 AND i.status='ACTIVE' AND u.is_active=true`,[identifier])).rows[0];
  }
  private async issueSession(user:User,memberships:Membership[],client?:PoolClient) {
    const refreshToken=randomBytes(48).toString('base64url');
    const refreshSessionId=(await this.query<{id:string}>("INSERT INTO refresh_sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 days') RETURNING id",[user.id,this.hashToken(refreshToken)],client)).rows[0].id;
    return {accessToken:await this.jwt.signAsync({sub:user.id,platformAdmin:user.is_platform_admin,credentialVersion:user.credential_version}),refreshToken,refreshSessionId,user:{id:user.id,email:user.email,displayName:user.display_name,platformAdmin:user.is_platform_admin,memberships}};
  }
  private query<T extends QueryResultRow>(sql:string,values:unknown[]=[],client?:PoolClient){return client?client.query<T>(sql,values):this.database.query<T>(sql,values);}
  private hashToken(token:string){return createHash('sha256').update(token).digest('hex');}
  async profile(userId:string) {
    const user=(await this.database.query<User>('SELECT id,email,display_name,is_platform_admin,must_change_password,credential_version FROM users WHERE id=$1 AND is_active=true',[userId])).rows[0];
    if(!user||user.must_change_password)throw new UnauthorizedException();
    return {id:user.id,email:user.email,display_name:user.display_name,is_platform_admin:user.is_platform_admin};
  }
  async updateProfile(userId:string,input:{displayName?:string;currentPassword?:string;nextPassword?:string}) {
    const displayName=input.displayName?.trim();
    if(displayName!==undefined&&(displayName.length<2||displayName.length>120))throw new BadRequestException('Display name is invalid');
    await this.database.transaction(async client=>{
      const user=(await client.query<{password_hash:string|null;must_change_password:boolean}>('SELECT password_hash,must_change_password FROM users WHERE id=$1 AND is_active=true FOR UPDATE',[userId])).rows[0];
      if(!user||user.must_change_password)throw new UnauthorizedException();
      if(input.nextPassword!==undefined) {
        const identity=(await client.query<{id:string;password_hash:string}>("SELECT id,password_hash FROM authentication_identities WHERE user_id=$1 AND identity_type='EMAIL_PASSWORD' AND organization_id IS NULL AND status='ACTIVE'",[userId])).rows[0];
        const currentHash=user.password_hash??identity?.password_hash;
        if(!currentHash||!input.currentPassword||!(await verifyPassword(input.currentPassword,currentHash)))throw new UnauthorizedException('Current password is invalid');
        if(typeof input.nextPassword!=='string'||input.nextPassword.length<10||input.nextPassword.length>200)throw new BadRequestException('Password must be between 10 and 200 characters');
        const hash=await hashPassword(input.nextPassword);
        await client.query('UPDATE users SET password_hash=CASE WHEN password_hash IS NULL THEN NULL ELSE $2 END,display_name=COALESCE($3,display_name),credential_version=credential_version+1,updated_at=now() WHERE id=$1',[userId,hash,displayName??null]);
        if(identity)await client.query('UPDATE authentication_identities SET password_hash=$2,updated_at=now() WHERE id=$1',[identity.id,hash]);
        await client.query('UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[userId]);
        await client.query("INSERT INTO audit_logs(actor_user_id,action,target_type,target_id,metadata) VALUES($1,'auth.password_changed','user',$1,'{}'::jsonb)",[userId]);
      } else if(displayName!==undefined)await client.query('UPDATE users SET display_name=$2,updated_at=now() WHERE id=$1',[userId,displayName]);
    });
    if(input.nextPassword!==undefined)notifySessionRevocation(userId);
    return this.profile(userId);
  }
  async verify(token:string) {
    try {
      const claims=await this.jwt.verifyAsync<Claims>(token);
      if(claims.purpose||!claims.sub||!/^[0-9a-f-]{36}$/i.test(claims.sub))throw new Error('Invalid access purpose');
      const user=(await this.database.query<{must_change_password:boolean;credential_version:number}>('SELECT must_change_password,credential_version FROM users WHERE id=$1 AND is_active=true',[claims.sub])).rows[0];
      if(!user||user.must_change_password||(claims.credentialVersion??0)!==user.credential_version)throw new Error('Credential changed');
      return {sub:claims.sub};
    }catch{throw new UnauthorizedException('Session is invalid or expired');}
  }
}
