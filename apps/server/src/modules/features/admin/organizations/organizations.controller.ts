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
  OrganizationDto,
  OrganizationListSearchParamsSchema,
  OrganizationSchema,
  OrganizationUpdateSchema,
} from '@rona/types/admin';
import {
  organizationListSearchParamsSchema,
  organizationSchema,
  organizationUpdateSchema,
} from '@rona/validation/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { OrganizationsService } from './organizations.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async listOrganizations(
    @Query(new ZodValidationPipe(organizationListSearchParamsSchema))
    query: OrganizationListSearchParamsSchema,
  ): Promise<ApiResponse<OrganizationDto[]>> {
    const { organizations, meta } =
      await this.organizationsService.listOrganizations(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organizations retrieved successfully.',
      data: organizations,
      meta,
    };
  }

  @Post()
  async createOrganization(
    @Body(new ZodValidationPipe(organizationSchema)) body: OrganizationSchema,
  ): Promise<ApiResponse<OrganizationDto>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Organization created successfully.',
      data: await this.organizationsService.createOrganization(body),
    };
  }

  @Get(':id')
  async getOrganization(
    @Param('id') id: string,
  ): Promise<ApiResponse<OrganizationDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization retrieved successfully.',
      data: await this.organizationsService.getOrganization(id),
    };
  }

  @Patch(':id')
  async updateOrganization(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(organizationUpdateSchema))
    body: OrganizationUpdateSchema,
  ): Promise<ApiResponse<OrganizationDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization updated successfully.',
      data: await this.organizationsService.updateOrganization(id, body),
    };
  }

  @Delete(':id')
  async deleteOrganization(
    @Param('id') id: string,
  ): Promise<ApiResponse<never>> {
    await this.organizationsService.deleteOrganization(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization deleted successfully.',
    };
  }
}
