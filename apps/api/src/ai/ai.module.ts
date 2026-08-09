import { Module } from '@nestjs/common'; import { AuthModule } from '../auth/auth.module.js'; import { AiGatewayService } from './ai-gateway.service.js'; import { AiPlatformController } from './ai-platform.controller.js';
@Module({imports:[AuthModule],controllers:[AiPlatformController],providers:[AiGatewayService],exports:[AiGatewayService]}) export class AiModule {}
