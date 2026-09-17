import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiResponse } from '@rona/types/api';
import type {
  KioskFaceDescriptorsResult,
  KioskFacePunchInput,
  KioskPunchResult,
} from '@rona/types/kiosk';
import { kioskFacePunchSchema } from '@rona/validation/kiosk';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
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

  @Get('descriptors')
  @UseGuards(KioskSessionGuard)
  async descriptors(
    @Req() request: KioskRequest,
  ): Promise<ApiResponse<KioskFaceDescriptorsResult>> {
    const device = request.kiosk!;
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Face descriptors retrieved successfully.',
      data: await this.faceService.listKioskDescriptors(
        device.organizationId,
      ),
    };
  }

  @Post('punch')
  @UseGuards(KioskSessionGuard)
  async punch(
    @Req() request: KioskRequest,
    @Body(new ZodValidationPipe(kioskFacePunchSchema))
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