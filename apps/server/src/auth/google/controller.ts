import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, Inject, BadRequestException, Logger } from '@nestjs/common';
import { GoogleAuthService } from './service';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { Public } from '../decorators/public.decorator';
import { AuthService } from '../service';
import { Response } from 'express';
import { serverConfig } from '@rona/config';
@Controller('auth/google')
export class GoogleAuthController {
  private readonly logger = new Logger(GoogleAuthController.name);
  constructor(
    @Inject(GoogleAuthService) private googleAuthService: GoogleAuthService,
    @Inject(AuthService) private authService: AuthService
  ) {}
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async googleTokenLogin(@Body() body: GoogleLoginDto) {
    this.logger.log('google token login try');
    const googleUser = await this.googleAuthService.verifyGoogleToken(body.idToken);
    const result = await this.googleAuthService.googleLogin(googleUser);
    this.logger.log(`google token login worked for ${result.user.email}`);
    return result;
  }
  @Public()
  @Get('url')
  googleAuthRedirect(@Req() req: any, @Res() res: any) {
    this.logger.log('google auth redirect');
    const url = this.googleAuthService.getGoogleAuthUrl();
    res.redirect(url);
  }
  @Public()
  @Get('callback')
  async googleAuthCallback(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const frontendUrl = process.env.FRONTEND_URL || '';
    if (!code) {
      this.logger.warn('google callback missing code');
      res.redirect(`${frontendUrl}/login?error=no_code`);
      return;
    }
    if (!state) {
      this.logger.warn('google callback missing state');
      res.redirect(`${frontendUrl}/login?error=invalid_state`);
      return;
    }
    try {
      this.logger.log('processing google callback');
      const tokens = await this.googleAuthService.getTokensFromCode(code);
      const googleUser = await this.googleAuthService.verifyGoogleToken(tokens.id_token!);
      const result = await this.googleAuthService.googleLogin(googleUser);
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(serverConfig.auth.cookieName, result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: serverConfig.auth.cookieMaxAge,
      });
      this.logger.log(`google callback worked for ${result.user.email}`);
      res.redirect(`${frontendUrl}/login?success=true`);
    } catch (err: any) {
      this.logger.error(`google callback failed: ${err.message}`, err.stack);
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
}
