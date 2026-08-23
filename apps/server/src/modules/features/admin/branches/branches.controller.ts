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
  BranchDto,
  BranchListSearchParamsSchema,
  BranchSchema,
  BranchUpdateSchema,
} from '@rona/types/admin';
import {
  branchListSearchParamsSchema,
  branchSchema,
  branchUpdateSchema,
} from '@rona/validation/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { BranchesService } from './branches.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}
  @Get() async list(
    @Query(new ZodValidationPipe(branchListSearchParamsSchema))
    query: BranchListSearchParamsSchema,
  ): Promise<ApiResponse<BranchDto[]>> {
    const { branches, meta } = await this.service.listBranches(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branches retrieved successfully.',
      data: branches,
      meta,
    };
  }
  @Post() async create(
    @Body(new ZodValidationPipe(branchSchema)) body: BranchSchema,
  ): Promise<ApiResponse<BranchDto>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Branch created successfully.',
      data: await this.service.createBranch(body),
    };
  }
  @Get(':id') async get(
    @Param('id') id: string,
  ): Promise<ApiResponse<BranchDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branch retrieved successfully.',
      data: await this.service.getBranch(id),
    };
  }
  @Patch(':id') async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(branchUpdateSchema)) body: BranchUpdateSchema,
  ): Promise<ApiResponse<BranchDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branch updated successfully.',
      data: await this.service.updateBranch(id, body),
    };
  }
  @Delete(':id') async delete(
    @Param('id') id: string,
  ): Promise<ApiResponse<never>> {
    await this.service.deleteBranch(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Branch deleted successfully.',
    };
  }
}
