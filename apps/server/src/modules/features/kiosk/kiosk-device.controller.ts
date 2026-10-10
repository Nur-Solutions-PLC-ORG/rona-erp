import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import { KIOSK_ENROLL_TOKEN_HEADER } from '@rona/config/kiosk';
import type {
  KioskAdminPinVerifyInput,
  KioskAdminPinVerifyResult,
  KioskCardBindInput,
  KioskCardBindResult,
  KioskCardSyncResult,
  KioskDevicePunchBatchInput,
  KioskDevicePunchBatchResult,
  KioskDevicePunchInput,
  KioskDevicePunchResult,
  KioskDeviceRegisterInput,
  KioskDeviceSession,
  KioskDeviceSessionInput,
  KioskDeviceSyncSearchParams,
  KioskEmployeeStatus,
  KioskEnrollAuthorizeInput,
  KioskEnrollAuthorizeResult,
  KioskHeartbeatInput,
  KioskHeartbeatResult,
  KioskRosterResult,
  KioskTemplateEnrollInput,
  KioskTemplateEnrollResult,
  KioskTemplateSyncResult,
} from '@rona/types/kiosk';
import {
  kioskAdminPinVerifySchema,
  kioskCardBindSchema,
  kioskDevicePunchBatchSchema,
  kioskDevicePunchSchema,
  kioskDeviceRegisterSchema,
  kioskDeviceSessionSchema,
  kioskDeviceSyncSearchParamsSchema,
  kioskEnrollAuthorizeSchema,
  kioskHeartbeatSchema,
  kioskTemplateEnrollSchema,
} from '@rona/validation/kiosk';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { KioskAuthenticationException } from './kiosk.exception';
import { KioskCredentialsService } from './kiosk-credentials.service';
import {
  KioskDeviceGuard,
  KioskDeviceSignatureGuard,
  type KioskDeviceRequest,
} from './kiosk-device.guard';
import { KioskDeviceService } from './kiosk-device.service';

