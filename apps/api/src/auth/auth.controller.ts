import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') login(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password) throw new UnauthorizedException('Email and password are required');
    return this.auth.login(body.email, body.password);
  }
  @Get('me') async me(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    const payload = await this.auth['jwt'].verifyAsync<{sub:string}>(token).catch(() => { throw new UnauthorizedException(); });
    return this.auth.profile(payload.sub);
  }
}
