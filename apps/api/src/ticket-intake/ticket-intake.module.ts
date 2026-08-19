import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { AttachmentModule } from '../attachments/attachment.module.js';
import { TicketModule } from '../tickets/ticket.module.js';
import { TicketIntakeController } from './ticket-intake.controller.js';
import { TicketIntakeService } from './ticket-intake.service.js';

@Module({imports:[TicketModule,AttachmentModule,AiModule],controllers:[TicketIntakeController],providers:[TicketIntakeService],exports:[TicketIntakeService]})
export class TicketIntakeModule {}

