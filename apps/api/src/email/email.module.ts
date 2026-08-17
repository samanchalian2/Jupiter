import { Module } from '@nestjs/common';
import { EmailController } from './email.controller.js';
import { EmailIngressService } from './email-ingress.service.js';
@Module({controllers:[EmailController],providers:[EmailIngressService]}) export class EmailModule {}
