import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({ imports: [TicketModule,AuthModule], controllers: [NotificationController], providers: [NotificationService], exports: [NotificationService] })
export class NotificationModule {}
