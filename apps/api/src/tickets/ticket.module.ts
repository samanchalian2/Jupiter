import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller.js';
import { TicketService } from './ticket.service.js';
import { TicketActorService } from './ticket-actor.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AssistRoutingModule } from '../assist/assist-routing.module.js';
import { TicketActorModule } from './ticket-actor.module.js';
@Module({ imports:[AuthModule,TicketActorModule,AssistRoutingModule], controllers:[TicketController], providers:[TicketService], exports:[TicketService,TicketActorModule] })
export class TicketModule {}
