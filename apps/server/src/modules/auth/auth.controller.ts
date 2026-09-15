import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { Roles } from './guards/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';

import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { loadEnv } from '@/configs/env';
import { COOKIE_NAME, SESSION_DURATION } from '@rona/config/auth';
import {
  ForgotPasswordSchema,
  RegisterSchema,
  ResendVerificationCodeSchema,
  ResetPasswordSchema,
  SignInSchema,
} from '@rona/types/auth';
import type { ChangePasswordSchema } from '@rona/types/auth';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  registerSchema,
  resendVerificationCodeSchema,
  resetPasswordSchema,
  signInSchema,
} from '@rona/validation/auth';

import { CLIENT_APP_ERROR_PAGE } from '@rona/routes/app';
import { CLIENT_AUTH_GOOGLE_CALLBACK_PAGE } from '@rona/routes/auth';
import { ApiResponse } from '@rona/types/api';
import { Session, SignInResponseData } from '@rona/types/auth';

@Controller('auth')
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

    if (user.mustChangePassword) {
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Please set a new password to continue.',
        data: { tfaEnabled: false, mustChangePassword: true },
      };
    }

    if (user.tfaEnabled) {
      if (!body.code) {
        await this.authService.sendVerificationCode(body.email);

        return {
          success: true,
          message: 'Please enter the verification code to continue.',
          statusCode: HttpStatus.OK,
          data: { tfaEnabled: true },
        };
      }

      await this.authService.verifyCode(user.email, body.code);
    }

    const token = this.authService.createSession({
      id: user.id,
      email: user.email,
      name: user.fullName,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: SESSION_DURATION,
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'You have signed in successfully.',
      data: { tfaEnabled: false, mustChangePassword: false },
    };
  }

  @Post('resend-verification-code')
  @UsePipes(new ZodValidationPipe(resendVerificationCodeSchema))
  async resendVerificationCode(
    @Body() body: ResendVerificationCodeSchema,
  ): Promise<ApiResponse<never>> {
    await this.authService.resendVerificationCode(body.email);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'A verification code has been sent successfully.',
    };
  }

  @Post('register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('super_admin')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterSchema): Promise<ApiResponse<never>> {
    await this.authService.registerUser(body);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'The user has been registered successfully.',
    };
  }

  @Post('sign-out')
  @UseGuards(AuthGuard)
  signOut(@Res({ passthrough: true }) res: Response): ApiResponse<never> {
    res.clearCookie(COOKIE_NAME);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'You have signed out successfully.',
    };
  }

  @Get('session')
  @UseGuards(AuthGuard)
  getSession(@Req() req: Request & { session: Session }): ApiResponse<Session> {
    return {
      success: true,
      message: 'The session is active.',
      data: req.session,
      statusCode: HttpStatus.OK,
    };
  }

  @Get('google/url')
  getGoogleUrl(@Query('redirect') redirect?: string): ApiResponse<string> {
    const url = this.authService.getGoogleAuthUrl(redirect);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'The Google authentication URL has been generated successfully.',
      data: url,
    };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const clientUrl = loadEnv().CLIENT_URL[0];
    try {
      if (!code) throw new Error('No code provided');
      const { token } = await this.authService.handleGoogleCallback(code);

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: SESSION_DURATION,
      });

      const redirectQuery = state
        ? `?redirect=${encodeURIComponent(state)}`
        : '';
      res.redirect(
        `${clientUrl}${CLIENT_AUTH_GOOGLE_CALLBACK_PAGE}${redirectQuery}`,
      );
    } catch (e: any) {
      if (e instanceof Error && e.message) {
        res.redirect(
          `${clientUrl}${CLIENT_APP_ERROR_PAGE}?message=${encodeURIComponent(e.message)}`,
        );
      } else {
        res.redirect(`${clientUrl}${CLIENT_APP_ERROR_PAGE}`);
      }
    }
  }

  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(
    @Body() body: ForgotPasswordSchema,
  ): Promise<ApiResponse<ForgotPasswordSchema>> {
    await this.authService.forgotPassword(body.email);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message:
        'If an account exists, a reset code has been sent to your email.',
    };
  }
  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(
    @Body() body: ResetPasswordSchema,
  ): Promise<ApiResponse<ResetPasswordSchema>> {
    await this.authService.resetPassword(body.email, body.token, body.password);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Your password has been reset successfully.',
    };
  }

  @Post('change-password')
  @UsePipes(new ZodValidationPipe(changePasswordSchema))
  async changePassword(
    @Body() body: ChangePasswordSchema,
  ): Promise<ApiResponse<never>> {
    await this.authService.changePassword(
      body.email,
      body.currentPassword,
      body.newPassword,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message:
        'Your password has been set. Please sign in with your new password.',
    };
  }
}
