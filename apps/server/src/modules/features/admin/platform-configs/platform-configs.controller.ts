import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  PlatformConfigDto,
  PlatformConfigKey,
  PlatformConfigSchema,
} from '@rona/types/admin';
import { platformConfigSchema } from '@rona/validation/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { PlatformConfigsService } from './platform-configs.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class PlatformConfigsController {
  constructor(private readonly service: PlatformConfigsService) {}

  @Get()
  async list(): Promise<ApiResponse<PlatformConfigDto[]>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Platform configurations retrieved successfully.',
      data: await this.service.list(),
    };
  }

  @Post()
  async reset(): Promise<ApiResponse<PlatformConfigDto[]>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Platform configurations reset successfully.',
      data: await this.service.reset(),
    };
  }

  @Get(':key')
  async get(
    @Param('key') key: PlatformConfigKey,
  ): Promise<ApiResponse<PlatformConfigDto | undefined>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Platform configuration retrieved successfully.',
      data: await this.service.get(key),
    };
  }

  @Patch(':key')
  @Put(':key')
  async update(
    @Param('key') key: PlatformConfigKey,
    @Body(new ZodValidationPipe(platformConfigSchema.partial()))
    body: Partial<PlatformConfigSchema>,
  ): Promise<ApiResponse<PlatformConfigDto | undefined>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Platform configuration updated successfully.',
      data: await this.service.update(key, body),
    };
  }
}
