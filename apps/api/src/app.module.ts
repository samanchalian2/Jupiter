import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { TicketModule } from './tickets/ticket.module.js';
import { ConversationModule } from './conversation/conversation.module.js';
import { NotificationModule } from './notifications/notification.module.js';
import { AttachmentModule } from './attachments/attachment.module.js';
import { AiModule } from './ai/ai.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  imports: [DatabaseModule, AuthModule, TicketModule, NotificationModule, ConversationModule, AttachmentModule, AiModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
