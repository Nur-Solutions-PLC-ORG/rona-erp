import { Injectable } from '@nestjs/common';
import type {
  MovementDto,
  MovementListSearchParams,
  MovementListSearchParamsSchema,
  PaginatedResult,
  StockBalanceDto,
  StockQueryParams,
  StockQueryParamsSchema,
} from '@rona/types/inventory';
import {
  INVENTORY_DEFAULT_PAGE,
  INVENTORY_DEFAULT_PAGE_SIZE,
} from '@rona/config/inventory';
import { StockRepository } from './stock.repository';

@Injectable()
export class StockQueryService {
  constructor(private readonly stockRepository: StockRepository) {}

  async listBalances(
    params: StockQueryParamsSchema,
  ): Promise<PaginatedResult<StockBalanceDto>> {
    const resolved: StockQueryParams = this.resolvePagination(params);
    const { rows, total } = await this.stockRepository.listBalances(resolved);
    return this.toResult(rows, total, resolved);
  }

  async listMovements(
    params: MovementListSearchParamsSchema,
  ): Promise<PaginatedResult<MovementDto>> {
    const resolved: MovementListSearchParams = this.resolvePagination(params);
    const { rows, total } = await this.stockRepository.listMovements(resolved);
    return this.toResult(rows, total, resolved);
  }

  async sumOnHandByItem(itemId: string, warehouseId?: string) {
    return this.stockRepository.sumOnHandByItem(itemId, warehouseId);
  }

  private resolvePagination<T extends { page?: number; limit?: number }>(
    params: T,
  ): T & { page: number; limit: number } {
    return {
      ...params,
      page: params.page ?? INVENTORY_DEFAULT_PAGE,
      limit: params.limit ?? INVENTORY_DEFAULT_PAGE_SIZE,
    };
  }

  private toResult<T>(
    rows: T[],
    total: number,
    params: { page: number; limit: number },
  ): PaginatedResult<T> {
    return {
      data: rows,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalItems: total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }
}
