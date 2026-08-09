import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from '../config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
@Module({ imports:[JwtModule.register({ secret: jwtSecret(), signOptions:{expiresIn:'15m'} })], controllers:[AuthController], providers:[AuthService] })
export class AuthModule {}
