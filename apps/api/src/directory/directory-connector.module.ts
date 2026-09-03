import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js'; import { NotificationModule } from '../notifications/notification.module.js';
import { OrganizationModule } from '../organization/organization.module.js';
import { DirectoryConnectorController } from './directory-connector.controller.js';
import { DirectoryConnectorService } from './directory-connector.service.js';

@Module({ imports:[TicketModule,NotificationModule,OrganizationModule], controllers:[DirectoryConnectorController], providers:[DirectoryConnectorService], exports:[DirectoryConnectorService] })
export class DirectoryConnectorModule {}
