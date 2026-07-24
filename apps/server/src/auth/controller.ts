import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, UseGuards, UseFilters, Inject } from '@nestjs/common';
import { AuthService } from './service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthExceptionFilter } from './filters/auth-exception.filter';
import { serverConfig } from '@rona/config';
@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(JwtService) private jwtService: JwtService
  ) {}
  private setTokenCookie(res: any, token: string) {
    res.cookie(serverConfig.auth.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: serverConfig.auth.cookieMaxAge,
    });
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Req() req: any, @Res({ passthrough: true }) res: any, @Body() body: LoginDto) {
    const result = await this.authService.login(body, req.ip, req.headers['user-agent']);
    if (result.mfa_required) {
      return result;}
    if (result.accessToken) {
      this.setTokenCookie(res, result.accessToken);
    }
    return { user: result.user, accessToken: result.accessToken };
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signout')
  async signout(@Res({ passthrough: true }) res: any) {
    res.clearCookie(serverConfig.auth.cookieName);
    return { success: true };}
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('send-verification')
  async sendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.sendVerificationCode(body.email);
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-code')
  async verifyCode(@Body() body: VerifyEmailDto) {
    return this.authService.verifyCode(body.email, body.code);
  }
  @Public()
  @Get('status')
  async status(@Req() req: any) {
    const token = req.cookies?.[serverConfig.auth.cookieName] || req.headers.authorization?.split(' ')[1];
    if (!token) return { session: null };
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      return this.authService.getUserStatus(decoded.sub, decoded.exp);
    } catch {
      return { session: null };
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('user')
  async user(@CurrentUser() user: any) {
    return this.authService.me(user.id || user.sub);
  }
}
