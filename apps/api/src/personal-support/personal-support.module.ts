import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notifications/notification.module.js';
import { PersonalCapacityModule } from '../personal-capacity/personal-capacity.module.js';
import { TicketModule } from '../tickets/ticket.module.js';
import { PersonalSupportController, PlatformPersonalSupportController } from './personal-support.controller.js';
import { PersonalSupportService } from './personal-support.service.js';

@Module({
  imports:[AuthModule,TicketModule,NotificationModule,PersonalCapacityModule],
  controllers:[PersonalSupportController,PlatformPersonalSupportController],
  providers:[PersonalSupportService],
  exports:[PersonalSupportService],
})
export class PersonalSupportModule {}