// Native kiosk terminal API (Rona Kiosk app). See packages/routes API_KIOSK_DEVICE_*.
@Controller('kiosk/device')
export class KioskDeviceController {
  constructor(
    private readonly deviceService: KioskDeviceService,
    private readonly credentialsService: KioskCredentialsService,
  ) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(kioskDeviceRegisterSchema))
    body: KioskDeviceRegisterInput,
  ): Promise<ApiResponse<KioskDeviceSession>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Terminal paired successfully.',
      data: await this.deviceService.register(body),
    };
  }

  @Post('session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(KioskDeviceSignatureGuard)
  async session(
    @Req() request: KioskDeviceRequest,
    @Body(new ZodValidationPipe(kioskDeviceSessionSchema))
    body: KioskDeviceSessionInput,
  ): Promise<ApiResponse<KioskDeviceSession>> {
    if (body.kioskId !== request.kiosk!.kioskId) {
      throw new KioskAuthenticationException();
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Terminal session renewed.',
      data: await this.deviceService.refreshSession(body.kioskId),
    };
  }

  @Get('roster')
  @UseGuards(KioskDeviceGuard)
  async roster(
    @Query(new ZodValidationPipe(kioskDeviceSyncSearchParamsSchema))
    query: KioskDeviceSyncSearchParams,
  ): Promise<ApiResponse<KioskRosterResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Roster retrieved successfully.',
      data: await this.deviceService.roster(query.since),
    };
  }

  @Get('templates')
  @UseGuards(KioskDeviceGuard)
  async templates(
    @Query(new ZodValidationPipe(kioskDeviceSyncSearchParamsSchema))
    query: KioskDeviceSyncSearchParams,
  ): Promise<ApiResponse<KioskTemplateSyncResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Templates retrieved successfully.',
      data: await this.credentialsService.syncTemplates(query.since),
    };
  }

  @Post('templates')
  @UseGuards(KioskDeviceGuard)
  async enrollTemplate(
    @Req() request: KioskDeviceRequest,
    @Headers(KIOSK_ENROLL_TOKEN_HEADER) enrollToken: string | undefined,
    @Body(new ZodValidationPipe(kioskTemplateEnrollSchema))
    body: KioskTemplateEnrollInput,
  ): Promise<ApiResponse<KioskTemplateEnrollResult>> {
    const device = request.kiosk!;
    const actor = this.deviceService.verifyEnrollToken(device, enrollToken);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Template enrolled successfully.',
      data: {
        template: await this.credentialsService.enrollTemplate(
          device.organizationId,
          actor,
          body,
        ),
      },
    };
  }

  @Delete('templates/:id')
  @UseGuards(KioskDeviceGuard)
  async revokeTemplate(
    @Req() request: KioskDeviceRequest,
    @Headers(KIOSK_ENROLL_TOKEN_HEADER) enrollToken: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<KioskTemplateEnrollResult>> {
    const device = request.kiosk!;
    const actor = this.deviceService.verifyEnrollToken(device, enrollToken);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Template revoked successfully.',
      data: {
        template: await this.credentialsService.revokeTemplateFromKiosk(
          device.organizationId,
          actor,
          id,
        ),
      },
    };
  }

  @Get('cards')
  @UseGuards(KioskDeviceGuard)
  async cards(
    @Query(new ZodValidationPipe(kioskDeviceSyncSearchParamsSchema))
    query: KioskDeviceSyncSearchParams,
  ): Promise<ApiResponse<KioskCardSyncResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Cards retrieved successfully.',
      data: await this.credentialsService.syncCards(query.since),
    };
  }

  @Post('cards')
  @UseGuards(KioskDeviceGuard)
  async bindCard(
    @Req() request: KioskDeviceRequest,
    @Headers(KIOSK_ENROLL_TOKEN_HEADER) enrollToken: string | undefined,
    @Body(new ZodValidationPipe(kioskCardBindSchema))
    body: KioskCardBindInput,
  ): Promise<ApiResponse<KioskCardBindResult>> {
    const device = request.kiosk!;
    const actor = this.deviceService.verifyEnrollToken(device, enrollToken);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Card assigned successfully.',
      data: {
        card: await this.credentialsService.bindCard(
          device.organizationId,
          actor,
          body,
        ),
      },
    };
  }

  @Get('employees/:employeeId/status')
  @UseGuards(KioskDeviceGuard)
  async employeeStatus(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ): Promise<ApiResponse<KioskEmployeeStatus>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance status retrieved successfully.',
      data: await this.deviceService.employeeStatus(employeeId),
    };
  }

  @Post('punch')
  @UseGuards(KioskDeviceGuard)
  async punch(
    @Req() request: KioskDeviceRequest,
    @Body(new ZodValidationPipe(kioskDevicePunchSchema))
    body: KioskDevicePunchInput,
  ): Promise<ApiResponse<KioskDevicePunchResult>> {
    const result = await this.deviceService.punch(request.kiosk!, body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: result.duplicate
        ? 'Attendance event was already recorded.'
        : 'Attendance event recorded successfully.',
      data: result,
    };
  }

  @Post('punch/batch')
  @HttpCode(HttpStatus.OK)
  @UseGuards(KioskDeviceGuard)
  async punchBatch(
    @Req() request: KioskDeviceRequest,
    @Body(new ZodValidationPipe(kioskDevicePunchBatchSchema))
    body: KioskDevicePunchBatchInput,
  ): Promise<ApiResponse<KioskDevicePunchBatchResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance events processed.',
      data: await this.deviceService.punchBatch(request.kiosk!, body.events),
    };
  }

  @Post('enroll/authorize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(KioskDeviceGuard)
  async authorizeEnrollment(
    @Req() request: KioskDeviceRequest,
    @Body(new ZodValidationPipe(kioskEnrollAuthorizeSchema))
    body: KioskEnrollAuthorizeInput,
  ): Promise<ApiResponse<KioskEnrollAuthorizeResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Enrollment session started.',
      data: await this.deviceService.authorizeEnrollment(
        request.kiosk!,
        body.code,
      ),
    };
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(KioskDeviceGuard)
  async heartbeat(
    @Req() request: KioskDeviceRequest,
    @Body(new ZodValidationPipe(kioskHeartbeatSchema))
    body: KioskHeartbeatInput,
  ): Promise<ApiResponse<KioskHeartbeatResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Heartbeat received.',
      data: await this.deviceService.heartbeat(request.kiosk!, body),
    };
  }

  @Post('admin/verify-pin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(KioskDeviceGuard)
  async verifyAdminPin(
    @Req() request: KioskDeviceRequest,
    @Body(new ZodValidationPipe(kioskAdminPinVerifySchema))
    body: KioskAdminPinVerifyInput,
  ): Promise<ApiResponse<KioskAdminPinVerifyResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Admin PIN verified.',
      data: await this.deviceService.verifyAdminPin(request.kiosk!, body.pin),
    };
  }
}
