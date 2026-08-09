import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { TicketStatus } from './ticket-lifecycle.js';
import { TicketService } from './ticket.service.js';
import { TicketActorService } from './ticket-actor.service.js';

@Controller('tickets')
export class TicketController {
  constructor(private readonly actors: TicketActorService, private readonly tickets: TicketService) {}
  @Get() async list(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.tickets.list(await this.actors.fromHeaders(authorization, organizationId)); }
  @Get('assignees') async assignees(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.tickets.assignees(await this.actors.fromHeaders(authorization, organizationId)); }
  @Post('drafts') async draft(@Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined, @Body() body: {title?:string;description?:string;priority?:string;departmentId?:string}) {
    if (!body.title || !body.description) throw new UnauthorizedException('Title and description are required');
    return this.tickets.createDraft(await this.actors.fromHeaders(authorization,organizationId), { title:body.title, description:body.description, priority:body.priority, departmentId:body.departmentId });
  }
  @Post(':id/submit') async submit(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined) { return this.tickets.submit(await this.actors.fromHeaders(authorization,organizationId),id); }
  @Post(':id/status') async change(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined,@Body() body:{status:TicketStatus;reason?:string}) { return this.tickets.changeStatus(await this.actors.fromHeaders(authorization,organizationId),id,body.status,body.reason); }
  @Post(':id/assignment') async assign(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined,@Body() body:{assignedToUserId:string}) { return this.tickets.assign(await this.actors.fromHeaders(authorization,organizationId),id,body.assignedToUserId); }
}
