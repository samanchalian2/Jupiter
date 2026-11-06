import { Module } from '@nestjs/common';
import { CommercialModule } from '../commercial/commercial.module.js';
import { AssistRoutingService } from './assist-routing.service.js';

@Module({imports:[CommercialModule],providers:[AssistRoutingService],exports:[AssistRoutingService]})
export class AssistRoutingModule {}
