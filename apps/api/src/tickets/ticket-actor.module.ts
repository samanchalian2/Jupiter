import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TicketActorService } from './ticket-actor.service.js';
@Module({imports:[AuthModule],providers:[TicketActorService],exports:[TicketActorService]})
export class TicketActorModule {}
