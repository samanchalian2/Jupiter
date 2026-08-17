import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { KnowledgeService } from './knowledge.service.js';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly actors: TicketActorService, private readonly knowledge: KnowledgeService) {}
  private actor(a?: string, o?: string) { return this.actors.fromHeaders(a,o); }
  @Get() list(@Query('q')q:string,@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.list(x,q??''));}
  @Get('workspace') workspace(@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.workspace(x));}
  @Get('review-queue') queue(@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.workspace(x));}
  @Get(':id') detail(@Param('id')id:string,@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.detail(x,id));}
  @Get(':id/revisions') revisions(@Param('id')id:string,@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.revisions(x,id));}
  @Post() create(@Body()b:{title:string;body:string},@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.create(x,b));}
  @Post(':id') update(@Param('id')id:string,@Body()b:{title:string;body:string},@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.update(x,id,b));}
  @Post(':id/submit-review') submit(@Param('id')id:string,@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.submitReview(x,id));}
  @Post(':id/publish') publish(@Param('id')id:string,@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.publish(x,id));}
  @Post(':id/archive') archive(@Param('id')id:string,@Headers('authorization')a?:string,@Headers('x-organization-id')o?:string){return this.actor(a,o).then(x=>this.knowledge.archive(x,id));}
}
