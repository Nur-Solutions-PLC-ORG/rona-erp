import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  AdjustStockInput,
  IssueStockInput,
  MovementDto,
  StockOperationResult,
  TransferStockInput,
} from '@rona/types/inventory';
import { AllocationService } from './allocation.service';
import { StockLedgerService } from './stock-ledger.service';
import { StockRepository } from './stock.repository';

@Injectable()
export class StockOutboundService {
  constructor(
    private readonly ledger: StockLedgerService,
    private readonly allocationService: AllocationService,
    private readonly stockRepository: StockRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async issueStock(input: IssueStockInput): Promise<StockOperationResult> {
    return pooledDb.transaction(async (tx) => {
      await this.ledger.loadItemForUpdate(input.itemId, tx);
      await this.ledger.loadActiveWarehouse(input.warehouseId);

      const strategy = input.strategy ?? 'FIFO';
      const allocations = await this.allocationService.allocateFromWarehouse(
        input.itemId,
        input.warehouseId,
        input.quantity,
        strategy,
        tx,
      );

      const movements = await this.ledger.consumeAllocations(
        {
          type: 'ISSUE',
          itemId: input.itemId,
          reference: input.reference ?? null,
          notes: input.notes ?? null,
        },
        allocations,
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.stock.issue',
          entityType: 'stock_balance',
          entityId: input.itemId,
          after: {
            itemId: input.itemId,
            warehouseId: input.warehouseId,
            quantity: input.quantity,
            allocations,
          },
        },
        tx,
      );

      return { movements: movements, allocations };
    });
  }

  async transferStock(
    input: TransferStockInput,
  ): Promise<StockOperationResult> {
    return pooledDb.transaction(async (tx) => {
      await this.ledger.loadItemForUpdate(input.itemId, tx);
      await this.ledger.loadActiveWarehouse(input.fromWarehouseId);
      await this.ledger.loadActiveWarehouse(input.toWarehouseId);
      await this.ledger.loadLocationInWarehouse(
        input.toLocationId,
        input.toWarehouseId,
      );

      const strategy = input.strategy ?? 'FIFO';
      const allocations = await this.allocationService.allocateFromWarehouse(
        input.itemId,
        input.fromWarehouseId,
        input.quantity,
        strategy,
        tx,
      );

      const movements: MovementDto[] = [];
      for (const allocation of allocations) {
        const movement = await this.stockRepository.insertMovement(
          {
            type: 'TRANSFER',
            itemId: input.itemId,
            lotId: allocation.lotId,
            fromLocationId: allocation.locationId,
            toLocationId: input.toLocationId,
            quantity: allocation.quantity,
            reference: input.reference ?? null,
            notes: input.notes ?? null,
          },
          tx,
        );
        movements.push(movement);

        await this.ledger.applyBalanceDelta(
          input.itemId,
          allocation.lotId,
          allocation.locationId,
          `-${allocation.quantity}`,
          tx,
        );
        await this.ledger.applyBalanceDelta(
          input.itemId,
          allocation.lotId,
          input.toLocationId,
          allocation.quantity,
          tx,
        );
      }

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.stock.transfer',
          entityType: 'stock_balance',
          entityId: input.itemId,
          after: {
            itemId: input.itemId,
            fromWarehouseId: input.fromWarehouseId,
            toWarehouseId: input.toWarehouseId,
            quantity: input.quantity,
            allocations,
          },
        },
        tx,
      );

      return { movements, allocations };
    });
  }

  async adjustStock(input: AdjustStockInput): Promise<StockOperationResult> {
    return pooledDb.transaction(async (tx) => {
      await this.ledger.loadItemForUpdate(input.itemId, tx);
      await this.ledger.loadLocationInWarehouse(
        input.locationId,
        input.warehouseId,
      );
      await this.ledger.loadLotForItem(input.lotId, input.itemId);

      const before = await this.stockRepository.findLockedBalance(
        input.itemId,
        input.lotId,
        input.locationId,
        tx,
      );

      const isNegative = input.quantityDelta.startsWith('-');
      const movement = await this.stockRepository.insertMovement(
        {
          type: 'ADJUSTMENT',
          itemId: input.itemId,
          lotId: input.lotId,
          fromLocationId: isNegative ? input.locationId : null,
          toLocationId: isNegative ? null : input.locationId,
          quantity: input.quantityDelta.replace('-', ''),
          reference: input.reference ?? null,
          notes: input.reason,
        },
        tx,
      );

      const balance = await this.ledger.applyBalanceDelta(
        input.itemId,
        input.lotId,
        input.locationId,
        input.quantityDelta,
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'inventory.stock.adjust',
          entityType: 'stock_balance',
          entityId: balance.id,
          before: before ? { quantity: before.quantity } : undefined,
          after: {
            itemId: input.itemId,
            lotId: input.lotId,
            locationId: input.locationId,
            quantity: balance.quantity,
            reason: input.reason,
          },
        },
        tx,
      );

      return {
        movements: [movement],
        allocations: [
          {
            lotId: input.lotId,
            locationId: input.locationId,
            quantity: input.quantityDelta,
          },
        ],
      };
    });
  }
}
