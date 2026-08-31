import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js'; import { TicketModule } from '../tickets/ticket.module.js';
import { CommercialModule } from '../commercial/commercial.module.js';
import { AssistController } from './assist.controller.js';
import { AssistService } from './assist.service.js';

@Module({ imports: [AuthModule,TicketModule,CommercialModule], controllers: [AssistController], providers: [AssistService], exports: [AssistService] })
export class AssistModule {}
