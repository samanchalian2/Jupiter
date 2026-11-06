import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TicketActorModule } from '../tickets/ticket-actor.module.js';
import { PersonalCapacityController, PlatformPersonalCapacityController } from './personal-capacity.controller.js';
import { PersonalCapacityService } from './personal-capacity.service.js';

@Module({
  imports:[AuthModule,TicketActorModule],
  controllers:[PersonalCapacityController,PlatformPersonalCapacityController],
  providers:[PersonalCapacityService],
  exports:[PersonalCapacityService],
})
export class PersonalCapacityModule {}
