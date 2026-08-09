import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller.js';
import { TicketService } from './ticket.service.js';
import { TicketActorService } from './ticket-actor.service.js';
@Module({ controllers:[TicketController], providers:[TicketService, TicketActorService], exports:[TicketActorService] })
export class TicketModule {}
