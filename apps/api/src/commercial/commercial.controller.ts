import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { CommercialService } from './commercial.service.js';

@Controller('platform/commercial')
export class CommercialController {
  constructor(private readonly auth: AuthService, private readonly actors: TicketActorService, private readonly commercial: CommercialService) {}
  private user(value?: string) { const token = value?.replace(/^Bearer\s+/i, ''); if (!token) throw new UnauthorizedException(); return this.auth.verify(token).then((payload) => payload.sub); }
  private actor(authorization?: string, organizationId?: string) { return this.actors.fromHeaders(authorization, organizationId); }

  @Get('products') products(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.products(id)); }
  @Post('products') product(@Body() body: { code?: string; name?: string; status?: 'DRAFT' | 'ACTIVE' | 'RETIRED' }, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.saveProduct(id, body)); }
  @Get('agreements') agreements(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.agreements(id)); }
  @Post('agreements') agreement(@Body() body: { organizationId?: string; agreementReference?: string; status?: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'; startsAt?: string; endsAt?: string | null }, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.saveAgreement(id, body)); }
  @Get('entitlements') entitlements(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.entitlements(id)); }
  @Post('entitlements') entitlement(@Body() body: { organizationId?: string; productId?: string | null; capabilityCode?: string; status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'; startsAt?: string; endsAt?: string | null }, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.saveEntitlement(id, body)); }
  @Get('availability') availability(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.availability(id)); }
  @Post('availability') availabilitySave(@Body() body: { capabilityCode?: string; isAvailable?: boolean }, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.saveAvailability(id, body)); }
  @Get('feature-settings') featureSettings(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.featureSettings(id)); }
  @Post('feature-settings') feature(@Body() body: { organizationId?: string; capabilityCode?: string; enabled?: boolean }, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.saveFeatureSetting(id, body)); }
  @Get('addon-packages') addonPackages(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.addonPackages(id)); }
  @Post('addon-packages') addonPackage(@Body() body: { code?: string; name?: string; capabilityCode?: string; unitCount?: number; status?: 'DRAFT' | 'ACTIVE' | 'RETIRED' }, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.saveAddonPackage(id, body)); }
  @Get('allowances') allowances(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.allowances(id)); }
  @Post('allowances') allowance(@Body() body: { organizationId?: string; capabilityCode?: string; periodStartsAt?: string; periodEndsAt?: string; grantedUnits?: number; allocationType?: 'PERIODIC' | 'EMERGENCY' }, @Headers('idempotency-key') key: string | undefined, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.allocateAllowance(id, { ...body, idempotencyKey: key })); }
  @Get('addon-allocations') addonAllocations(@Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.addonAllocations(id)); }
  @Post('addon-allocations') addonAllocation(@Body() body: { organizationId?: string; addonPackageId?: string; grantedUnits?: number }, @Headers('idempotency-key') key: string | undefined, @Headers('authorization') authorization?: string) { return this.user(authorization).then((id) => this.commercial.allocateAddon(id, { ...body, idempotencyKey: key })); }
  @Get('effective') effective(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.commercial.effectiveCapabilities(actor)); }
  @Get('state') state(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.commercial.commercialState(actor)); }
  @Get('owner-dashboard') ownerDashboard(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.actor(authorization, organizationId).then((actor) => this.commercial.ownerDashboard(actor)); }
}
