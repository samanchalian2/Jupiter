import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AppearanceService } from './appearance.service.js';
import { TicketActorService } from '../tickets/ticket-actor.service.js';

@Controller('appearance')
export class AppearanceController {
  constructor(private readonly appearance: AppearanceService, private readonly auth: AuthService, private readonly actors: TicketActorService) {}
  @Get() current() { return this.appearance.current(); }
  @Post() save(@Body() body: { brandPreset?: string; densityPreset?: string; radiusPreset?: string; logoUrl?: string | null; customPrimary?: string | null }, @Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return this.auth.verify(token).then(({ sub }) => this.appearance.save(sub, body));
  }
  @Post('reset-primary') resetPlatformPrimary(@Headers('authorization') authorization?: string) { const token = authorization?.replace(/^Bearer\s+/i, ''); if (!token) throw new UnauthorizedException(); return this.auth.verify(token).then(({ sub }) => this.appearance.resetPlatformPrimary(sub)); }
  @Get('organization') organizationCurrent(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actors.fromHeaders(authorization, organizationId).then(actor => this.appearance.organizationCurrent(actor)); }
  @Post('organization') saveOrganization(@Body() body: { customPrimary?: unknown }, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actors.fromHeaders(authorization, organizationId).then(actor => this.appearance.saveOrganizationPrimary(actor, body)); }
  @Post('organization/reset-primary') resetOrganization(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actors.fromHeaders(authorization, organizationId).then(actor => this.appearance.resetOrganizationPrimary(actor)); }
}
