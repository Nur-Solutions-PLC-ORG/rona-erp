import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiResponse } from '@rona/types/api';
import type {
  KioskWebAuthnVerifyInput,
  KioskWebAuthnVerifyResult,
} from '@rona/types/kiosk';
import { kioskWebAuthnAuthVerifySchema } from '@rona/validation/kiosk';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { KioskSessionGuard } from './kiosk-session.guard';
import { KioskWebAuthnService } from './kiosk-webauthn.service';
import type { WebAuthnAuthenticationChallengeResult } from './webauthn.service';

interface KioskRequest extends Request {
  kiosk?: {
    kioskId: string;
    deviceId: string;
    organizationId: string;
  };
}

@Controller('kiosk/webauthn')
export class KioskWebAuthnController {
  constructor(private readonly kioskWebAuthnService: KioskWebAuthnService) {}

  @Post('auth/options')
  @UseGuards(KioskSessionGuard)
  async authOptions(
    @Req() request: KioskRequest,
  ): Promise<ApiResponse<WebAuthnAuthenticationChallengeResult>> {
    const device = request.kiosk!;
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'WebAuthn authentication options generated.',
      data: await this.kioskWebAuthnService.createAuthOptions(device),
    };
  }

  @Post('auth/verify')
  @UseGuards(KioskSessionGuard)
  async authVerify(
    @Req() request: KioskRequest,
    @Body(new ZodValidationPipe(kioskWebAuthnAuthVerifySchema))
    body: KioskWebAuthnVerifyInput,
  ): Promise<ApiResponse<KioskWebAuthnVerifyResult>> {
    const device = request.kiosk!;
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Attendance event recorded successfully.',
      data: await this.kioskWebAuthnService.verifyAuthAndPunch(device, body),
    };
  }
}
