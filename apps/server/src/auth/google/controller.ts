import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, Inject } from '@nestjs/common';
import { GoogleAuthService } from './service';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { Public } from '../decorators/public.decorator';
import { AuthService } from '../service';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    @Inject(GoogleAuthService) private googleAuthService: GoogleAuthService,
    @Inject(AuthService) private authService: AuthService
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async googleTokenLogin(@Body() body: GoogleLoginDto) {
    const googleUser = await this.googleAuthService.verifyGoogleToken(body.idToken);
    return this.googleAuthService.googleLogin(googleUser);
  }

  @Public()
  @Get('url')
  googleAuthRedirect(@Res() res: any) {
    const url = this.googleAuthService.getGoogleAuthUrl();
    res.redirect(url);
  }

  @Public()
  @Get('callback')
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    const code = req.query.code as string;
    const frontendUrl = process.env.FRONTEND_URL || '';

    if (!code) {
      res.redirect(`${frontendUrl}/login?error=no_code`);
      return;
    }
    
    try {
      const tokens = await this.googleAuthService.getTokensFromCode(code);
      const googleUser = await this.googleAuthService.verifyGoogleToken(tokens.id_token!);
      const result = await this.googleAuthService.googleLogin(googleUser);

      const refreshToken = await this.authService.generateRefreshToken(result.user.id, '');

      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.redirect(`${frontendUrl}/login`);
    } catch (err: any) {
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
}
