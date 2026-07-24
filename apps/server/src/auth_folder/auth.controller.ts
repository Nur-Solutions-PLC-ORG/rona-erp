import { Controller, Post, Body, Get, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return { authenticated: false };
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return { authenticated: true, user: payload };
    } catch {
      return { authenticated: false };
    }
  }

  @Get('user')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }
}