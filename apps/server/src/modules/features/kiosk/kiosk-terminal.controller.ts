import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiResponse } from '@rona/types/api';
import {
  KIOSK_SESSION_COOKIE,
  KIOSK_SESSION_DURATION,
} from '@rona/config/kiosk';
import type {
  KioskAuthenticateInput,
  KioskPunchInput,
  KioskPunchResult,
  KioskSession,
} from '@rona/types/kiosk';
import {
  kioskAuthenticateSchema,
  kioskPunchSchema,
} from '@rona/validation/kiosk';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { KioskService } from './kiosk.service';
import { KioskSessionGuard } from './kiosk-session.guard';

interface KioskRequest extends Request {
  kiosk?: {
    kioskId: string;
    deviceId: string;
    organizationId: string;
  };
}

@Controller('kiosk')
export class KioskTerminalController {
  constructor(private readonly kioskService: KioskService) {}

  @Post('authenticate')
  async authenticate(
    @Body(new ZodValidationPipe(kioskAuthenticateSchema))
    body: KioskAuthenticateInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<KioskSession>> {
    const session = await this.kioskService.authenticateDevice(
      body.deviceToken,
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(KIOSK_SESSION_COOKIE, session.sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: KIOSK_SESSION_DURATION,
      path: '/api/kiosk',
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosk authenticated successfully.',
      data: session,
    };
  }

  @Post('sign-out')
  @UseGuards(KioskSessionGuard)
  signOut(@Res({ passthrough: true }) res: Response): ApiResponse<never> {
    res.clearCookie(KIOSK_SESSION_COOKIE, { path: '/api/kiosk' });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiosk session ended.',
    };
  }

  @Post('attendance')
  @UseGuards(KioskSessionGuard)
  async punch(
    @Req() request: KioskRequest,
    @Body(new ZodValidationPipe(kioskPunchSchema))
    body: KioskPunchInput,
  ): Promise<ApiResponse<KioskPunchResult>> {
    const device = request.kiosk!;
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Attendance event recorded successfully.',
      data: await this.kioskService.punch(device, body),
    };
  }
}
