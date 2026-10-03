import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  ReservationCreateSchema,
  ReservationListSearchParamsSchema,
} from '@rona/types/inventory';
import {
  reservationCreateSchema,
  reservationListSearchParamsSchema,
} from '@rona/validation/inventory';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @RequirePermissions('inventory.reservation.read')
  async listReservations(
    @Query(new ZodValidationPipe(reservationListSearchParamsSchema))
    query: ReservationListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.reservationsService.listReservations(query);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reservations retrieved successfully.',
      data: result.data,
      meta: result.pagination,
    };
  }

  @Post()
  @RequirePermissions('inventory.reservation.create')
  async createReservation(
    @Body(new ZodValidationPipe(reservationCreateSchema))
    body: ReservationCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Reservation created successfully.',
      data: await this.reservationsService.createReservation(body),
    };
  }

  @Get(':id')
  @RequirePermissions('inventory.reservation.read')
  async getReservation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reservation retrieved successfully.',
      data: await this.reservationsService.getReservation(id),
    };
  }

  @Post(':id/release')
  @RequirePermissions('inventory.reservation.release')
  async releaseReservation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reservation released successfully.',
      data: await this.reservationsService.releaseReservation(id),
    };
  }

  @Post(':id/consume')
  @RequirePermissions('inventory.reservation.consume')
  async consumeReservation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reservation consumed successfully.',
      data: await this.reservationsService.consumeReservation(id),
    };
  }
}
