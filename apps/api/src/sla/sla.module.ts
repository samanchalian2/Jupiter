import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module.js';
import { TicketModule } from '../tickets/ticket.module.js';
import { SlaController } from './sla.controller.js';
import { SlaService } from './sla.service.js';
@Module({imports:[TicketModule,NotificationModule],controllers:[SlaController],providers:[SlaService],exports:[SlaService]}) export class SlaModule {}
