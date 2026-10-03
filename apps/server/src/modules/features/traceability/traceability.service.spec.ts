import { runWithRequestContext } from '@/context/request-context';
import { LotNotFoundException } from '../inventory/inventory.exception';
import type { TraceabilityRepository } from './traceability.repository';
import { TraceabilityService } from './traceability.service';

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

const RAW_LOT_ID = 'raw-lot-1';
const FINISHED_LOT_ID = 'finished-lot-1';

const RAW_LOT = {
  id: RAW_LOT_ID,
  organizationId: ORG_A,
  lotNumber: 'RM-LOT-2026-001',
  itemId: 'item-flour',
  itemCode: 'RM-FLOUR',
  itemName: 'Wheat Flour',
  qualityStatus: 'RELEASED',
  expiryDate: null,
  supplier: 'Ethio Grain',
  receiptDate: '2026-01-02',
  manufactureDate: null,
  createdAt: '2026-01-02T08:00:00.000Z',
  updatedAt: '2026-01-02T08:00:00.000Z',
};

const FINISHED_LOT = {
  ...RAW_LOT,
  id: FINISHED_LOT_ID,
  lotNumber: 'FG-LOT-2026-001',
  itemId: 'item-bread',
  itemCode: 'FG-BREAD',
  itemName: 'Bread Loaf',
  supplier: null,
  receiptDate: null,
  manufactureDate: '2026-01-05',
};

const findLotWithItem = jest.fn();
const findLotInspections = jest.fn();
const findLotReleaseDecisions = jest.fn();
const findConsumingBatches = jest.fn();
const findBatchOutputs = jest.fn();
const findProducingBatch = jest.fn();
const findBatchMaterials = jest.fn();

const traceabilityRepository = {
  findLotWithItem,
  findLotInspections,
  findLotReleaseDecisions,
  findConsumingBatches,
  findBatchOutputs,
  findProducingBatch,
  findBatchMaterials,
} as unknown as TraceabilityRepository;

const service = new TraceabilityService(traceabilityRepository);

async function runInOrganizationA<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['QUALITY_MANAGER'],
      permissions: [],
    },
    callback,
  );
}

