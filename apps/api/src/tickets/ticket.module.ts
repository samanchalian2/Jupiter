import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller.js';
import { TicketService } from './ticket.service.js';
import { TicketActorService } from './ticket-actor.service.js';
import { AuthModule } from '../auth/auth.module.js';
@Module({ imports:[AuthModule], controllers:[TicketController], providers:[TicketService, TicketActorService], exports:[TicketService,TicketActorService] })
export class TicketModule {}
