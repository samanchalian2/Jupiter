import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AppearanceController } from './appearance.controller.js';
import { AppearanceService } from './appearance.service.js';

@Module({ imports: [AuthModule], controllers: [AppearanceController], providers: [AppearanceService] })
export class AppearanceModule {}
