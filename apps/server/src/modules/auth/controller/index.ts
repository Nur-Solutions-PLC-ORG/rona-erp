import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  UsePipes,
  Query,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from '../service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { ZodValidationPipe } from '../../app/pipes/zod-validation.pipe';
import { signInSchema, registerSchema } from '@rona/validation/auth';
import { SignInSchema, RegisterSchema } from '@rona/types/auth';
import { COOKIE_NAME, COOKIE_MAX_AGE } from '@rona/config/auth';
import { ApiResponse } from '@rona/types/api';
import { Session, SignInResponseData } from '@rona/types/auth';
import {
  CLIENT_AUTH_GOOGLE_CALLBACK_PAGE,
  CLIENT_ERROR_PAGE,
} from '@rona/routes/auth';
import { DEFAULT_CLIENT_URL } from '@rona/config/client';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @UsePipes(new ZodValidationPipe(signInSchema))
  async signIn(
    @Body() body: SignInSchema,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<SignInResponseData | undefined>> {
    const user = await this.authService.validateCredentials(
      body.email,
      body.password,
    );

    if (user.tfaEnabled) {
      if (!body.code) {
        await this.authService.sendVerificationCode(user.email);
        return {
          success: true,
          message: 'Verification code sent',
          data: { tfaEnabled: true },
        };
      } else {
        await this.authService.verifyCode(user.email, body.code);
      }
    }

    const token = await this.authService.createSession(user);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: COOKIE_MAX_AGE,
    });

    return {
      success: true,
      message: 'Signed in successfully',
      data: { tfaEnabled: user.tfaEnabled },
    };
  }

  @Post('register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterSchema): Promise<ApiResponse<void>> {
    await this.authService.registerUser(body);
    return { success: true, message: 'User registered successfully' };
  }

  @Post('sign-out')
  async signOut(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<void>> {
    res.clearCookie(COOKIE_NAME);
    return { success: true, message: 'Signed out successfully' };
  }

  @Get('session')
  @UseGuards(AuthGuard)
  async getSession(
    @Req() req: Request & { session: Session },
  ): Promise<ApiResponse<Session>> {
    return { success: true, message: 'Session active', data: req.session };
  }

  @Get('google/url')
  getGoogleUrl(): ApiResponse<string> {
    const url = this.authService.getGoogleAuthUrl();
    return { success: true, message: 'URL generated', data: url };
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
    try {
      if (!code) throw new Error('No code provided');
      const { token } = await this.authService.handleGoogleCallback(code);

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: COOKIE_MAX_AGE,
      });

      res.redirect(`${clientUrl}${CLIENT_AUTH_GOOGLE_CALLBACK_PAGE}`);
    } catch (e: any) {
      res.redirect(
        `${clientUrl}${CLIENT_ERROR_PAGE}?message=${encodeURIComponent(e.message || 'Google Auth Failed')}`,
      );
    }
  }
}
