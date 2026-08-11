import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';

@Module({ imports: [TicketModule, AuthModule], controllers: [OrganizationController], providers: [OrganizationService] })
export class OrganizationModule {}
