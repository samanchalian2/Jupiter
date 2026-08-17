import { Body, Controller, Get, Headers, Post, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

type CookieResponse = {
  cookie(name: string, value: string, options: { httpOnly: boolean; sameSite: 'strict'; secure: boolean; path: string; maxAge: number }): void;
  clearCookie(name: string, options: { httpOnly: boolean; sameSite: 'strict'; secure: boolean; path: string; maxAge: number }): void;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: { identifier?: string; email?: string; password?: string }, @Res({ passthrough: true }) response: CookieResponse) {
    const identifier = body.identifier ?? body.email;
    if (!identifier || !body.password) throw new UnauthorizedException('Invalid credentials');
    const result = await this.auth.login(identifier, body.password);
    this.writeRefreshCookie(response, result.refreshToken);
    return this.publicSession(result);
  }

  @Post('refresh')
  async refresh(@Headers('cookie') cookie: string | undefined, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.auth.refresh(this.readCookie(cookie, 'jupiter_refresh')!);
    this.writeRefreshCookie(response, result.refreshToken);
    return this.publicSession(result);
  }

  @Post('logout')
  async logout(@Headers('cookie') cookie: string | undefined, @Res({ passthrough: true }) response: CookieResponse) {
    await this.auth.logout(this.readCookie(cookie, 'jupiter_refresh', false));
    response.clearCookie('jupiter_refresh', this.cookieOptions());
    return { ok: true };
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    const payload = await this.auth.verify(token).catch(() => { throw new UnauthorizedException(); });
    return this.auth.profile(payload.sub);
  }

  @Post('profile')
  async updateProfile(@Body() body: { displayName?: string; currentPassword?: string; nextPassword?: string }, @Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    const payload = await this.auth.verify(token).catch(() => { throw new UnauthorizedException(); });
    return this.auth.updateProfile(payload.sub, body);
  }

  private publicSession(result: Awaited<ReturnType<AuthService['login']>>) { return { accessToken: result.accessToken, user: result.user }; }
  private readCookie(raw: string | undefined, name: string, required = true) {
    const value = raw?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
    if (!value && required) throw new UnauthorizedException('Session expired. Please sign in again.');
    return value;
  }
  private cookieOptions() { return { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 }; }
  private writeRefreshCookie(response: CookieResponse, token: string) { response.cookie('jupiter_refresh', token, this.cookieOptions()); }
}
