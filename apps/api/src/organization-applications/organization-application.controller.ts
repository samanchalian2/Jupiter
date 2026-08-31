import { Body, Controller, Get, Headers, NotFoundException, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { OrganizationApplicationService } from './organization-application.service.js';
import { LocalVerificationNotificationDelivery } from './verification-notification.service.js';

@Controller('public/accounts')
export class PublicAccountController {
  constructor(private readonly applications: OrganizationApplicationService, private readonly auth: AuthService, private readonly localDelivery: LocalVerificationNotificationDelivery) {}

  @Post()
  create(@Body() body: { email?: string; displayName?: string; password?: string }) { return this.applications.createPublicAccount(body); }
  @Post('verify-email')
  verify(@Body() body: { token?: string }) { return this.applications.verifyEmail(body.token ?? ''); }
  @Post('verification/resend')
  resend(@Headers('authorization') authorization?: string) { return this.userId(authorization).then((userId) => this.applications.resendVerification(userId)); }
  @Get('status')
  status(@Headers('authorization') authorization?: string) { return this.userId(authorization).then((userId) => this.applications.publicAccountStatus(userId)); }
  @Get('test/verification-deliveries')
  async testDelivery(@Query('email') email?: string, @Headers('authorization') authorization?: string) {
    if (process.env.NODE_ENV === 'production') throw new NotFoundException();
    if (!email) throw new NotFoundException();
    const account = await this.applications.publicAccountStatus(await this.userId(authorization));
    if (account.email.toLowerCase() !== email.trim().toLowerCase()) throw new NotFoundException();
    const delivery = this.localDelivery.latest(email);
    if (!delivery) throw new NotFoundException();
    return delivery;
  }

  private async userId(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return (await this.auth.verify(token).catch(() => { throw new UnauthorizedException(); })).sub;
  }
}

@Controller('organization-applications')
export class OrganizationApplicationController {
  constructor(private readonly applications: OrganizationApplicationService, private readonly auth: AuthService) {}

  @Get('me')
  list(@Headers('authorization') authorization?: string) { return this.userId(authorization).then((userId) => this.applications.listApplications(userId)); }
  @Post()
  create(@Body() body: { organizationName?: string; preferredSlug?: string; contactName?: string; contactPhone?: string; details?: Record<string, unknown> }, @Headers('idempotency-key') idempotencyKey?: string, @Headers('authorization') authorization?: string) {
    return this.userId(authorization).then((userId) => this.applications.createApplication(userId, body, idempotencyKey ?? ''));
  }
  @Post(':id')
  update(@Param('id') id: string, @Body() body: { organizationName?: string; preferredSlug?: string; contactName?: string; contactPhone?: string; details?: Record<string, unknown> }, @Headers('idempotency-key') idempotencyKey?: string, @Headers('authorization') authorization?: string) {
    return this.userId(authorization).then((userId) => this.applications.updateApplication(userId,id,body,idempotencyKey ?? ''));
  }
  @Post(':id/submit')
  submit(@Param('id') id: string, @Headers('authorization') authorization?: string, @Headers('idempotency-key') idempotencyKey?: string) { return this.userId(authorization).then((userId) => this.applications.submitApplication(userId,id,idempotencyKey ?? '')); }
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Headers('authorization') authorization?: string, @Headers('idempotency-key') idempotencyKey?: string) { return this.userId(authorization).then((userId) => this.applications.cancelApplication(userId,id,idempotencyKey ?? '')); }

  private async userId(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return (await this.auth.verify(token).catch(() => { throw new UnauthorizedException(); })).sub;
  }
}

@Controller('platform/organization-applications')
export class PlatformOrganizationApplicationController {
  constructor(private readonly applications: OrganizationApplicationService, private readonly auth: AuthService) {}

  @Get()
  list(@Query('status') status: 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_INFORMATION' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | undefined, @Headers('authorization') authorization?: string) {
    return this.userId(authorization).then((userId) => this.applications.platformApplications(userId,status));
  }
  @Post(':id/start-review')
  startReview(@Param('id') id: string, @Headers('idempotency-key') key: string | undefined, @Headers('authorization') authorization?: string) {
    return this.userId(authorization).then((userId) => this.applications.startReview(userId,id,key ?? ''));
  }
  @Post(':id/request-information')
  requestInformation(@Param('id') id: string, @Body() body: { note?: string }, @Headers('idempotency-key') key: string | undefined, @Headers('authorization') authorization?: string) {
    return this.userId(authorization).then((userId) => this.applications.requestInformation(userId,id,body.note,key ?? ''));
  }
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: { note?: string }, @Headers('idempotency-key') key: string | undefined, @Headers('authorization') authorization?: string) {
    return this.userId(authorization).then((userId) => this.applications.rejectApplication(userId,id,body.note,key ?? ''));
  }
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: { slug?: string; note?: string }, @Headers('idempotency-key') key: string | undefined, @Headers('authorization') authorization?: string) {
    return this.userId(authorization).then((userId) => this.applications.approveApplication(userId,id,body.slug,key ?? '',body.note));
  }

  private async userId(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return (await this.auth.verify(token).catch(() => { throw new UnauthorizedException(); })).sub;
  }
}
