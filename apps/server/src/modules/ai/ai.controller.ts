import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiResponse } from '@rona/types/api';
import type {
  AiChatRequest,
  AiChatResult,
  AiHealthResult,
  AiReportResult,
  AiSummaryResult,
} from '@rona/types/ai';
import type { AiSummaryQuerySchema } from '@rona/validation/ai';
import {
  aiChatRequestSchema,
  aiReportRequestSchema,
  aiSummaryQuerySchema,
} from '@rona/validation/ai';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { AiService } from './ai.service.js';
import { AiLlmService } from './llm/ai-llm.service.js';

@Controller('ai')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class AiController {
  constructor(
    private readonly service: AiService,
    private readonly llm: AiLlmService,
  ) {}

  @Post('chat')
  async chat(
    @Body(new ZodValidationPipe(aiChatRequestSchema)) body: AiChatRequest,
  ): Promise<ApiResponse<AiChatResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'AI answer generated.',
      data: await this.service.chat(body),
    };
  }

  @Get('summary')
  async summary(
    @Query(new ZodValidationPipe(aiSummaryQuerySchema))
    query: AiSummaryQuerySchema,
  ): Promise<ApiResponse<AiSummaryResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'AI summary generated.',
      data: await this.service.summary(query.language),
    };
  }

  @Post('reports/export')
  async exportReport(
    @Body(new ZodValidationPipe(aiReportRequestSchema))
    body: unknown,
  ): Promise<ApiResponse<AiReportResult>> {
    const request = aiReportRequestSchema.parse(body);
    return {
      success: true,
      statusCode: HttpStatus.ACCEPTED,
      message: 'Report queued for generation.',
      data: await this.service.exportReport(request),
    };
  }

  @Get('reports/:reportId')
  async reportStatus(
    @Param('reportId') reportId: string,
  ): Promise<ApiResponse<AiReportResult>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Report status retrieved.',
      data: await this.service.reportStatus(reportId),
    };
  }

  @Get('reports/:reportId/download')
  async downloadReport(
    @Param('reportId') reportId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, mediaType, data } =
      await this.service.downloadReport(reportId);
    res.setHeader('Content-Type', mediaType);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).end(data);
  }

  @Get('health')
  health(): ApiResponse<AiHealthResult> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'AI assistant health.',
      data: {
        status: 'ok',
        llmConfigured: this.llm.isConfigured,
        dataSourceReachable: true,
      },
    };
  }
}
