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
import { AuthService } from '../service/auth.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
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

// ROUTE: api/auth
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
          statusCode: 201,
          data: { tfaEnabled: true },
        };
      } else {
        await this.authService.verifyCode(user.email, body.code);
      }
    }

    const token = this.authService.createSession(user);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: COOKIE_MAX_AGE,
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Signed in successfully',
    };
  }

  @Post('register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterSchema): Promise<ApiResponse<never>> {
    await this.authService.registerUser(body);

    return {
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
    };
  }

  @Post('sign-out')
  @UseGuards(AuthGuard)
  signOut(@Res({ passthrough: true }) res: Response): ApiResponse<never> {
    res.clearCookie(COOKIE_NAME);

    return {
      success: true,
      statusCode: 200,
      message: 'Signed out successfully',
    };
  }

  @Get('session')
  @UseGuards(AuthGuard)
  getSession(@Req() req: Request & { session: Session }): ApiResponse<Session> {
    return {
      success: true,
      message: 'Session active',
      data: req.session,
      statusCode: 200,
    };
  }

  @Get('google/url')
  getGoogleUrl(): ApiResponse<string> {
    const url = this.authService.getGoogleAuthUrl();
    return {
      success: true,
      statusCode: 201,
      message: 'URL generated',
      data: url,
    };
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
      if (e instanceof Error && e.message) {
        res.redirect(
          `${clientUrl}${CLIENT_ERROR_PAGE}?message=${encodeURIComponent(e.message)}`,
        );
      } else {
        res.redirect(`${clientUrl}${CLIENT_ERROR_PAGE}`);
      }
    }
  }
}
