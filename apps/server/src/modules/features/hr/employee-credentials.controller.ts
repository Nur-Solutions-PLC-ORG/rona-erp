import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type { EmployeePasscodeUpdateInput } from '@rona/types/hr';
import type {
  EmployeeBiometricTemplate,
  EmployeeCard,
  EmployeeCredentialsResult,
} from '@rona/types/kiosk';
import { employeePasscodeUpdateSchema } from '@rona/validation/hr';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { KioskCredentialsService } from '@/modules/features/kiosk/kiosk-credentials.service';
import { EmployeesService } from './employees.service';

// Kiosk credentials of an employee: biometric templates, cards, passcode.
@Controller('employees')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class EmployeeCredentialsController {
  constructor(
    private readonly credentialsService: KioskCredentialsService,
    private readonly employeesService: EmployeesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(':id/credentials')
  @RequirePermissions('hr.credential.read')
  async listCredentials(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<EmployeeCredentialsResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee credentials retrieved successfully.',
      data: await this.credentialsService.listEmployeeCredentials(id),
    };
  }

  @Delete(':id/credentials/templates/:templateId')
  @RequirePermissions('hr.credential.revoke')
  async revokeTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ): Promise<ApiResponse<EmployeeBiometricTemplate>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Biometric template revoked successfully.',
      data: await this.credentialsService.revokeEmployeeTemplate(
        this.tenantContext.organizationId,
        id,
        templateId,
      ),
    };
  }

  @Delete(':id/credentials/cards/:cardId')
  @RequirePermissions('hr.credential.revoke')
  async revokeCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<ApiResponse<EmployeeCard>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Card revoked successfully.',
      data: await this.credentialsService.revokeEmployeeCard(
        this.tenantContext.organizationId,
        id,
        cardId,
      ),
    };
  }

  @Patch(':id/passcode')
  @RequirePermissions('hr.employee.update')
  async setPasscode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(employeePasscodeUpdateSchema))
    body: EmployeePasscodeUpdateInput,
  ): Promise<ApiResponse<{ hasPasscode: boolean }>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Employee passcode updated successfully.',
      data: await this.employeesService.setPasscode(id, body.passcode),
    };
  }
}
