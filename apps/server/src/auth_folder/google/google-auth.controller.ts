import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, Inject } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { Public } from '../decorators/public.decorator';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    @Inject(GoogleAuthService) private googleAuthService: GoogleAuthService
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

      res.redirect(`${frontendUrl}/login?token=${result.accessToken}`);
    } catch (err: any) {
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
}
