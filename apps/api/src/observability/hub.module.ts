import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { HubBindingService } from './hub-binding.service.js';
import { HubController } from './hub.controller.js';
import { HubInterceptor } from './hub.interceptor.js';
@Module({imports:[AuthModule],providers:[HubBindingService,{provide:APP_INTERCEPTOR,useClass:HubInterceptor}],controllers:[HubController],exports:[HubBindingService]})
export class ObservabilityHubModule{}
