import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { ProductHelpService } from './help.service.js';

@Controller('help/articles')
export class ProductHelpController {
  constructor(private readonly help: ProductHelpService, private readonly auth: AuthService) {}
  private async optionalUser(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    return token ? (await this.auth.verify(token)).sub : undefined;
  }
  @Get() list(@Query('q') q?:string,@Query('category') category?:string,@Query('relatedRoute') relatedRoute?:string,@Query('relatedFeature') relatedFeature?:string,@Headers('authorization') authorization?:string) { return this.optionalUser(authorization).then(userId => this.help.list(userId,{q,category,relatedRoute,relatedFeature})); }
  @Get(':slug') detail(@Param('slug') slug:string,@Headers('authorization') authorization?:string) { return this.optionalUser(authorization).then(userId => this.help.detail(userId,slug)); }
}
