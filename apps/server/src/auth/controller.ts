import {Controller,Post,Body,UseGuards,Request,Get,HttpCode,HttpStatus,UseFilters,Ip,Headers,} from '@nestjs/common';
import { AuthService } from './service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EnableMfaDto } from './dto/mfa.dto';
import { AuthExceptionFilter } from './filters/error_filtering';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleAuthService } from './google/service';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleAuthService,
  ) {}

  @Public()
  @Post('signin')
  async signin(@Request() req: any, @Body() loginDto: LoginDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Public()
  @Post('signin/mfa')
  async signinMfa(@Body() dto: { email: string; code: string }, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.authService.verifyMfaLogin(dto.email, dto.code, ip, userAgent);
  }

  @Public()
  @Post('signup')
  async signup(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyCode(verifyEmailDto.email, verifyEmailDto.code);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.sendVerificationCode(body.email);
  }

  @Public()
  @Get('mfa/setup')
  async getMfaSetup(@CurrentUser() user: any) {
    return this.authService.generateMfaSecret(user.id);
  }

  @Public()
  @Post('mfa/enable')
  async enableMfa(@CurrentUser() user: any, @Body() dto: EnableMfaDto) {
    return this.authService.enableMfa(user.id, dto.code);
  }

  @Public()
  @Post('mfa/disable')
  async disableMfa(@CurrentUser() user: any, @Body() dto: EnableMfaDto) {
    return this.authService.disableMfa(user.id, dto.code);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.authService.me(user.id);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@CurrentUser() user: any) {
    return this.authService.getUserStatus(user.id, user.exp);
  }

  @Public()
  @Post('refresh')
  async refresh(@CurrentUser() user: any) {
    return this.authService.refreshToken(user.refreshToken);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: any, @Request() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.logout(user.id, token);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@CurrentUser() user: any) {
    return this.googleService.googleLogin(user);
  }
}
