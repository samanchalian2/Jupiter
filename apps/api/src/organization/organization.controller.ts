import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { OrganizationService } from './organization.service.js';

@Controller('admin')
export class OrganizationController {
  constructor(private readonly actors: TicketActorService, private readonly organizations: OrganizationService) {}
  @Get('members') members(@Headers('authorization') a?: string, @Headers('x-organization-id') o?: string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.members(actor)); }
  @Post('members') addMember(@Body() body: {email:string;displayName:string;password:string;roles:string[]}, @Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.addMember(actor,body)); }
  @Get('catalog/:kind') catalog(@Param('kind') kind:string,@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.catalog(actor,kind)); }
  @Post('catalog/:kind') addCatalog(@Param('kind') kind:string,@Body() body:{code:string;name:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.organizations.addCatalog(actor,kind,body)); }
}
