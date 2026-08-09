import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

@Module({ imports: [TicketModule], controllers: [NotificationController], providers: [NotificationService], exports: [NotificationService] })
export class NotificationModule {}
