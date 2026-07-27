import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, UseGuards, UseFilters, Inject, BadRequestException, Param } from '@nestjs/common';
import { AuthService } from './service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto, ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EnableMfaDto, VerifyMfaDto, DisableMfaDto } from './dto/mfa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { AuthExceptionFilter } from './filters/error_filtering';
import { serverConfig } from '@rona/config';
import { randomBytes } from 'crypto';


@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(JwtService) private jwtService: JwtService
  ) {}

  private setTokenCookie(res: any, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(serverConfig.auth.cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: serverConfig.auth.cookieMaxAge,
    });
  }

  private setCsrfCookie(res: any, csrfToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: serverConfig.auth.csrfMaxAge,
    });
  }

  @Public()
  @Get('csrf')
  getCsrfToken(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const existingToken = req.cookies?.csrf_token;
    const csrfToken = existingToken || randomBytes(32).toString('hex');
    this.setCsrfCookie(res, csrfToken);
    return { csrfToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Req() req: any, @Res({ passthrough: true }) res: any, @Body() body: LoginDto) {
    this.validateCsrf(req);
    const result = await this.authService.login(body, req.ip, req.headers['user-agent']);
    if (result.mfa_required) {
      return result;
    }
    if (result.accessToken) {
      this.setTokenCookie(res, result.accessToken);
    }
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signin/mfa')
  async signinMfa(@Req() req: any, @Res({ passthrough: true }) res: any, @Body() body: LoginDto & { code: string }) {
    this.validateCsrf(req);
    if (!body.email) {
      throw new BadRequestException('email needed for mfa login');
    }
    const result = await this.authService.verifyMfaLogin(body.email, body.code, req.ip, req.headers['user-agent']);
    if (result.accessToken) {
      this.setTokenCookie(res, result.accessToken);
    }
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Req() req: any, @Body() body: RegisterDto) {
    this.validateCsrf(req);
    return this.authService.register(body);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('send-verification')
  async sendVerification(@Req() req: any, @Body() body: ResendVerificationDto) {
    this.validateCsrf(req);
    return this.authService.sendVerificationCode(body.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-code')
  async verifyCode(@Req() req: any, @Body() body: VerifyEmailDto) {
    this.validateCsrf(req);
    return this.authService.verifyCode(body.email, body.code);
  }
  private validateCsrf(req: any) {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    const csrfHeader = req.headers['x-csrf-token'];
    const csrfCookie = req.cookies?.csrf_token;
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      throw new BadRequestException('bad csrf token');
    }}
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signout')
  async signout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.cookies?.[serverConfig.auth.cookieName];
    if (token) {
      const decoded = await this.jwtService.decode(token) as any;
      if (decoded?.sub) {
        await this.authService.logout(decoded.sub, token);
      }
    }
    res.clearCookie(serverConfig.auth.cookieName);
    return { success: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Public()
  @Get('status')
  async status(@Req() req: any) {
    const token = req.cookies?.[serverConfig.auth.cookieName];
    if (!token) return null;
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      return this.authService.getUserStatus(decoded.sub, decoded.exp);
    } catch {
      return null;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async user(@CurrentUser() user: any) {
    return this.authService.me(user.id || user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('mfa/setup')
  async setupMfa(@CurrentUser() user: any) {
    const result = await this.authService.generateMfaSecret(user.id || user.sub);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('mfa/enable')
  async enableMfa(@CurrentUser() user: any, @Body() body: EnableMfaDto) {
    const result = await this.authService.enableMfa(user.id || user.sub, body.code);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('mfa/disable')
  async disableMfa(@CurrentUser() user: any, @Body() body: DisableMfaDto) {
    const result = await this.authService.disableMfa(user.id || user.sub, body.code);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Roles('admin', 'owner')
  @Throttle({ roleManagement: { ttl: 60000, limit: 10 } })
  @Get('users')
  async getUsers(@CurrentUser() user: any) {
    return this.authService.getTenantUsers(user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Roles('admin', 'owner')
  @Throttle({ roleManagement: { ttl: 60000, limit: 10 } })
  @Post('users/:id/position')
  async setUserPosition(@CurrentUser() user: any, @Param('id') userId: string, @Body() body: { position: string }) {
    return this.authService.setUserPosition(user.id || user.sub, userId, body.position, user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Roles('admin', 'owner')
  @Throttle({ roleManagement: { ttl: 60000, limit: 10 } })
  @Post('users/:id/tenant-role')
  async setTenantRole(@CurrentUser() user: any, @Param('id') userId: string, @Body() body: { role: string }) {
    return this.authService.setTenantRole(user.id || user.sub, userId, body.role, user.tenantId);
  }
}