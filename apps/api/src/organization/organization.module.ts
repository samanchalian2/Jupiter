import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';

@Module({ imports: [TicketModule], controllers: [OrganizationController], providers: [OrganizationService] })
export class OrganizationModule {}
