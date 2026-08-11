import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { TranscriptionService } from './transcription.service.js';

@Controller('tickets/:ticketId/transcription')
export class TranscriptionController {
  constructor(private readonly auth: AuthService, private readonly jobs: TranscriptionService) {}
  private async actor(authorization?: string, organizationId?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !organizationId) throw new UnauthorizedException();
    return { userId: (await this.auth.verify(token)).sub, organizationId };
  }
  @Post()
  async create(@Param('ticketId') ticketId: string, @Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined, @Body() body: { attachmentId: string }) { return this.jobs.enqueue(await this.actor(authorization, organizationId), ticketId, body.attachmentId); }
  @Get()
  async list(@Param('ticketId') ticketId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.jobs.list(await this.actor(authorization, organizationId), ticketId); }
  @Get(':id')
  async get(@Param('ticketId') ticketId: string, @Param('id') id: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.jobs.get(await this.actor(authorization, organizationId), ticketId, id); }
  @Post(':id/retry')
  async retry(@Param('ticketId') ticketId: string, @Param('id') id: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.jobs.retry(await this.actor(authorization, organizationId), ticketId, id); }
}
