import { Controller, Headers, Sse } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { NotificationService } from './notification.service.js';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly actors: TicketActorService, private readonly notifications: NotificationService) {}

  @Sse('events')
  async events(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) {
    const actor = await this.actors.fromHeaders(authorization, organizationId);
    return this.notifications.stream(actor.organizationId, actor.userId);
  }
}
