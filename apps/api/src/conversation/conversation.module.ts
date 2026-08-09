import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module.js';
import { TicketModule } from '../tickets/ticket.module.js';
import { ConversationController } from './conversation.controller.js';
import { ConversationService } from './conversation.service.js';

@Module({ imports: [TicketModule, NotificationModule], controllers: [ConversationController], providers: [ConversationService] })
export class ConversationModule {}
