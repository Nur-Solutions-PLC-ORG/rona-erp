import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  OrganizationSettingsDto,
  OrganizationSettingsListSearchParamsSchema,
  OrganizationSettingsSchema,
  OrganizationSettingsUpdateSchema,
} from '@rona/types/admin';
import {
  organizationSettingsListSearchParamsSchema,
  organizationSettingsSchema,
  organizationSettingsUpdateSchema,
} from '@rona/validation/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { OrganizationSettingsService } from './organization-settings.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class OrganizationSettingsController {
  constructor(private readonly service: OrganizationSettingsService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(organizationSettingsListSearchParamsSchema))
    query: OrganizationSettingsListSearchParamsSchema,
  ): Promise<ApiResponse<OrganizationSettingsDto[]>> {
    const { settings, meta } =
      await this.service.listOrganizationSettings(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization settings retrieved successfully.',
      data: settings,
      meta,
    };
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(organizationSettingsSchema))
    body: OrganizationSettingsSchema,
  ): Promise<ApiResponse<OrganizationSettingsDto>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Organization settings created successfully.',
      data: await this.service.createOrganizationSettings(body),
    };
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
  ): Promise<ApiResponse<OrganizationSettingsDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization settings retrieved successfully.',
      data: await this.service.getOrganizationSettings(id),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(organizationSettingsUpdateSchema))
    body: OrganizationSettingsUpdateSchema,
  ): Promise<ApiResponse<OrganizationSettingsDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization settings updated successfully.',
      data: await this.service.updateOrganizationSettings(id, body),
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ApiResponse<never>> {
    await this.service.deleteOrganizationSettings(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization settings deleted successfully.',
    };
  }
}
