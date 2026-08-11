import { Body, Controller, Get, Headers, Param, Post, Put, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AiGatewayService } from './ai-gateway.service.js';

@Controller('platform/ai-settings')
export class AiPlatformController {
  constructor(private readonly auth: AuthService, private readonly ai: AiGatewayService) {}

  private async actor(authorization?: string, organizationId?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !organizationId) throw new UnauthorizedException();
    return { userId: (await this.auth.verify(token)).sub, organizationId };
  }

  @Get()
  async settings(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return this.ai.platformSettings((await this.auth.verify(token)).sub);
  }

  @Get('audit')
  async audit(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return this.ai.platformAudit((await this.auth.verify(token)).sub);
  }

  @Put()
  async configure(@Headers('authorization') authorization: string | undefined, @Body() body: { organizationId: string; enabled: boolean; model: string }) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return this.ai.configurePlatform((await this.auth.verify(token)).sub, body.organizationId, body.enabled, body.model);
  }

  @Post('requests/:ticketId')
  async request(@Param('ticketId') ticketId: string, @Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined, @Body() body: { text: string }) {
    return this.ai.enqueue(await this.actor(authorization, organizationId), ticketId, body.text);
  }

  @Get('requests/ticket/:ticketId')
  async requests(@Param('ticketId') ticketId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) {
    return this.ai.requests(await this.actor(authorization, organizationId), ticketId);
  }

  @Get('requests/:id/review')
  async review(@Param('id') id: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) {
    return this.ai.review(await this.actor(authorization, organizationId), id);
  }

  @Post('requests/:id/confirm')
  async confirm(@Param('id') id: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) {
    return this.ai.confirm(await this.actor(authorization, organizationId), id);
  }
}
