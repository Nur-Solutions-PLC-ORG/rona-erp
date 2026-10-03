import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  MaterialConsumptionInput,
  MaterialReturnInput,
} from '@rona/types/manufacturing';
import { ReservationsService } from '../inventory/reservations.service';
import { StockInboundService } from '../inventory/stock-inbound.service';
import { StockLedgerService } from '../inventory/stock-ledger.service';
import { StockRepository } from '../inventory/stock.repository';
import {
  ConsumptionExceedsReservationException,
  MaterialNotInOrderException,
  ReturnExceedsConsumptionException,
} from './manufacturing.exception';
import { ProductionBatchesRepository } from './production-batches.repository';
import { ProductionBatchesService } from './production-batches.service';
import { ProductionOrdersRepository } from './production-orders.repository';

interface OrderMaterialRow {
  id: string;
  componentItemId: string;
  requiredQuantity: string;
  consumedQuantity: string;
  returnedQuantity: string;
  reservationId: string | null;
}

@Injectable()
export class ProductionMaterialsService {
  constructor(
    private readonly batchesService: ProductionBatchesService,
    private readonly batchesRepository: ProductionBatchesRepository,
    private readonly ordersRepository: ProductionOrdersRepository,
    private readonly reservationsService: ReservationsService,
    private readonly stockInbound: StockInboundService,
    private readonly stockLedger: StockLedgerService,
    private readonly stockRepository: StockRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async consumeMaterial(batchId: string, input: MaterialConsumptionInput) {
    return pooledDb.transaction(async (tx) => {
      const { order } = await this.batchesService.loadOpenBatchWithOrder(
        batchId,
        tx,
      );

      const material = await this.resolveOrderMaterial(
        order.id,
        input.itemId,
        input.substitutedForItemId ?? null,
      );

      const remaining =
        Number(material.requiredQuantity) -
        Number(material.consumedQuantity) +
        Number(material.returnedQuantity);
      if (Number(input.quantity) > remaining) {
        throw new ConsumptionExceedsReservationException(
          remaining.toFixed(4),
          input.quantity,
        );
      }

      await this.stockLedger.loadItemForUpdate(input.itemId, tx);
      await this.stockLedger.loadLotForItem(input.lotId, input.itemId);
      await this.stockLedger.loadLocationInWarehouse(
        input.locationId,
        order.warehouseId,
      );

      const movement = await this.consumeFromReservationAndStock(
        material,
        input,
        order.orderNumber,
        tx,
      );

      const consumption = await this.batchesRepository.createConsumption(
        {
          productionBatchId: batchId,
          orderMaterialId: material.id,
          itemId: input.itemId,
          lotId: input.lotId,
          locationId: input.locationId,
          substitutedForItemId: input.substitutedForItemId ?? null,
          movementId: movement.id,
          quantity: input.quantity,
          isScrap: input.isScrap ?? false,
          notes: input.notes ?? null,
        },
        tx,
      );

      await this.ordersRepository.updateMaterial(
        material.id,
        {
          consumedQuantity: (
            Number(material.consumedQuantity) + Number(input.quantity)
          ).toFixed(4),
        },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.material.consume',
          entityType: 'material_consumption',
          entityId: consumption.id,
          after: {
            batchId,
            itemId: input.itemId,
            lotId: input.lotId,
            quantity: input.quantity,
            isScrap: input.isScrap ?? false,
          },
        },
        tx,
      );

      return consumption;
    });
  }

  async returnMaterial(batchId: string, input: MaterialReturnInput) {
    return pooledDb.transaction(async (tx) => {
      const { order } = await this.batchesService.loadOpenBatchWithOrder(
        batchId,
        tx,
      );

      const material = await this.resolveOrderMaterial(
        order.id,
        input.itemId,
        null,
      );

      const returnable =
        Number(material.consumedQuantity) - Number(material.returnedQuantity);
      if (Number(input.quantity) > returnable) {
        throw new ReturnExceedsConsumptionException(
          returnable.toFixed(4),
          input.quantity,
        );
      }

      const result = await this.stockInbound.returnStockInTx(
        {
          itemId: input.itemId,
          warehouseId: order.warehouseId,
          locationId: input.locationId,
          lotId: input.lotId,
          quantity: input.quantity,
          reason: input.reason,
          reference: order.orderNumber,
          notes: input.notes,
        },
        tx,
      );

      const returnRecord = await this.batchesRepository.createReturn(
        {
          productionBatchId: batchId,
          orderMaterialId: material.id,
          itemId: input.itemId,
          lotId: input.lotId,
          locationId: input.locationId,
          movementId: result.movements[0]?.id ?? null,
          quantity: input.quantity,
          reason: input.reason,
          notes: input.notes ?? null,
        },
        tx,
      );

      await this.ordersRepository.updateMaterial(
        material.id,
        {
          returnedQuantity: (
            Number(material.returnedQuantity) + Number(input.quantity)
          ).toFixed(4),
        },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'manufacturing.material.return',
          entityType: 'material_return',
          entityId: returnRecord.id,
          after: {
            batchId,
            itemId: input.itemId,
            lotId: input.lotId,
            quantity: input.quantity,
            reason: input.reason,
          },
        },
        tx,
      );

      return returnRecord;
    });
  }

  private async resolveOrderMaterial(
    orderId: string,
    itemId: string,
    substitutedForItemId: string | null,
  ): Promise<OrderMaterialRow> {
    const direct = await this.ordersRepository.findMaterialByItem(
      orderId,
      itemId,
    );
    if (direct) return direct;

    if (substitutedForItemId) {
      const replaced = await this.ordersRepository.findMaterialByItem(
        orderId,
        substitutedForItemId,
      );
      if (replaced) return replaced;
    }

    throw new MaterialNotInOrderException();
  }

  private async consumeFromReservationAndStock(
    material: OrderMaterialRow,
    input: MaterialConsumptionInput,
    orderNumber: string,
    tx: Executor,
  ) {
    if (material.reservationId) {
      await this.reservationsService.consumeReservationFromLot(
        material.reservationId,
        input.lotId,
        input.locationId,
        input.quantity,
        tx,
      );
    }

    const movement = await this.stockRepository.insertMovement(
      {
        type: 'ISSUE',
        itemId: input.itemId,
        lotId: input.lotId,
        fromLocationId: input.locationId,
        quantity: input.quantity,
        reference: orderNumber,
        notes: input.notes ?? null,
      },
      tx,
    );

    await this.stockLedger.applyBalanceDelta(
      input.itemId,
      input.lotId,
      input.locationId,
      `-${input.quantity}`,
      tx,
    );

    return movement;
  }
}
