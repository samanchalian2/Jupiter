import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { OrganizationService } from './organization.service.js';
import { AuthService } from '../auth/auth.service.js';

@Controller('admin')
export class OrganizationController {
  constructor(private readonly actors: TicketActorService, private readonly organizations: OrganizationService, private readonly auth: AuthService) {}
  @Get('members') members(@Headers('authorization') a?: string, @Headers('x-organization-id') o?: string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.members(actor)); }
  @Post('members') addMember(@Body() body: {email:string;displayName:string;password:string;roles:string[]}, @Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.addMember(actor,body)); }
  @Get('catalog/:kind') catalog(@Param('kind') kind:string,@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.catalog(actor,kind)); }
  @Post('catalog/:kind') addCatalog(@Param('kind') kind:string,@Body() body:{code:string;name:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.addCatalog(actor,kind,body)); }
  @Get('settings') settings(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.settings(actor)); }
  @Post('settings') saveSettings(@Body() body:{closurePolicy:'STAFF_ONLY'|'REQUESTER_CONFIRMATION'|'AUTO_EXPIRE';reopenWindowDays:number;businessTimezone:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.saveSettings(actor,body)); }
  @Get('templates') templates(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.templates(actor)); }
  @Post('templates') saveTemplate(@Body() body:{name:string;body:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.saveTemplate(actor,body)); }
  @Get('platform/organizations') platformOrganizations(@Headers('authorization') a?:string) { const token=a?.replace(/^Bearer\s+/i,''); if(!token) throw new UnauthorizedException(); return this.auth.verify(token).then(user=>this.organizations.platformOrganizations(user.sub)); }
  @Post('platform/organizations/:id/status') platformStatus(@Param('id') id:string,@Body() body:{status:'active'|'suspended'},@Headers('authorization') a?:string) { const token=a?.replace(/^Bearer\s+/i,''); if(!token) throw new UnauthorizedException(); return this.auth.verify(token).then(user=>this.organizations.setOrganizationStatus(user.sub,id,body.status)); }
}
