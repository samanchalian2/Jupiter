import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { ProductHelpService } from './help.service.js';

@Controller('help/admin')
export class ProductHelpAdminController {
  constructor(private readonly help:ProductHelpService, private readonly auth:AuthService) {}
  private user(authorization?:string) { const token=authorization?.replace(/^Bearer\s+/i,'');if(!token)throw new UnauthorizedException();return this.auth.verify(token).then(value=>value.sub); }
  @Get('export') export(@Query('format') format?:string,@Query('slug') slug?:string,@Query('category') category?:string,@Headers('authorization') authorization?:string){return this.user(authorization).then(actor=>this.help.export(actor,{format,slug,category}));}
  @Get('articles') list(@Query('q') q?:string,@Headers('authorization') authorization?:string){return this.user(authorization).then(actor=>this.help.adminList(actor,q));}
  @Get('articles/:articleId') detail(@Param('articleId') articleId:string,@Headers('authorization') authorization?:string){return this.user(authorization).then(actor=>this.help.adminDetail(actor,articleId));}
  @Get('articles/:articleId/revisions/:revisionId/preview') preview(@Param('articleId') articleId:string,@Param('revisionId') revisionId:string,@Headers('authorization') authorization?:string){return this.user(authorization).then(actor=>this.help.preview(actor,articleId,revisionId));}
  @Post('articles') create(@Body() body:Record<string,unknown>,@Headers('authorization') authorization?:string){return this.user(authorization).then(actor=>this.help.create(actor,body));}
  @Post('articles/:articleId/drafts') draft(@Param('articleId') articleId:string,@Body() body:Record<string,unknown>,@Headers('authorization') authorization?:string){return this.user(authorization).then(actor=>this.help.draft(actor,articleId,body));}
  @Post('articles/:articleId/publish') publish(@Param('articleId') articleId:string,@Body() body:{revisionId?:string},@Headers('authorization') authorization?:string){if(!body.revisionId)throw new UnauthorizedException();return this.user(authorization).then(actor=>this.help.publish(actor,articleId,body.revisionId!));}
  @Post('articles/:articleId/unpublish') unpublish(@Param('articleId') articleId:string,@Headers('authorization') authorization?:string){return this.user(authorization).then(actor=>this.help.unpublish(actor,articleId));}
  @Post('articles/:articleId/restore') restore(@Param('articleId') articleId:string,@Body() body:{revisionId?:string},@Headers('authorization') authorization?:string){if(!body.revisionId)throw new UnauthorizedException();return this.user(authorization).then(actor=>this.help.restore(actor,articleId,body.revisionId!));}
}
