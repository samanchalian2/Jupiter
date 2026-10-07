import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from '../config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PersonalWorkspaceModule } from '../personal-workspaces/personal-workspace.module.js';
import { PersonalWorkspaceController } from '../personal-workspaces/personal-workspace.controller.js';
@Module({ imports:[JwtModule.register({ secret: jwtSecret(), signOptions:{expiresIn:'15m'} }),PersonalWorkspaceModule], controllers:[AuthController,PersonalWorkspaceController], providers:[AuthService], exports:[AuthService] })
export class AuthModule {}
