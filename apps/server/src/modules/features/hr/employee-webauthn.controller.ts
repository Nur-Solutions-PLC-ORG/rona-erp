import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type { WebAuthnRegistrationVerifyInput } from '@rona/types/hr';
import { webauthnRegistrationVerifySchema } from '@rona/validation/hr';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import type {
  WebAuthnRegisteredCredential,
  WebAuthnRegistrationChallengeResult,
} from '../kiosk/webauthn.service';
import { EmployeeWebAuthnService } from './employee-webauthn.service';

@Controller('employees/:id/webauthn')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
@RequirePermissions('hr.webauthn.enroll')
export class EmployeeWebAuthnController {
  constructor(
    private readonly employeeWebAuthnService: EmployeeWebAuthnService,
  ) {}

  @Post('register/options')
  async createRegistrationOptions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<WebAuthnRegistrationChallengeResult>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'WebAuthn registration options generated.',
      data: await this.employeeWebAuthnService.createRegistrationOptions(id),
    };
  }

  @Post('register/verify')
  @HttpCode(HttpStatus.OK)
  async verifyRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(webauthnRegistrationVerifySchema))
    body: WebAuthnRegistrationVerifyInput,
  ): Promise<ApiResponse<WebAuthnRegisteredCredential>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fingerprint credential enrolled successfully.',
      data: await this.employeeWebAuthnService.verifyRegistration(id, body),
    };
  }
}
