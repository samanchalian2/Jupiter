import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js'; import { TicketModule } from '../tickets/ticket.module.js';
import { CommercialModule } from '../commercial/commercial.module.js'; import { NotificationModule } from '../notifications/notification.module.js';
import { AssistController } from './assist.controller.js';
import { AssistService } from './assist.service.js'; import { AssistCapacityService } from './assist-capacity.service.js';

@Module({ imports: [AuthModule,TicketModule,CommercialModule,NotificationModule], controllers: [AssistController], providers: [AssistService,AssistCapacityService], exports: [AssistService,AssistCapacityService] })
export class AssistModule {}
