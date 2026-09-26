import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { ProductionOutputInput } from '@rona/types/manufacturing';
import { StockInboundService } from '../inventory/stock-inbound.service';
import { ProductionOutputFailedException } from './manufacturing.exception';
import { ProductionBatchesRepository } from './production-batches.repository';
import { ProductionBatchesService } from './production-batches.service';

@Injectable()
export class ProductionOutputService {
  constructor(
    private readonly batchesService: ProductionBatchesService,
    private readonly batchesRepository: ProductionBatchesRepository,
    private readonly stockInbound: StockInboundService,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async recordOutput(batchId: string, input: ProductionOutputInput) {
    return pooledDb.transaction(async (tx) => {
      const { batch, order } = await this.batchesService.loadOpenBatchWithOrder(
        batchId,
        tx,
      );

      const result = await this.stockInbound.receiveStockInTx(
        {
          itemId: order.itemId,
          warehouseId: order.warehouseId,
          locationId: input.locationId,
          quantity: input.quantity,
          unitCost: input.unitCost,
          lotNumber: input.lotNumber,
          reference: order.orderNumber,
          notes: input.notes,
        },
        tx,
      );

      const lotId = result.allocations[0]?.lotId;
      if (!lotId) throw new ProductionOutputFailedException();

      const output = await this.batchesRepository.createOutput(
        {
          productionBatchId: batchId,
          itemId: order.itemId,
          lotId,
          locationId: input.locationId,
          movementId: result.movements[0]?.id ?? null,
          quantity: input.quantity,
          unitCost: input.unitCost ?? null,
          notes: input.notes ?? null,
        },
        tx,
      );

      const scrapDelta = input.scrapQuantity ? Number(input.scrapQuantity) : 0;
      await this.batchesRepository.update(
        batchId,
        {
          outputQuantity: (
            Number(batch.outputQuantity) + Number(input.quantity)
          ).toFixed(4),
          scrapQuantity: (Number(batch.scrapQuantity) + scrapDelta).toFixed(4),
        },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.production.output',
          entityType: 'production_output',
          entityId: output.id,
          after: {
            batchId,
            itemId: order.itemId,
            lotId,
            lotNumber: input.lotNumber,
            quantity: input.quantity,
            scrapQuantity: input.scrapQuantity ?? null,
          },
        },
        tx,
      );

      return output;
    });
  }
}
