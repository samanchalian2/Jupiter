import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TicketModule } from '../tickets/ticket.module.js';
import { OrganizationModule } from '../organization/organization.module.js';
import { AppearanceController } from './appearance.controller.js';
import { AppearanceService } from './appearance.service.js';

@Module({ imports: [AuthModule, TicketModule, OrganizationModule], controllers: [AppearanceController], providers: [AppearanceService] })
export class AppearanceModule {}
