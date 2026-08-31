import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { DirectoryConnectorService } from './directory-connector.service.js';

@Controller('directory')
export class DirectoryConnectorController {
  constructor(private readonly actors: TicketActorService, private readonly connectors: DirectoryConnectorService) {}
  private actor(authorization?: string, organizationId?: string) { return this.actors.fromHeaders(authorization,organizationId); }

  @Get('connectors') list(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.connectors.list(actor)); }
  @Post('connectors') create(@Body() body:{displayName?:string},@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.connectors.create(actor,body.displayName)); }
  @Post('connectors/:id/pairings') pairing(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.connectors.createPairing(actor,id)); }
  @Post('connectors/:id/revoke') revoke(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.connectors.revoke(actor,id)); }
  @Get('connectors/:id/sync-runs') runs(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) { return this.actor(authorization,organizationId).then(actor=>this.connectors.runs(actor,id)); }
  @Post('agent/pair') pair(@Body() body:{pairingCode?:string;deviceName?:string}) { return this.connectors.pair(body.pairingCode,body.deviceName); }
  @Post('agent/heartbeat') heartbeat(@Body() body:{version?:string},@Headers('authorization') authorization?:string,@Headers('x-directory-device-id') deviceId?:string,@Headers('x-directory-connector-id') connectorId?:string) { return this.connectors.heartbeat(connectorId,deviceId,authorization?.replace(/^Bearer\s+/i,''),body.version); }
  @Post('agent/sync/preview') preview(@Body() body:unknown,@Headers('authorization') authorization?:string,@Headers('x-directory-device-id') deviceId?:string,@Headers('x-directory-connector-id') connectorId?:string) { return this.connectors.preview(connectorId,deviceId,authorization?.replace(/^Bearer\s+/i,''),body); }
  @Post('agent/sync/apply') apply(@Body() body:{runId?:string},@Headers('authorization') authorization?:string,@Headers('x-directory-device-id') deviceId?:string,@Headers('x-directory-connector-id') connectorId?:string) { return this.connectors.apply(connectorId,deviceId,authorization?.replace(/^Bearer\s+/i,''),body.runId); }
}
