import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AssistService } from './assist.service.js';
import { TicketActorService } from '../tickets/ticket-actor.service.js';

@Controller('platform/assist')
export class AssistController {
  constructor(private readonly auth: AuthService, private readonly actors: TicketActorService, private readonly assist: AssistService) {}
  private async user(authorization?: string) { const token=authorization?.replace(/^Bearer\s+/i,''); if (!token) throw new UnauthorizedException(); return (await this.auth.verify(token)).sub; }
  @Get('agents') agents(@Headers('authorization') authorization?: string) { return this.user(authorization).then(userId=>this.assist.agents(userId)); }
  @Post('agents') agent(@Body() body:{userId?:string;status?:'ACTIVE'|'SUSPENDED'},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.saveAgent(userId,body)); }
  @Get('policies') policies(@Headers('authorization') authorization?: string) { return this.user(authorization).then(userId=>this.assist.policies(userId)); }
  @Post('policies') policy(@Body() body:{organizationId?:string;requestPolicy?:string;defaultAccessScope?:string;capacityUnits?:number;assistSlaMinutes?:number},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.savePolicy(userId,body)); }
  @Get('grants') grants(@Headers('authorization') authorization?: string) { return this.user(authorization).then(userId=>this.assist.grants(userId)); }
  @Post('grants') grant(@Body() body:{organizationId?:string;supportAgentUserId?:string;scope?:string;ticketId?:string;departmentId?:string;categoryId?:string;allowsRestricted?:boolean;expiresAt?:string},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.createGrant(userId,body)); }
  @Post('grants/:id/revoke') revoke(@Param('id') id:string,@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.revokeGrant(userId,id)); }

  @Get('cases') cases(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.assist.cases(actor)); }
  @Post('tickets/:ticketId/request') request(@Param('ticketId') ticketId:string,@Body() body:{note?:string},@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.assist.request(actor,ticketId,body.note)); }
  @Post('cases/:id/approve') approve(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.assist.approve(actor,id)); }
  @Get('platform/cases') platformCases(@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.platformCases(userId)); }
  @Post('platform/cases/:id/accept') accept(@Param('id') id:string,@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.accept(userId,id)); }
  @Post('platform/cases/:id/state') state(@Param('id') id:string,@Body() body:{status?:string},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.agentState(userId,id,body.status)); }
  @Post('platform/cases/:id/additional-access') accessRequest(@Param('id') id:string,@Body() body:{durationCode?:string},@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.requestAdditionalAccess(userId,id,body.durationCode)); }
  @Post('platform/access-requests/:id/approve') accessApprove(@Param('id') id:string,@Headers('authorization') authorization?:string) { return this.user(authorization).then(userId=>this.assist.approveAdditionalAccess(userId,id)); }
}
