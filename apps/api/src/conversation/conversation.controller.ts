import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { ConversationService } from './conversation.service.js';

@Controller('tickets/:ticketId')
export class ConversationController {
  constructor(private readonly actors: TicketActorService, private readonly conversations: ConversationService) {}

  @Get('messages') async messages(@Param('ticketId') ticketId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.conversations.listMessages(await this.actors.fromHeaders(authorization, organizationId), ticketId); }
  @Post('messages') async message(@Param('ticketId') ticketId: string, @Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined, @Body() body: { body?: string }) { return this.conversations.addMessage(await this.actors.fromHeaders(authorization, organizationId), ticketId, body.body ?? ''); }
  @Get('notes') async notes(@Param('ticketId') ticketId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.conversations.listNotes(await this.actors.fromHeaders(authorization, organizationId), ticketId); }
  @Post('notes') async note(@Param('ticketId') ticketId: string, @Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined, @Body() body: { body?: string }) { return this.conversations.addNote(await this.actors.fromHeaders(authorization, organizationId), ticketId, body.body ?? ''); }
  @Get('activity') async activity(@Param('ticketId') ticketId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.conversations.timeline(await this.actors.fromHeaders(authorization, organizationId), ticketId); }
  @Get('timeline') async timeline(@Param('ticketId') ticketId: string, @Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.conversations.unifiedTimeline(await this.actors.fromHeaders(authorization, organizationId), ticketId); }
}
