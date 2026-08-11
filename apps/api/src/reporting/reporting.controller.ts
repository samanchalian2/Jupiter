import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { DatabaseService } from '../database/database.service.js';
import { ReportingService } from './reporting.service.js';

@Controller()
export class ReportingController {
  constructor(private readonly auth: AuthService, private readonly database: DatabaseService, private readonly reports: ReportingService) {}

  private async actor(authorization?: string, organizationId?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !organizationId) throw new UnauthorizedException();
    const payload = await this.auth.verify(token);
    const roles = (await this.database.query<{ role_codes: string[] }>('SELECT array_agg(r.code) role_codes FROM memberships m LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.user_id=$2 AND m.status=\'active\'', [organizationId, payload.sub])).rows[0];
    return { userId: payload.sub, organizationId, roles: roles?.role_codes?.filter(Boolean) ?? [] };
  }

  @Get('tickets/search') search(@Query('q') q: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.reports.search(actor, q ?? '')); }
  @Post('tickets/:id/rating') rate(@Param('id') id: string, @Body() body: { score: number; comment?: string }, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.reports.rate(actor, id, body.score, body.comment)); }
  @Get('dashboard/workload') workload(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.reports.workload(actor)); }
  @Get('reports/summary') summary(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.reports.summary(actor)); }
  @Get('reports/export') export(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.reports.exportCsv(actor)); }
  @Get('dashboard/platform') async platform(@Headers('authorization') authorization?: string) { const token = authorization?.replace(/^Bearer\s+/i, ''); if (!token) throw new UnauthorizedException(); return this.reports.platformOverview((await this.auth.verify(token)).sub); }
}
