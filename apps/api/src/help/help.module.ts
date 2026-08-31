import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProductHelpController } from './help.controller.js';
import { ProductHelpAdminController } from './help-admin.controller.js';
import { ProductHelpService } from './help.service.js';

@Module({ imports: [AuthModule], controllers: [ProductHelpController, ProductHelpAdminController], providers: [ProductHelpService], exports: [ProductHelpService] })
export class ProductHelpModule {}
