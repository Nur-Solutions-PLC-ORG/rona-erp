import { Injectable } from '@nestjs/common';
import type { Executor } from '@/db/executor';
import type { LotAllocation, MovementDto } from '@rona/types/inventory';
import {
  InsufficientStockException,
  InvalidStockOperationException,
  ItemArchivedException,
  ItemNotFoundException,
  LotNotFoundException,
  WarehouseInactiveException,
  WarehouseLocationNotFoundException,
  WarehouseNotFoundException,
} from './inventory.exception';
import { ItemsRepository } from './items.repository';
import { StockRepository } from './stock.repository';
import { WarehousesRepository } from './warehouses.repository';

@Injectable()
export class StockLedgerService {
  constructor(
    private readonly itemsRepository: ItemsRepository,
    private readonly warehousesRepository: WarehousesRepository,
    private readonly stockRepository: StockRepository,
  ) {}

  async loadItemForUpdate(itemId: string, tx: Executor) {
    const item = await this.itemsRepository.findByIdForUpdate(itemId, tx);
    if (!item) throw new ItemNotFoundException();
    if (item.isArchived) throw new ItemArchivedException();
    return item;
  }

  async loadActiveWarehouse(warehouseId: string) {
    const warehouse = await this.warehousesRepository.findById(warehouseId);
    if (!warehouse) throw new WarehouseNotFoundException();
    if (!warehouse.isActive) throw new WarehouseInactiveException();
    return warehouse;
  }

  async loadLocation(locationId: string) {
    const location =
      await this.warehousesRepository.findLocationById(locationId);
    if (!location) throw new WarehouseLocationNotFoundException();
    return location;
  }

  async loadLocationInWarehouse(locationId: string, warehouseId: string) {
    const location = await this.loadLocation(locationId);
    if (location.warehouseId !== warehouseId) {
      throw new InvalidStockOperationException(
        'Location does not belong to the given warehouse',
      );
    }
    return location;
  }

  async loadLotForItem(lotId: string, itemId: string) {
    const lot = await this.warehousesRepository.findLotById(lotId);
    if (!lot) throw new LotNotFoundException();
    if (lot.itemId !== itemId) {
      throw new InvalidStockOperationException(
        'Lot does not belong to the given item',
      );
    }
    return lot;
  }

  async applyBalanceDelta(
    itemId: string,
    lotId: string,
    locationId: string,
    delta: string,
    tx: Executor,
  ) {
    const current = await this.stockRepository.findLockedBalance(
      itemId,
      lotId,
      locationId,
      tx,
    );
    const currentQuantity = current ? Number(current.quantity) : 0;
    const deltaValue = Number(delta);
    const newQuantity = currentQuantity + deltaValue;

    if (newQuantity < 0) {
      throw new InsufficientStockException(
        currentQuantity.toFixed(4),
        Math.abs(deltaValue).toFixed(4),
      );
    }

    if (current) {
      return this.stockRepository.adjustBalance(
        itemId,
        lotId,
        locationId,
        delta,
        tx,
      );
    }
    return this.stockRepository.upsertBalance(
      {
        itemId,
        lotId,
        locationId,
        quantity: newQuantity.toFixed(4),
      },
      tx,
    );
  }

  async consumeAllocations(
    context: {
      type: 'ISSUE';
      itemId: string;
      reference: string | null;
      notes: string | null;
    },
    allocations: LotAllocation[],
    tx: Executor,
  ): Promise<MovementDto[]> {
    const movements: MovementDto[] = [];
    for (const allocation of allocations) {
      await this.stockRepository.findLockedBalance(
        context.itemId,
        allocation.lotId,
        allocation.locationId,
        tx,
      );
      const movement = await this.stockRepository.insertMovement(
        {
          type: context.type,
          itemId: context.itemId,
          lotId: allocation.lotId,
          fromLocationId: allocation.locationId,
          toLocationId: null,
          quantity: allocation.quantity,
          reference: context.reference,
          notes: context.notes,
        },
        tx,
      );
      movements.push(movement);
      await this.applyBalanceDelta(
        context.itemId,
        allocation.lotId,
        allocation.locationId,
        `-${allocation.quantity}`,
        tx,
      );
    }
    return movements;
  }
}
