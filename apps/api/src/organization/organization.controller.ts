import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { TicketActorService } from '../tickets/ticket-actor.service.js';
import { OrganizationService } from './organization.service.js';
import { AuthService } from '../auth/auth.service.js';

@Controller('admin')
export class OrganizationController {
  constructor(private readonly actors: TicketActorService, private readonly organizations: OrganizationService, private readonly auth: AuthService) {}
  private actor(authorization?: string, organizationId?: string) { return this.actors.fromHeaders(authorization, organizationId); }
  private platform(authorization?: string) { const token=authorization?.replace(/^Bearer\s+/i,''); if(!token) throw new UnauthorizedException(); return this.auth.verify(token); }

  @Get('members') members(@Headers('authorization') a?: string, @Headers('x-organization-id') o?: string) { return this.actor(a,o).then(actor=>this.organizations.members(actor)); }
  @Post('members') addMember(@Body() body: {email:string;username?:string;displayName:string;password:string;roles:string[]}, @Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.addMember(actor,body)); }
  @Post('members/:id') updateMember(@Param('id') id:string,@Body() body:{displayName?:string;username?:string;roles?:string[];status?:'active'|'inactive'},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.updateMember(actor,id,body)); }
  @Post('members/:id/reset-password') resetPassword(@Param('id') id:string,@Body() body:{password:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.resetMemberPassword(actor,id,body.password)); }

  @Get('catalog/:kind') catalog(@Param('kind') kind:string,@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.catalog(actor,kind)); }
  @Post('catalog/:kind') addCatalog(@Param('kind') kind:string,@Body() body:{code:string;name:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.addCatalog(actor,kind,body)); }
  @Get('catalog-readiness') catalogReadiness(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.catalogReadiness(actor)); }
  @Get('catalog-template') catalogTemplate(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.catalogTemplate(actor)); }
  @Post('catalog-template/install') installCatalogTemplate(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.installCatalogTemplate(actor)); }
  @Get('catalog-suggestions') catalogSuggestions(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.catalogSuggestions(actor)); }
  @Post('catalog-suggestions/:id/review') reviewCatalogSuggestion(@Param('id') id:string,@Body() body:{decision:'APPROVED'|'REJECTED';code?:string;name?:string;parentCategoryId?:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.reviewCatalogSuggestion(actor,id,body)); }
  @Get('teams') teams(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.teams(actor)); }
  @Post('teams') saveTeam(@Body() body:{id?:string;name:string;memberIds:string[];isActive?:boolean},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.saveTeam(actor,body)); }

  @Get('settings') settings(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.settings(actor)); }
  @Post('settings') saveSettings(@Body() body:{closurePolicy:'STAFF_ONLY'|'REQUESTER_CONFIRMATION'|'AUTO_EXPIRE';reopenWindowDays:number;businessTimezone:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.saveSettings(actor,body)); }
  @Get('branding') branding(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.branding(actor)); }
  @Post('branding/upload-request') brandingUploadRequest(@Body() body:{filename:string;contentType:string;byteSize:number},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.requestBrandingUpload(actor,body)); }
  @Post('branding/complete') completeBrandingUpload(@Body() body:{storageKey:string;contentType:string;byteSize:number},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.completeBrandingUpload(actor,body)); }
  @Get('templates') templates(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.templates(actor)); }
  @Post('templates') saveTemplate(@Body() body:{name:string;body:string},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.saveTemplate(actor,body)); }
  @Get('custom-fields') customFields(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.customFields(actor)); }
  @Post('custom-fields') saveCustomField(@Body() body:{id?:string;fieldKey:string;label:string;fieldType:'TEXT'|'NUMBER'|'DATE'|'SELECT'|'BOOLEAN';options?:string[];isRequired?:boolean;isActive?:boolean;sortOrder?:number},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.saveCustomField(actor,body)); }
  @Get('email-integration') emailIntegration(@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.emailIntegration(actor)); }
  @Post('email-integration') saveEmailIntegration(@Body() body:{inboundAddress:string;senderName:string;enabled:boolean},@Headers('authorization') a?:string,@Headers('x-organization-id') o?:string) { return this.actor(a,o).then(actor=>this.organizations.saveEmailIntegration(actor,body)); }

  @Get('platform/organizations') platformOrganizations(@Headers('authorization') a?:string) { return this.platform(a).then(user=>this.organizations.platformOrganizations(user.sub)); }
  @Post('platform/organizations') createPlatformOrganization(@Body() body:{name:string;slug:string},@Headers('authorization') a?:string) { return this.platform(a).then(user=>this.organizations.createPlatformOrganization(user.sub,body)); }
  @Get('platform/users') platformUsers(@Headers('authorization') a?:string) { return this.platform(a).then(user=>this.organizations.platformUsers(user.sub)); }
  @Post('platform/users') createPlatformUser(@Body() body:{email:string;username?:string;displayName:string;password:string;isPlatformAdmin?:boolean},@Headers('authorization') a?:string) { return this.platform(a).then(user=>this.organizations.createPlatformUser(user.sub,body)); }
  @Post('platform/users/:id') updatePlatformUser(@Param('id') id:string,@Body() body:{displayName?:string;username?:string;isPlatformAdmin?:boolean;isActive?:boolean;password?:string},@Headers('authorization') a?:string) { return this.platform(a).then(user=>this.organizations.updatePlatformUser(user.sub,id,body)); }
  @Post('platform/organizations/:id/status') platformStatus(@Param('id') id:string,@Body() body:{status:'active'|'suspended'},@Headers('authorization') a?:string) { return this.platform(a).then(user=>this.organizations.setOrganizationStatus(user.sub,id,body.status)); }
}
