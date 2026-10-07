import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { PersonalCapacityService } from './personal-capacity.service.js';

@Controller('personal/capacity')
export class PersonalCapacityController {
  constructor(private readonly actors:TicketActorService,private readonly capacity:PersonalCapacityService) {}
  @Get('summary') summary(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.actors.fromHeaders(authorization,organizationId).then(actor=>this.capacity.ownerSummary(actor));
  }
}

@Controller('platform/personal-capacity')
export class PlatformPersonalCapacityController {
  constructor(private readonly auth:AuthService,private readonly capacity:PersonalCapacityService) {}
  private async user(authorization?:string) { const token=authorization?.replace(/^Bearer\s+/i,'');if(!token)throw new UnauthorizedException();return(await this.auth.verify(token)).sub; }
  @Get('policies') policies(@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.platformPolicies(user));}
  @Post('policies') savePolicy(@Body() body:{poolCode?:string;monthlyUnits?:number},@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.savePolicy(user,body));}
  @Get('workspaces') workspaces(@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.platformWorkspaces(user));}
  @Get('overrides') overrides(@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.platformOverrides(user));}
  @Post('overrides') saveOverride(@Body() body:{organizationId?:string;poolCode?:string;monthlyUnits?:number|null},@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.saveOverride(user,body));}
  @Get('packages') packages(@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.platformPackages(user));}
  @Post('packages') savePackage(@Body() body:{id?:string;code?:string;name?:string;description?:string;poolCode?:'SUPPORT'|'AI';unitCount?:number;priceIrt?:number;validityDays?:number;status?:'DRAFT'|'ACTIVE'|'RETIRED'},@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.savePackage(user,body));}
  @Get('allocations') allocations(@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.platformAllocations(user));}
  @Post('allocations') allocate(@Body() body:{organizationId?:string;packageId?:string;reason?:string},@Headers('idempotency-key') key:string|undefined,@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.allocatePackage(user,{...body,idempotencyKey:key}));}
  @Post('allocations/:id/revoke') revoke(@Param('id') id:string,@Body() body:{reason?:string},@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.revokeAllocation(user,id,body.reason));}
  @Get('summary') summary(@Query('organizationId') organizationId:string|undefined,@Headers('authorization') authorization?:string){return this.user(authorization).then(user=>this.capacity.platformSummary(user,organizationId??''));}
}
