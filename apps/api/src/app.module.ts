import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { TicketModule } from './tickets/ticket.module.js';
import { ConversationModule } from './conversation/conversation.module.js';
import { NotificationModule } from './notifications/notification.module.js';
import { AttachmentModule } from './attachments/attachment.module.js';
import { AiModule } from './ai/ai.module.js';
import { TranscriptionModule } from './transcription/transcription.module.js';
import { ReportingModule } from './reporting/reporting.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { KnowledgeModule } from './knowledge/knowledge.module.js';
import { SlaModule } from './sla/sla.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { QueueWorker } from './jobs/queue.worker.js';
import { EmailModule } from './email/email.module.js';
import { TicketIntakeModule } from './ticket-intake/ticket-intake.module.js';
import { OrganizationApplicationModule } from './organization-applications/organization-application.module.js';
import { DirectoryConnectorModule } from './directory/directory-connector.module.js';
import { CommercialModule } from './commercial/commercial.module.js';
import { AssistModule } from './assist/assist.module.js';
import { AppearanceModule } from './appearance/appearance.module.js';
import { ProductHelpModule } from './help/help.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, TicketModule, NotificationModule, ConversationModule, AttachmentModule, AiModule, TranscriptionModule, ReportingModule, OrganizationModule, KnowledgeModule, SlaModule, EmailModule, TicketIntakeModule, OrganizationApplicationModule, DirectoryConnectorModule, CommercialModule, AssistModule, AppearanceModule, ProductHelpModule],
  controllers: [HealthController],
  providers: [HealthService, QueueWorker],
})
export class AppModule {}
