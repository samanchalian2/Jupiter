import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TicketModule } from '../tickets/ticket.module.js';
import { PersonalCapacityController, PlatformPersonalCapacityController } from './personal-capacity.controller.js';
import { PersonalCapacityService } from './personal-capacity.service.js';

@Module({
  imports:[AuthModule,TicketModule],
  controllers:[PersonalCapacityController,PlatformPersonalCapacityController],
  providers:[PersonalCapacityService],
  exports:[PersonalCapacityService],
})
export class PersonalCapacityModule {}
