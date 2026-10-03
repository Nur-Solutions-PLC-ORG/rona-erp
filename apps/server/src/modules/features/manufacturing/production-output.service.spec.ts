import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { ProductionOutputInput } from '@rona/types/manufacturing';
import type { StockInboundService } from '../inventory/stock-inbound.service';
import { ProductionOutputFailedException } from './manufacturing.exception';
import type { ProductionBatchesRepository } from './production-batches.repository';
import type { ProductionBatchesService } from './production-batches.service';
import { ProductionOutputService } from './production-output.service';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/db', () => ({
  db: {},
  pooledDb: { transaction: jest.fn() },
}));

jest.mock('@/redis', () => ({
  redisClient: {
    get: jest.fn(async () => null),
    set: jest.fn(async () => 'OK'),
  },
}));

const USER_A = '11111111-1111-4111-8111-111111111111';
const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

const BATCH_ID = 'batch-1';
const ORDER_ID = 'order-1';
const ITEM_ID = 'item-fg';
const WAREHOUSE_ID = 'warehouse-1';
const LOCATION_ID = 'location-1';
const LOT_ID = 'lot-fg-1';

const BATCH = {
  id: BATCH_ID,
  organizationId: ORG_A,
  status: 'IN_PROGRESS',
  outputQuantity: '0.0000',
  scrapQuantity: '0.0000',
};

const ORDER = {
  id: ORDER_ID,
  organizationId: ORG_A,
  orderNumber: 'PO-2026-001',
  itemId: ITEM_ID,
  warehouseId: WAREHOUSE_ID,
};

const loadOpenBatchWithOrder = jest.fn();
const batchesService = {
  loadOpenBatchWithOrder,
} as unknown as ProductionBatchesService;

const createOutput = jest.fn();
const batchesUpdate = jest.fn();
const batchesRepository = {
  createOutput,
  update: batchesUpdate,
} as unknown as ProductionBatchesRepository;

const receiveStockInTx = jest.fn();
const stockInbound = {
  receiveStockInTx,
} as unknown as StockInboundService;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new ProductionOutputService(
  batchesService,
  batchesRepository,
  stockInbound,
  auditService,
  new TenantContextService(),
);

const mockTx = { sentinel: 'tx' };

async function runInOrganizationA<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['PRODUCTION_MANAGER'],
      permissions: [],
    },
    callback,
  );
}

describe('ProductionOutputService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    loadOpenBatchWithOrder.mockResolvedValue({ batch: BATCH, order: ORDER });
    receiveStockInTx.mockResolvedValue({
      movements: [{ id: 'movement-receipt-1' }],
      allocations: [{ lotId: LOT_ID }],
    });
    createOutput.mockResolvedValue({ id: 'output-1' });
    batchesUpdate.mockResolvedValue(BATCH);
    auditRecord.mockResolvedValue(undefined);
  });

  describe('recordOutput', () => {
    const input: ProductionOutputInput = {
      lotNumber: 'FG-LOT-2026-001',
      locationId: LOCATION_ID,
      quantity: '95',
      unitCost: '2.50',
    };

    it('receives the finished goods via the inbound service and links the genealogy', async () => {
      const result = await runInOrganizationA(() =>
        service.recordOutput(BATCH_ID, input),
      );

      expect(receiveStockInTx).toHaveBeenCalledWith(
        {
          itemId: ITEM_ID,
          warehouseId: WAREHOUSE_ID,
          locationId: LOCATION_ID,
          quantity: '95',
          unitCost: '2.50',
          lotNumber: 'FG-LOT-2026-001',
          reference: 'PO-2026-001',
          notes: undefined,
        },
        mockTx,
      );
      expect(createOutput).toHaveBeenCalledWith(
        {
          productionBatchId: BATCH_ID,
          itemId: ITEM_ID,
          lotId: LOT_ID,
          locationId: LOCATION_ID,
          movementId: 'movement-receipt-1',
          quantity: '95',
          unitCost: '2.50',
          notes: null,
        },
        mockTx,
      );
      expect(batchesUpdate).toHaveBeenCalledWith(
        BATCH_ID,
        { outputQuantity: '95.0000', scrapQuantity: '0.0000' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.production.output',
          after: expect.objectContaining({
            lotId: LOT_ID,
            quantity: '95',
          }) as Record<string, unknown>,
        }),
        mockTx,
      );
      expect(result).toEqual({ id: 'output-1' });
    });

    it('adds the scrap quantity to the batch counters', async () => {
      await runInOrganizationA(() =>
        service.recordOutput(BATCH_ID, {
          ...input,
          scrapQuantity: '5',
        }),
      );

      expect(batchesUpdate).toHaveBeenCalledWith(
        BATCH_ID,
        { outputQuantity: '95.0000', scrapQuantity: '5.0000' },
        mockTx,
      );
    });

    it('fails safely when the finished receipt produced no allocation', async () => {
      receiveStockInTx.mockResolvedValue({
        movements: [{ id: 'movement-receipt-1' }],
        allocations: [],
      });

      await expect(
        runInOrganizationA(() => service.recordOutput(BATCH_ID, input)),
      ).rejects.toBeInstanceOf(ProductionOutputFailedException);
      expect(createOutput).not.toHaveBeenCalled();
    });
  });
});
