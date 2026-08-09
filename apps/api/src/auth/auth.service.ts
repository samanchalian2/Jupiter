import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service.js';
import { verifyPassword } from './password.js';

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService, private readonly jwt: JwtService) {}
  async login(email: string, password: string) {
    const user = (await this.database.query<{id:string;email:string;display_name:string;password_hash:string;is_platform_admin:boolean}>(
      'SELECT id,email,display_name,password_hash,is_platform_admin FROM users WHERE email=$1 AND is_active=true', [email.toLowerCase()]
    )).rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) throw new UnauthorizedException('Invalid credentials');
    const memberships = (await this.database.query<{organization_id:string;role_codes:string[]}>(
      'SELECT m.organization_id, array_agg(r.code ORDER BY r.code) AS role_codes FROM memberships m LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id WHERE m.user_id=$1 AND m.status=\'active\' GROUP BY m.organization_id', [user.id]
    )).rows;
    return { accessToken: await this.jwt.signAsync({ sub: user.id, platformAdmin: user.is_platform_admin }), user: { id:user.id, email:user.email, displayName:user.display_name, platformAdmin:user.is_platform_admin, memberships } };
  }
  async profile(userId: string) {
    const result = await this.database.query<{id:string;email:string;display_name:string;is_platform_admin:boolean}>('SELECT id,email,display_name,is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId]);
    if (!result.rows[0]) throw new UnauthorizedException();
    return result.rows[0];
  }
  async verify(token: string) { return this.jwt.verifyAsync<{sub:string}>(token); }
}
