import { Module } from '@nestjs/common';
import { TicketActorModule } from '../tickets/ticket-actor.module.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({ imports: [TicketActorModule,AuthModule], controllers: [NotificationController], providers: [NotificationService], exports: [NotificationService] })
export class NotificationModule {}
