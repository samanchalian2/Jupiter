import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { TicketStatus } from './ticket-lifecycle.js';
import { TicketService } from './ticket.service.js';
import { TicketActorService } from './ticket-actor.service.js';

@Controller('tickets')
export class TicketController {
  constructor(private readonly actors: TicketActorService, private readonly tickets: TicketService) {}
  @Get() async list(@Query('status') status:string,@Query('priority') priority:string,@Query('q') query:string,@Query('tag') tag:string,@Query('sort') sort:string,@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.tickets.list(await this.actors.fromHeaders(authorization, organizationId), {status,priority,query,tag,sort}); }
  @Get('queue') async queue(@Query('status') status:string,@Query('priority') priority:string,@Query('q') query:string,@Query('tag') tag:string,@Query('sort') sort:string,@Query('page') page:string,@Query('pageSize') pageSize:string,@Headers('authorization') authorization?: string,@Headers('x-organization-id') organizationId?: string) { return this.tickets.page(await this.actors.fromHeaders(authorization, organizationId), {status,priority,query,tag,sort,page:Number(page)||1,pageSize:Number(pageSize)||20}); }
  @Get('views') views(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.savedViews(actor)); }
  @Post('views') saveView(@Body() body:{name:string;filters:object;isShared?:boolean},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.saveView(actor,body)); }
  @Get('assignees') async assignees(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.tickets.assignees(await this.actors.fromHeaders(authorization, organizationId)); }
  @Get('tags') tags(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.tags(actor)); }
  @Get('catalog/:kind') catalog(@Param('kind') kind:string,@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.catalog(actor,kind)); }
  @Get('custom-fields') customFields(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.customFields(actor)); }
  @Get(':id') ticket(@Param('id') id:string,@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.get(actor,id)); }
  @Post('tags') createTag(@Body() body:{name:string;color?:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.createTag(actor,body.name,body.color)); }
  @Post(':id/watch') watch(@Param('id') id:string,@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.watch(actor,id)); }
  @Post(':id/tags/:tagId') linkTag(@Param('id') id:string,@Param('tagId') tagId:string,@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.linkTag(actor,id,tagId)); }
  @Post('bulk/status') bulkStatus(@Body() body:{ticketIds:string[];status:TicketStatus},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actors.fromHeaders(a,o).then(actor=>this.tickets.bulkStatus(actor,body.ticketIds,body.status)); }
  @Post(':id/submit') async submit(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined) { return this.tickets.submit(await this.actors.fromHeaders(authorization,organizationId),id); }
  @Post(':id/status') async change(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined,@Body() body:{status:TicketStatus;reason?:string}) { return this.tickets.changeStatus(await this.actors.fromHeaders(authorization,organizationId),id,body.status,body.reason); }
  @Post(':id/assignment') async assign(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined,@Body() body:{assignedToUserId:string}) { return this.tickets.assign(await this.actors.fromHeaders(authorization,organizationId),id,body.assignedToUserId); }
}
