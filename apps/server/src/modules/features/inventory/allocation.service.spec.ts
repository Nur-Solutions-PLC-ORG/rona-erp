import { ALLOCATION_MAX_LOTS } from '@rona/config/inventory';
import type { LotAllocation } from '@rona/types/inventory';
import { AllocationService } from './allocation.service';
import type { LotStockRow, StockRepository } from './stock.repository';
import {
  InsufficientStockException,
  InvalidStockOperationException,
} from './inventory.exception';

const NOW = new Date('2026-09-07T00:00:00.000Z');

function lotRow(overrides: Partial<LotStockRow>): LotStockRow {
  return {
    lotId: 'lot-1',
    locationId: 'location-1',
    quantity: '100.0000',
    expiryDate: null,
    qualityStatus: 'APPROVED',
    receiptDate: NOW,
    ...overrides,
  };
}

const service = new AllocationService({} as unknown as StockRepository);

describe('AllocationService', () => {
  describe('FIFO', () => {
    it('allocates from the oldest received lot first', () => {
      const allocations = service.allocate(
        [
          lotRow({ lotId: 'lot-newest', receiptDate: new Date('2026-09-01') }),
          lotRow({ lotId: 'lot-oldest', receiptDate: new Date('2026-08-01') }),
          lotRow({ lotId: 'lot-middle', receiptDate: new Date('2026-08-15') }),
        ],
        '50',
        'FIFO',
      );

      expect(allocations).toEqual([
        {
          lotId: 'lot-oldest',
          locationId: 'location-1',
          quantity: '50.0000',
        },
      ]);
    });

    it('spans multiple lots when the first lot cannot cover the request', () => {
      const allocations = service.allocate(
        [
          lotRow({
            lotId: 'lot-a',
            quantity: '30.0000',
            receiptDate: new Date('2026-08-01'),
          }),
          lotRow({
            lotId: 'lot-b',
            quantity: '40.0000',
            receiptDate: new Date('2026-08-02'),
          }),
        ],
        '50',
        'FIFO',
      );

      expect(allocations).toEqual([
        { lotId: 'lot-a', locationId: 'location-1', quantity: '30.0000' },
        { lotId: 'lot-b', locationId: 'location-1', quantity: '20.0000' },
      ]);
    });

    it('breaks ties deterministically by lot id', () => {
      const allocations = service.allocate(
        [
          lotRow({ lotId: 'lot-z', receiptDate: NOW }),
          lotRow({ lotId: 'lot-a', receiptDate: NOW }),
        ],
        '10',
        'FIFO',
      );

      expect(allocations[0]?.lotId).toBe('lot-a');
    });
  });

  describe('FEFO', () => {
    it('allocates from the earliest expiring lot first', () => {
      const allocations = service.allocate(
        [
          lotRow({ lotId: 'lot-late', expiryDate: new Date('2026-12-01') }),
          lotRow({ lotId: 'lot-soon', expiryDate: new Date('2026-09-20') }),
        ],
        '25',
        'FEFO',
      );

      expect(allocations).toEqual([
        { lotId: 'lot-soon', locationId: 'location-1', quantity: '25.0000' },
      ]);
    });

    it('treats lots without an expiry date as last resort', () => {
      const allocations = service.allocate(
        [
          lotRow({ lotId: 'lot-no-expiry', expiryDate: null }),
          lotRow({ lotId: 'lot-expiring', expiryDate: new Date('2026-10-01') }),
        ],
        '25',
        'FEFO',
      );

      expect(allocations[0]?.lotId).toBe('lot-expiring');
    });
  });

  describe('quality and expiry guards (defense in depth)', () => {
    it('never allocates from QUARANTINED or REJECTED lots', () => {
      const rows = [
        lotRow({ lotId: 'lot-quarantined', qualityStatus: 'QUARANTINED' }),
        lotRow({ lotId: 'lot-rejected', qualityStatus: 'REJECTED' }),
      ];

      expect(() => service.allocate(rows, '10', 'FIFO')).toThrow(
        InsufficientStockException,
      );
    });

    it('never allocates from an expired lot even when APPROVED', () => {
      const rows = [
        lotRow({
          lotId: 'lot-expired',
          qualityStatus: 'APPROVED',
          expiryDate: new Date(NOW.getTime() - 24 * 60 * 60 * 1000),
        }),
      ];

      expect(() => service.allocate(rows, '10', 'FIFO')).toThrow(
        InsufficientStockException,
      );
    });

    it('skips zero-quantity rows', () => {
      const allocations = service.allocate(
        [
          lotRow({ lotId: 'lot-empty', quantity: '0.0000' }),
          lotRow({ lotId: 'lot-has-stock', quantity: '10.0000' }),
        ],
        '10',
        'FIFO',
      );

      expect(allocations).toEqual([
        {
          lotId: 'lot-has-stock',
          locationId: 'location-1',
          quantity: '10.0000',
        },
      ]);
    });
  });

  describe('insufficient stock', () => {
    it('throws when total allocatable quantity is less than requested', () => {
      const rows = [
        lotRow({ lotId: 'lot-a', quantity: '30.0000' }),
        lotRow({ lotId: 'lot-b', quantity: '20.0000' }),
      ];

      expect(() => service.allocate(rows, '100', 'FIFO')).toThrow(
        InsufficientStockException,
      );
    });

    it('reports the available quantity in the error', () => {
      const rows = [lotRow({ lotId: 'lot-a', quantity: '30.0000' })];

      try {
        service.allocate(rows, '100', 'FIFO');
        throw new Error('expected InsufficientStockException');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientStockException);
        const insufficient = error as InsufficientStockException;
        expect(insufficient.available).toBe('30.0000');
        expect(insufficient.requested).toBe('100');
      }
    });
  });

  describe('input validation', () => {
    it('rejects zero quantity', () => {
      expect(() => service.allocate([lotRow({})], '0', 'FIFO')).toThrow(
        InvalidStockOperationException,
      );
    });

    it('rejects negative quantity', () => {
      expect(() => service.allocate([lotRow({})], '-5', 'FIFO')).toThrow(
        InvalidStockOperationException,
      );
    });

    it('rejects non-numeric quantity', () => {
      expect(() => service.allocate([lotRow({})], 'abc', 'FIFO')).toThrow(
        InvalidStockOperationException,
      );
    });
  });

  describe('lot cap', () => {
    it('caps the number of lots in one allocation', () => {
      const rows: LotStockRow[] = Array.from(
        { length: ALLOCATION_MAX_LOTS + 10 },
        (_, index) =>
          lotRow({
            lotId: `lot-${index.toString().padStart(3, '0')}`,
            quantity: '1.0000',
            receiptDate: new Date(NOW.getTime() + index * 1000),
          }),
      );

      const allocations: LotAllocation[] = service.allocate(
        rows,
        `${ALLOCATION_MAX_LOTS}`,
        'FIFO',
      );

      expect(allocations).toHaveLength(ALLOCATION_MAX_LOTS);
      expect(allocations[allocations.length - 1]?.quantity).toBe('1.0000');
    });
  });

  describe('quantity formatting', () => {
    it('returns quantities as 4-decimal strings', () => {
      const allocations = service.allocate(
        [lotRow({ quantity: '10.5000' })],
        '2.25',
        'FIFO',
      );

      expect(allocations[0]?.quantity).toBe('2.2500');
    });
  });
});
