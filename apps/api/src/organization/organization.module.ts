import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AttachmentModule } from '../attachments/attachment.module.js';
import { CommercialModule } from '../commercial/commercial.module.js';
import { NotificationModule } from '../notifications/notification.module.js';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { OrganizationSetupService } from './organization-setup.service.js';
import { OrganizationAccessPolicy } from './organization-access.policy.js';

@Module({ imports: [TicketModule, AuthModule, AttachmentModule, CommercialModule, NotificationModule], controllers: [OrganizationController], providers: [OrganizationService, OrganizationSetupService, OrganizationAccessPolicy], exports:[OrganizationAccessPolicy] })
export class OrganizationModule {}
