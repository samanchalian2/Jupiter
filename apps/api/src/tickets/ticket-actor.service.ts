import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { DatabaseService } from '../database/database.service.js';

export type TicketActor = { userId: string; organizationId: string; roles: string[] };

@Injectable()
export class TicketActorService {
  constructor(private readonly auth: AuthService, private readonly database: DatabaseService) {}

  async fromHeaders(authorization?: string, organizationId?: string): Promise<TicketActor> {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !organizationId) throw new UnauthorizedException();
    const payload = await this.auth.verify(token).catch(() => { throw new UnauthorizedException('Session is invalid or expired'); });
    const rows = (await this.database.query<{role_codes: string[]}>('SELECT array_agg(r.code) AS role_codes FROM memberships m LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.user_id=$2 AND m.status=\'active\'', [organizationId, payload.sub])).rows;
    if (!rows[0]?.role_codes) throw new UnauthorizedException();
    return { userId: payload.sub, organizationId, roles: rows[0].role_codes.filter(Boolean) };
  }
}
