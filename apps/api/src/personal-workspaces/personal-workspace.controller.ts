import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { PersonalWorkspaceService } from './personal-workspace.service.js';

@Controller('personal/workspace')
export class PersonalWorkspaceController {
  constructor(private readonly auth: AuthService, private readonly workspaces: PersonalWorkspaceService) {}

  @Get()
  async current(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    const actor = await this.auth.verify(token).catch(() => { throw new UnauthorizedException(); });
    return this.workspaces.requireForVerifiedUser(actor.sub);
  }
}
