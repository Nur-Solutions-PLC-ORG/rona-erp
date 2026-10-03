import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import {
  MANUFACTURING_DEFAULT_PAGE,
  MANUFACTURING_DEFAULT_PAGE_SIZE,
} from '@rona/config/manufacturing';
import type {
  BatchCreateInput,
  BatchListParams,
  BatchListSearchParamsSchema,
  PaginatedResult,
} from '@rona/types/manufacturing';
import {
  ProductionBatchNotInProgressException,
  ProductionBatchNotFoundException,
  ProductionBatchNumberConflictException,
  ProductionOrderInvalidStatusException,
  ProductionOrderNotFoundException,
} from './manufacturing.exception';
import { ProductionBatchesRepository } from './production-batches.repository';
import { ProductionOrdersRepository } from './production-orders.repository';

@Injectable()
export class ProductionBatchesService {
  constructor(
    private readonly batchesRepository: ProductionBatchesRepository,
    private readonly ordersRepository: ProductionOrdersRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createBatch(orderId: string, input: BatchCreateInput) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new ProductionOrderNotFoundException();
    if (order.status !== 'IN_PROGRESS') {
      throw new ProductionOrderInvalidStatusException(
        `Only IN_PROGRESS orders can have batches (current: ${order.status})`,
      );
    }

    const batchNumber =
      input.batchNumber ??
      `${order.orderNumber}-B${await this.batchesRepository.nextBatchSequence(orderId)}`;
    const existing =
      await this.batchesRepository.findByBatchNumber(batchNumber);
    if (existing) throw new ProductionBatchNumberConflictException();

    const batch = await this.batchesRepository.create({
      productionOrderId: orderId,
      batchNumber,
      notes: input.notes ?? null,
    });

    await this.auditService.record({
      organizationId: this.tenantContext.organizationId,
      action: 'manufacturing.production_batch.create',
      entityType: 'production_batch',
      entityId: batch.id,
      after: { batchNumber, productionOrderId: orderId },
    });

    return batch;
  }

  async getBatch(batchId: string) {
    const batch = await this.batchesRepository.findById(batchId);
    if (!batch) throw new ProductionBatchNotFoundException();
    return batch;
  }

  async loadOpenBatchWithOrder(batchId: string, tx: Executor) {
    const batch = await this.batchesRepository.findByIdForUpdate(batchId, tx);
    if (!batch) throw new ProductionBatchNotFoundException();
    if (batch.status !== 'IN_PROGRESS') {
      throw new ProductionBatchNotInProgressException();
    }

    const order = await this.ordersRepository.findByIdForUpdate(
      batch.productionOrderId,
      tx,
    );
    if (!order) throw new ProductionOrderNotFoundException();
    if (order.status !== 'IN_PROGRESS') {
      throw new ProductionOrderInvalidStatusException(
        `Production order is not IN_PROGRESS (current: ${order.status})`,
      );
    }
    return { batch, order };
  }

  async listBatches(
    params: BatchListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: BatchListParams = {
      ...params,
      page: params.page ?? MANUFACTURING_DEFAULT_PAGE,
      limit: params.limit ?? MANUFACTURING_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.batchesRepository.list(resolved);
    return {
      data: rows,
      pagination: {
        page: resolved.page,
        limit: resolved.limit,
        totalItems: total,
        totalPages: Math.ceil(total / resolved.limit),
      },
    };
  }

  async getBatchConsumptions(batchId: string) {
    await this.getBatch(batchId);
    return this.batchesRepository.findConsumptionsByBatch(batchId);
  }

  async getBatchReturns(batchId: string) {
    await this.getBatch(batchId);
    return this.batchesRepository.findReturnsByBatch(batchId);
  }

  async getBatchOutputs(batchId: string) {
    await this.getBatch(batchId);
    return this.batchesRepository.findOutputsByBatch(batchId);
  }

  async completeBatch(batchId: string) {
    return pooledDb.transaction(async (tx) => {
      const batch = await this.batchesRepository.findByIdForUpdate(batchId, tx);
      if (!batch) throw new ProductionBatchNotFoundException();
      if (batch.status !== 'IN_PROGRESS') {
        throw new ProductionBatchNotInProgressException();
      }

      const completed = await this.batchesRepository.update(
        batchId,
        { status: 'COMPLETED', completedAt: new Date() },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.production_batch.complete',
          entityType: 'production_batch',
          entityId: batchId,
          before: { status: batch.status },
          after: {
            status: 'COMPLETED',
            outputQuantity: batch.outputQuantity,
            scrapQuantity: batch.scrapQuantity,
          },
        },
        tx,
      );

      return completed;
    });
  }
}
