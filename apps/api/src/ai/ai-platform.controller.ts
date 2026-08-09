import { Body, Controller, Headers, Put, UnauthorizedException, Post, Param, Get } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AiGatewayService } from './ai-gateway.service.js';
@Controller('platform/ai-settings') export class AiPlatformController {
 constructor(private readonly auth:AuthService,private readonly ai:AiGatewayService) {}
 @Put() async configure(@Headers('authorization') authorization:string|undefined,@Body() body:{organizationId:string;enabled:boolean;model:string}) { const token=authorization?.replace(/^Bearer\s+/i,''); if(!token) throw new UnauthorizedException(); const actor=await this.auth.verify(token); return this.ai.configurePlatform(actor.sub,body.organizationId,body.enabled,body.model); }
 @Post('requests/:ticketId') async request(@Param('ticketId') ticketId:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined,@Body() body:{text:string}) { const token=authorization?.replace(/^Bearer\s+/i,''); if(!token||!organizationId) throw new UnauthorizedException(); const actor=await this.auth.verify(token); return this.ai.enqueue({userId:actor.sub,organizationId,roles:[]},ticketId,body.text); }
 @Get('requests/:id/review') async review(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined) { const token=authorization?.replace(/^Bearer\s+/i,''); if(!token||!organizationId) throw new UnauthorizedException(); const actor=await this.auth.verify(token); return this.ai.review({userId:actor.sub,organizationId},id); }
}
