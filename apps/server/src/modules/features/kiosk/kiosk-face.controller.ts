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
import type { KioskFacePunchInput, KioskPunchResult } from '@rona/types/kiosk';
import { FaceService } from '@/modules/features/hr/face.service';
import { KioskSessionGuard } from './kiosk-session.guard';

interface KioskRequest extends Request {
  kiosk?: {
    kioskId: string;
    deviceId: string;
    organizationId: string;
  };
}

@Controller('kiosk/face')
export class KioskFaceController {
  constructor(private readonly faceService: FaceService) {}

  @Post('punch')
  @UseGuards(KioskSessionGuard)
  async punch(
    @Req() request: KioskRequest,
    @Body()
    body: KioskFacePunchInput,
  ): Promise<ApiResponse<KioskPunchResult>> {
    const device = request.kiosk!;
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Attendance event recorded successfully.',
      data: await this.faceService.punchKiosk(device, body),
    };
  }
}
