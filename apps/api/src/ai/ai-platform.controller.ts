import { Body, Controller, Headers, Put, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AiGatewayService } from './ai-gateway.service.js';
@Controller('platform/ai-settings') export class AiPlatformController {
 constructor(private readonly auth:AuthService,private readonly ai:AiGatewayService) {}
 @Put() async configure(@Headers('authorization') authorization:string|undefined,@Body() body:{organizationId:string;enabled:boolean;model:string}) { const token=authorization?.replace(/^Bearer\s+/i,''); if(!token) throw new UnauthorizedException(); const actor=await this.auth.verify(token); return this.ai.configurePlatform(actor.sub,body.organizationId,body.enabled,body.model); }
}
