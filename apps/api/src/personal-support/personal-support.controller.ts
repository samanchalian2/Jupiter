import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { PersonalSupportService } from './personal-support.service.js';

@Controller('personal/support')
export class PersonalSupportController {
  constructor(private readonly actors:TicketActorService,private readonly support:PersonalSupportService) {}
  private actor(authorization?:string,organizationId?:string) { return this.actors.fromHeaders(authorization,organizationId); }
  @Get('catalog') catalog(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.support.effectiveCatalog(actor)); }
  @Get('cases') cases(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.support.cases(actor)); }
  @Post('tickets/:ticketId/request') request(@Param('ticketId') ticketId:string,@Body() body:{note?:string},@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.support.request(actor,ticketId,body.note)); }
  @Post('cases/:id/cancel') cancel(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.support.cancel(actor,id)); }
}

@Controller('platform/personal-support')
export class PlatformPersonalSupportController {
  constructor(private readonly auth:AuthService,private readonly support:PersonalSupportService) {}
  private async user(authorization?:string) { const token=authorization?.replace(/^Bearer\s+/i,'');if(!token)throw new UnauthorizedException();return(await this.auth.verify(token)).sub; }
  @Get('catalog') catalog(@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.platformCatalog(userId)); }
  @Post('catalog') saveCatalog(@Body() body:{status?:'ACTIVE'|'SUSPENDED';displayName?:string;description?:string;slaMinutes?:number;accessGrantMinutes?:number},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.saveCatalog(userId,body)); }
  @Get('cases') cases(@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.platformCases(userId)); }
  @Post('cases/:id/accept') accept(@Param('id') id:string,@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.accept(userId,id)); }
  @Post('cases/:id/state') state(@Param('id') id:string,@Body() body:{status?:string},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.changeState(userId,id,body.status)); }
  @Post('cases/:id/reject') reject(@Param('id') id:string,@Body() body:{reason?:string},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.reject(userId,id,body.reason)); }
  @Post('cases/:id/revoke') revoke(@Param('id') id:string,@Body() body:{reason?:string},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.revoke(userId,id,body.reason)); }
  @Get('cases/:id/ticket') ticket(@Param('id') id:string,@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.ticket(userId,id)); }
  @Get('cases/:id/messages') messages(@Param('id') id:string,@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.messages(userId,id)); }
  @Post('cases/:id/messages') message(@Param('id') id:string,@Body() body:{body?:string},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.support.addMessage(userId,id,body.body)); }
}
