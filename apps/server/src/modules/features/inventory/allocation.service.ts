import { Injectable } from '@nestjs/common';
import { ALLOCATION_MAX_LOTS } from '@rona/config/inventory';
import type { LotAllocation } from '@rona/types/inventory';
import type { Executor } from '@/db/executor';
import { StockRepository, type LotStockRow } from './stock.repository';
import {
  InsufficientStockException,
  InvalidStockOperationException,
} from './inventory.exception';

@Injectable()
export class AllocationService {
  constructor(private readonly stockRepository: StockRepository) {}

  allocate(
    rows: LotStockRow[],
    quantity: string,
    strategy: 'FIFO' | 'FEFO',
  ): LotAllocation[] {
    const requested = Number(quantity);
    if (!Number.isFinite(requested) || requested <= 0) {
      throw new InvalidStockOperationException(
        'Allocation quantity must be a positive number',
      );
    }

    const now = Date.now();
    const allocatable = rows.filter((row) => {
      if (
        row.qualityStatus !== 'APPROVED' &&
        row.qualityStatus !== 'RELEASED'
      ) {
        return false;
      }
      if (row.expiryDate && row.expiryDate.getTime() <= now) {
        return false;
      }
      return Number(row.quantity) > 0;
    });

    const sorted = [...allocatable].sort((a, b) => {
      if (strategy === 'FEFO') {
        const aDate = a.expiryDate
          ? a.expiryDate.getTime()
          : Number.POSITIVE_INFINITY;
        const bDate = b.expiryDate
          ? b.expiryDate.getTime()
          : Number.POSITIVE_INFINITY;
        if (aDate !== bDate) return aDate - bDate;
      }
      const aReceipt = a.receiptDate ? a.receiptDate.getTime() : 0;
      const bReceipt = b.receiptDate ? b.receiptDate.getTime() : 0;
      if (aReceipt !== bReceipt) return aReceipt - bReceipt;
      return a.lotId.localeCompare(b.lotId);
    });

    const allocations: LotAllocation[] = [];
    let remaining = requested;
    for (const row of sorted) {
      if (remaining <= 0) break;
      if (allocations.length >= ALLOCATION_MAX_LOTS) break;
      const available = Number(row.quantity);
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      if (take <= 0) continue;

      const taken = take.toFixed(4);
      allocations.push({
        lotId: row.lotId,
        quantity: taken,
        locationId: row.locationId,
      });
      remaining = Number((remaining - take).toFixed(4));
    }

    if (remaining > 0) {
      throw new InsufficientStockException(
        this.formatQuantity(Math.max(0, requested - remaining)),
        quantity,
      );
    }

    return allocations;
  }

  async allocateFromWarehouse(
    itemId: string,
    warehouseId: string,
    quantity: string,
    strategy: 'FIFO' | 'FEFO',
    tx?: Executor,
  ): Promise<LotAllocation[]> {
    const rows = await this.stockRepository.listAllocatableLotStock(
      itemId,
      warehouseId,
      strategy,
      tx,
    );
    return this.allocate(rows, quantity, strategy);
  }

  private formatQuantity(value: number): string {
    return value.toFixed(4);
  }
}
