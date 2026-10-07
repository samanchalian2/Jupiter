import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TicketModule } from '../tickets/ticket.module.js';
import { PaymentProviderRegistry } from './payment-provider.js';
import { PersonalPaymentController, PlatformPersonalPaymentController } from './personal-payment.controller.js';
import { PersonalPaymentService } from './personal-payment.service.js';

@Module({imports:[AuthModule,TicketModule],controllers:[PersonalPaymentController,PlatformPersonalPaymentController],providers:[PaymentProviderRegistry,PersonalPaymentService],exports:[PersonalPaymentService]})
export class PersonalPaymentModule {}
