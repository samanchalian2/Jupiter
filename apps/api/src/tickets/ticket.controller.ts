import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { DatabaseService } from '../database/database.service.js';
import { TicketStatus } from './ticket-lifecycle.js';
import { TicketService } from './ticket.service.js';

@Controller('tickets')
export class TicketController {
  constructor(private readonly auth: AuthService, private readonly database: DatabaseService, private readonly tickets: TicketService) {}
  @Get() async list(@Headers('authorization') authorization?: string, @Headers('x-organization-id') organizationId?: string) { return this.tickets.list(await this.actor(authorization, organizationId)); }
  @Post('drafts') async draft(@Headers('authorization') authorization: string | undefined, @Headers('x-organization-id') organizationId: string | undefined, @Body() body: {title?:string;description?:string;priority?:string;departmentId?:string}) {
    if (!body.title || !body.description) throw new UnauthorizedException('Title and description are required');
    return this.tickets.createDraft(await this.actor(authorization,organizationId), { title:body.title, description:body.description, priority:body.priority, departmentId:body.departmentId });
  }
  @Post(':id/submit') async submit(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined) { return this.tickets.submit(await this.actor(authorization,organizationId),id); }
  @Post(':id/status') async change(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined,@Body() body:{status:TicketStatus;reason?:string}) { return this.tickets.changeStatus(await this.actor(authorization,organizationId),id,body.status,body.reason); }
  @Post(':id/assignment') async assign(@Param('id') id:string,@Headers('authorization') authorization:string|undefined,@Headers('x-organization-id') organizationId:string|undefined,@Body() body:{assignedToUserId:string}) { return this.tickets.assign(await this.actor(authorization,organizationId),id,body.assignedToUserId); }
  private async actor(authorization?:string, organizationId?:string) {
    const token=authorization?.replace(/^Bearer\s+/i,''); if(!token || !organizationId) throw new UnauthorizedException();
    const payload=await this.auth.verify(token);
    const rows=(await this.database.query<{role_codes:string[]}>('SELECT array_agg(r.code) AS role_codes FROM memberships m LEFT JOIN membership_roles mr ON mr.membership_id=m.id LEFT JOIN roles r ON r.id=mr.role_id WHERE m.organization_id=$1 AND m.user_id=$2 AND m.status=\'active\'',[organizationId,payload.sub])).rows;
    if(!rows[0]?.role_codes) throw new UnauthorizedException();
    return { userId:payload.sub,organizationId,roles:rows[0].role_codes.filter(Boolean) };
  }
}
