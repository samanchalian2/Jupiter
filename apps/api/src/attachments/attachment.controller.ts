import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { AttachmentService } from './attachment.service.js';

@Controller('tickets/:ticketId/attachments')
export class AttachmentController {
  constructor(private readonly actors: TicketActorService, private readonly attachments: AttachmentService) {}
  @Get() async list(@Param('ticketId') ticketId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.attachments.list(await this.actors.fromHeaders(authorization, organizationId), ticketId); }
  @Post('upload-requests') async uploadRequest(@Param('ticketId') ticketId: string, @Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined, @Body() input: { filename: string; contentType: string; byteSize: number }) { return this.attachments.requestUpload(await this.actors.fromHeaders(authorization, organizationId), ticketId, input); }
  @Post(':attachmentId/complete') async complete(@Param('ticketId') ticketId: string, @Param('attachmentId') attachmentId: string, @Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined) { return this.attachments.completeUpload(await this.actors.fromHeaders(authorization, organizationId), ticketId, attachmentId); }
  @Get(':attachmentId/download') async download(@Param('ticketId') ticketId: string, @Param('attachmentId') attachmentId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.attachments.download(await this.actors.fromHeaders(authorization, organizationId), ticketId, attachmentId); }
}
