import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  ReceiveStockInput,
  ReturnStockInput,
  StockOperationResult,
} from '@rona/types/inventory';
import { StockLedgerService } from './stock-ledger.service';
import { StockRepository } from './stock.repository';
import { WarehousesRepository } from './warehouses.repository';

@Injectable()
export class StockInboundService {
  constructor(
    private readonly ledger: StockLedgerService,
    private readonly warehousesRepository: WarehousesRepository,
    private readonly stockRepository: StockRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async receiveStock(input: ReceiveStockInput): Promise<StockOperationResult> {
    return pooledDb.transaction((tx) => this.receiveStockInTx(input, tx));
  }

  async receiveStockInTx(
    input: ReceiveStockInput,
    tx: Executor,
  ): Promise<StockOperationResult> {
    await this.ledger.loadItemForUpdate(input.itemId, tx);
    await this.ledger.loadLocationInWarehouse(
      input.locationId,
      input.warehouseId,
    );
    await this.ledger.loadActiveWarehouse(input.warehouseId);

    let lot = await this.warehousesRepository.findLotByNumber(
      input.itemId,
      input.lotNumber,
    );
    if (!lot) {
      lot = await this.warehousesRepository.createLot(
        input.itemId,
        {
          lotNumber: input.lotNumber,
          supplier: input.supplier,
          receiptDate: new Date(),
          manufactureDate: input.manufactureDate,
          expiryDate: input.expiryDate,
          qualityStatus: 'APPROVED',
        },
        tx,
      );
    }

    const movement = await this.stockRepository.insertMovement(
      {
        type: 'RECEIPT',
        itemId: input.itemId,
        lotId: lot.id,
        toLocationId: input.locationId,
        quantity: input.quantity,
        unitCost: input.unitCost ?? null,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
      },
      tx,
    );

    const balance = await this.ledger.applyBalanceDelta(
      input.itemId,
      lot.id,
      input.locationId,
      input.quantity,
      tx,
    );

    await this.auditService.record(
      {
        organizationId: this.tenantContext.organizationId,
        action: 'inventory.stock.receive',
        entityType: 'stock_balance',
        entityId: balance.id,
        after: {
          itemId: input.itemId,
          lotId: lot.id,
          locationId: input.locationId,
          quantity: balance.quantity,
        },
      },
      tx,
    );

    return {
      movements: [movement],
      allocations: [
        {
          lotId: lot.id,
          locationId: input.locationId,
          quantity: input.quantity,
        },
      ],
    };
  }

  async returnStock(input: ReturnStockInput): Promise<StockOperationResult> {
    return pooledDb.transaction((tx) => this.returnStockInTx(input, tx));
  }

  async returnStockInTx(
    input: ReturnStockInput,
    tx: Executor,
  ): Promise<StockOperationResult> {
    await this.ledger.loadItemForUpdate(input.itemId, tx);
    await this.ledger.loadActiveWarehouse(input.warehouseId);
    await this.ledger.loadLotForItem(input.lotId, input.itemId);
    await this.ledger.loadLocationInWarehouse(
      input.locationId,
      input.warehouseId,
    );

    const movement = await this.stockRepository.insertMovement(
      {
        type: 'RETURN',
        itemId: input.itemId,
        lotId: input.lotId,
        toLocationId: input.locationId,
        quantity: input.quantity,
        reference: input.reference ?? null,
        notes: input.reason,
      },
      tx,
    );

    const balance = await this.ledger.applyBalanceDelta(
      input.itemId,
      input.lotId,
      input.locationId,
      input.quantity,
      tx,
    );

    await this.auditService.record(
      {
        organizationId: this.tenantContext.organizationId,
        action: 'inventory.stock.return',
        entityType: 'stock_balance',
        entityId: balance.id,
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
          quantity: input.quantity,
        },
      ],
    };
  }
}
