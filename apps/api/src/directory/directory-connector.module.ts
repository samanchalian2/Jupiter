import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js';
import { DirectoryConnectorController } from './directory-connector.controller.js';
import { DirectoryConnectorService } from './directory-connector.service.js';

@Module({ imports:[TicketModule], controllers:[DirectoryConnectorController], providers:[DirectoryConnectorService], exports:[DirectoryConnectorService] })
export class DirectoryConnectorModule {}
