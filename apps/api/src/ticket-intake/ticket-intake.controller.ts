import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { TicketIntakeService } from './ticket-intake.service.js';

@Controller()
export class TicketIntakeController {
  constructor(private readonly actors:TicketActorService,private readonly intakes:TicketIntakeService) {}

  @Post('ticket-intakes')
  async create(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string,@Headers('idempotency-key') idempotencyKey?:string,@Body() body:{description?:string}={}) {
    return this.intakes.create(await this.actors.fromHeaders(authorization,organizationId),{description:body.description,idempotencyKey});
  }

  @Get('ticket-intakes/capabilities')
  async capabilities(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.capabilities(await this.actors.fromHeaders(authorization,organizationId));
  }

  @Post('ticket-intakes/:id/voice/upload-request')
  async uploadRequest(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string,@Body() body:{filename:string;contentType:string;byteSize:number;durationSeconds:number}={filename:'',contentType:'',byteSize:0,durationSeconds:0}) {
    return this.intakes.requestVoiceUpload(await this.actors.fromHeaders(authorization,organizationId),id,body);
  }

  @Post('ticket-intakes/:id/messages')
  async addTextMessage(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string,@Body() body:{text?:string}={}) {
    return this.intakes.addTextMessage(await this.actors.fromHeaders(authorization,organizationId),id,{text:body.text??''});
  }

  @Post('ticket-intakes/:id/messages/voice/upload-request')
  async messageVoiceUpload(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string,@Body() body:{filename:string;contentType:string;byteSize:number;durationSeconds:number}={filename:'',contentType:'',byteSize:0,durationSeconds:0}) {
    return this.intakes.requestMessageVoiceUpload(await this.actors.fromHeaders(authorization,organizationId),id,body);
  }

  @Post('ticket-intakes/:id/messages/:messageId/voice/complete')
  async completeMessageVoice(@Param('id') id:string,@Param('messageId') messageId:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.completeMessageVoiceUpload(await this.actors.fromHeaders(authorization,organizationId),id,messageId);
  }

  @Post('ticket-intakes/:id/messages/:messageId/discard')
  async discardMessage(@Param('id') id:string,@Param('messageId') messageId:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.discardMessage(await this.actors.fromHeaders(authorization,organizationId),id,messageId);
  }

  @Post('ticket-intakes/:id/cancel')
  async cancel(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.cancel(await this.actors.fromHeaders(authorization,organizationId),id);
  }

  @Post('ticket-intakes/:id/voice/complete')
  async complete(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.completeVoiceUpload(await this.actors.fromHeaders(authorization,organizationId),id);
  }

  @Post('ticket-intakes/:id/voice/discard')
  async discard(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.discardVoice(await this.actors.fromHeaders(authorization,organizationId),id);
  }

  @Post('ticket-intakes/:id/analyze')
  async analyze(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.analyze(await this.actors.fromHeaders(authorization,organizationId),id);
  }

  @Post('ticket-intakes/:id/conversation/analyze')
  async analyzeConversation(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.analyzeConversation(await this.actors.fromHeaders(authorization,organizationId),id);
  }

  @Get('ticket-intakes/:id')
  async get(@Param('id') id:string,@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string) {
    return this.intakes.get(await this.actors.fromHeaders(authorization,organizationId),id);
  }

  @Post('tickets/drafts')
  async draft(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string,@Body() body:{title:string;description:string;priority?:string;departmentId?:string;categoryId?:string;subcategoryId?:string;locationId?:string;disciplineId?:string;customFields?:Record<string,unknown>;tags?:Array<{id?:string;name?:string;kind?:'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER'}>;intakeSessionId?:string}={title:'',description:''}) {
    return this.intakes.createDraft(await this.actors.fromHeaders(authorization,organizationId),body);
  }

  @Post('tickets/intake-batches')
  async batch(@Headers('authorization') authorization?:string,@Headers('x-organization-id') organizationId?:string,@Body() body:{title:string;description:string;priority?:string;departmentId?:string;categoryId?:string;subcategoryId?:string;locationId?:string;disciplineId?:string;customFields?:Record<string,unknown>;tags?:Array<{id?:string;name?:string;kind?:'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER'}>;intakeSessionId:string;secondaryProposalIds?:string[]}={title:'',description:'',intakeSessionId:''}) {
    return this.intakes.createBatch(await this.actors.fromHeaders(authorization,organizationId),body);
  }
}