describe('TraceabilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    findLotWithItem.mockResolvedValue(RAW_LOT);
    findLotInspections.mockResolvedValue([]);
    findLotReleaseDecisions.mockResolvedValue([]);
    findConsumingBatches.mockResolvedValue([]);
    findBatchOutputs.mockResolvedValue([]);
    findProducingBatch.mockResolvedValue(undefined);
    findBatchMaterials.mockResolvedValue([]);
  });

  describe('getLotDetail', () => {
    it('returns the lot with its quality history', async () => {
      findLotWithItem.mockResolvedValue(FINISHED_LOT);
      findLotInspections.mockResolvedValue([
        {
          id: 'inspection-1',
          inspectionNumber: 'INSP-2026-001',
          type: 'FINISHED_GOOD',
          status: 'REVIEWED',
          completedAt: '2026-01-05T12:00:00.000Z',
          reviewedAt: '2026-01-05T13:00:00.000Z',
        },
      ]);
      findLotReleaseDecisions.mockResolvedValue([
        {
          id: 'decision-1',
          inspectionId: 'inspection-1',
          decision: 'RELEASE',
          decidedBy: USER_A,
          notes: 'ok',
          createdAt: '2026-01-05T13:00:00.000Z',
        },
      ]);

      const result = await runInOrganizationA(() =>
        service.getLotDetail(FINISHED_LOT_ID),
      );

      expect(findLotWithItem).toHaveBeenCalledWith(FINISHED_LOT_ID);
      expect(result.lot.id).toBe(FINISHED_LOT_ID);
      expect(result.lot.itemCode).toBe('FG-BREAD');
      expect(result.inspections).toHaveLength(1);
      expect(result.inspections[0].status).toBe('REVIEWED');
      expect(result.releaseDecisions).toHaveLength(1);
      expect(result.releaseDecisions[0].decision).toBe('RELEASE');
    });

    it('returns 404 when the lot belongs to another tenant', async () => {
      findLotWithItem.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getLotDetail('forged-lot')),
      ).rejects.toBeInstanceOf(LotNotFoundException);
    });
  });

  describe('getForwardTrace', () => {
    it('traces a raw lot to the batches that consumed it and their finished lots', async () => {
      findConsumingBatches.mockResolvedValue([
        {
          productionBatchId: 'batch-1',
          batchNumber: 'BATCH-2026-001',
          productionOrderId: 'order-1',
          orderNumber: 'MO-2026-001',
          consumedQuantity: '100.000',
          consumedAt: '2026-01-05T10:00:00.000Z',
        },
        {
          productionBatchId: 'batch-2',
          batchNumber: 'BATCH-2026-002',
          productionOrderId: 'order-2',
          orderNumber: 'MO-2026-002',
          consumedQuantity: '50.000',
          consumedAt: '2026-01-06T10:00:00.000Z',
        },
      ]);
      findBatchOutputs.mockResolvedValue([
        {
          productionBatchId: 'batch-1',
          lotId: 'finished-lot-1',
          lotNumber: 'FG-LOT-2026-001',
          itemId: 'item-bread',
          itemCode: 'FG-BREAD',
          itemName: 'Bread Loaf',
          quantity: '150.000',
          qualityStatus: 'RELEASED',
          outputAt: '2026-01-05T12:00:00.000Z',
        },
        {
          productionBatchId: 'batch-1',
          lotId: 'finished-lot-2',
          lotNumber: 'FG-LOT-2026-002',
          itemId: 'item-bread',
          itemCode: 'FG-BREAD',
          itemName: 'Bread Loaf',
          quantity: '20.000',
          qualityStatus: 'QUARANTINED',
          outputAt: '2026-01-05T12:05:00.000Z',
        },
        {
          productionBatchId: 'batch-2',
          lotId: 'finished-lot-3',
          lotNumber: 'FG-LOT-2026-003',
          itemId: 'item-bread',
          itemCode: 'FG-BREAD',
          itemName: 'Bread Loaf',
          quantity: '70.000',
          qualityStatus: 'RELEASED',
          outputAt: '2026-01-06T12:00:00.000Z',
        },
      ]);

      const result = await runInOrganizationA(() =>
        service.getForwardTrace(RAW_LOT_ID),
      );

      expect(findBatchOutputs).toHaveBeenCalledWith(['batch-1', 'batch-2']);
      expect(result.lot.id).toBe(RAW_LOT_ID);
      expect(result.batches).toHaveLength(2);
      expect(result.batches[0].productionBatchId).toBe('batch-1');
      expect(result.batches[0].batchNumber).toBe('BATCH-2026-001');
      expect(result.batches[0].orderNumber).toBe('MO-2026-001');
      expect(result.batches[0].consumedQuantity).toBe('100.000');
      expect(result.batches[0].outputs).toHaveLength(2);
      expect(result.batches[1].productionBatchId).toBe('batch-2');
      expect(result.batches[1].outputs).toHaveLength(1);
      expect(result.batches[1].outputs[0].lotId).toBe('finished-lot-3');
    });

    it('returns no batches when the lot was never consumed', async () => {
      const result = await runInOrganizationA(() =>
        service.getForwardTrace(RAW_LOT_ID),
      );

      expect(findBatchOutputs).toHaveBeenCalledWith([]);
      expect(result.batches).toEqual([]);
    });

    it('returns 404 when the lot belongs to another tenant', async () => {
      findLotWithItem.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getForwardTrace('forged-lot')),
      ).rejects.toBeInstanceOf(LotNotFoundException);
      expect(findConsumingBatches).not.toHaveBeenCalled();
    });
  });

  describe('getReverseTrace', () => {
    it('traces a finished lot to its producing batch and raw lots', async () => {
      findLotWithItem.mockResolvedValue(FINISHED_LOT);
      findProducingBatch.mockResolvedValue({
        productionBatchId: 'batch-1',
        batchNumber: 'BATCH-2026-001',
        productionOrderId: 'order-1',
        orderNumber: 'MO-2026-001',
        outputQuantity: '150.000',
        completedAt: '2026-01-05T12:00:00.000Z',
      });
      findBatchMaterials.mockResolvedValue([
        {
          lotId: RAW_LOT_ID,
          lotNumber: 'RM-LOT-2026-001',
          itemId: 'item-flour',
          itemCode: 'RM-FLOUR',
          itemName: 'Wheat Flour',
          quantity: '100.000',
          isScrap: false,
          consumedAt: '2026-01-05T10:00:00.000Z',
        },
        {
          lotId: 'raw-lot-2',
          lotNumber: 'RM-LOT-2026-002',
          itemId: 'item-yeast',
          itemCode: 'RM-YEAST',
          itemName: 'Yeast',
          quantity: '2.000',
          isScrap: true,
          consumedAt: '2026-01-05T10:05:00.000Z',
        },
      ]);

      const result = await runInOrganizationA(() =>
        service.getReverseTrace(FINISHED_LOT_ID),
      );

      expect(findProducingBatch).toHaveBeenCalledWith(FINISHED_LOT_ID);
      expect(findBatchMaterials).toHaveBeenCalledWith('batch-1');
      expect(result.lot.id).toBe(FINISHED_LOT_ID);
      expect(result.producedBy?.productionBatchId).toBe('batch-1');
      expect(result.producedBy?.batchNumber).toBe('BATCH-2026-001');
      expect(result.producedBy?.outputQuantity).toBe('150.000');
      expect(result.producedBy?.materials).toHaveLength(2);
      expect(result.producedBy?.materials[0].lotId).toBe(RAW_LOT_ID);
      expect(result.producedBy?.materials[1].isScrap).toBe(true);
    });

    it('returns producedBy null for a lot with no producing batch (raw lot)', async () => {
      const result = await runInOrganizationA(() =>
        service.getReverseTrace(RAW_LOT_ID),
      );

      expect(result.producedBy).toBeNull();
      expect(findBatchMaterials).not.toHaveBeenCalled();
    });

    it('returns 404 when the lot belongs to another tenant', async () => {
      findLotWithItem.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.getReverseTrace('forged-lot')),
      ).rejects.toBeInstanceOf(LotNotFoundException);
      expect(findProducingBatch).not.toHaveBeenCalled();
    });
  });
});
