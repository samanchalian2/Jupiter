import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { AppearanceService } from './appearance.service.js';

@Controller('appearance')
export class AppearanceController {
  constructor(private readonly appearance: AppearanceService, private readonly auth: AuthService) {}
  @Get() current() { return this.appearance.current(); }
  @Post() save(@Body() body: { brandPreset?: string; densityPreset?: string; radiusPreset?: string; logoUrl?: string | null }, @Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return this.auth.verify(token).then(({ sub }) => this.appearance.save(sub, body));
  }
}
