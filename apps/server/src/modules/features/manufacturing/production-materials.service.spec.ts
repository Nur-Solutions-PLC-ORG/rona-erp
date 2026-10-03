import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { MaterialConsumptionInput } from '@rona/types/manufacturing';
import type { ReservationsService } from '../inventory/reservations.service';
import type { StockInboundService } from '../inventory/stock-inbound.service';
import type { StockLedgerService } from '../inventory/stock-ledger.service';
import type { StockRepository } from '../inventory/stock.repository';
import {
  ConsumptionExceedsReservationException,
  MaterialNotInOrderException,
  ReturnExceedsConsumptionException,
} from './manufacturing.exception';
import type { ProductionBatchesRepository } from './production-batches.repository';
import type { ProductionBatchesService } from './production-batches.service';
import type { ProductionOrdersRepository } from './production-orders.repository';
import { ProductionMaterialsService } from './production-materials.service';

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
const ITEM_ID = 'item-rm';
const SUBSTITUTED_ID = 'item-original';
const LOT_ID = 'lot-1';
const LOCATION_ID = 'location-1';
const WAREHOUSE_ID = 'warehouse-1';

const ORDER = {
  id: ORDER_ID,
  organizationId: ORG_A,
  orderNumber: 'PO-2026-001',
  warehouseId: WAREHOUSE_ID,
};

const MATERIAL = {
  id: 'material-1',
  componentItemId: SUBSTITUTED_ID,
  requiredQuantity: '50.0000',
  consumedQuantity: '0.0000',
  returnedQuantity: '0.0000',
  reservationId: 'reservation-1',
};

const loadOpenBatchWithOrder = jest.fn();
const batchesService = {
  loadOpenBatchWithOrder,
} as unknown as ProductionBatchesService;

const createConsumption = jest.fn();
const createReturn = jest.fn();
const batchesRepository = {
  createConsumption,
  createReturn,
} as unknown as ProductionBatchesRepository;

const findMaterialByItem = jest.fn();
const updateMaterial = jest.fn();
const ordersRepository = {
  findMaterialByItem,
  updateMaterial,
} as unknown as ProductionOrdersRepository;

const consumeReservationFromLot = jest.fn();
const reservationsService = {
  consumeReservationFromLot,
} as unknown as ReservationsService;

const returnStockInTx = jest.fn();
const stockInbound = {
  returnStockInTx,
} as unknown as StockInboundService;

const loadItemForUpdate = jest.fn();
const loadLotForItem = jest.fn();
const loadLocationInWarehouse = jest.fn();
const applyBalanceDelta = jest.fn();
const stockLedger = {
  loadItemForUpdate,
  loadLotForItem,
  loadLocationInWarehouse,
  applyBalanceDelta,
} as unknown as StockLedgerService;

const insertMovement = jest.fn();
const stockRepository = {
  insertMovement,
} as unknown as StockRepository;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new ProductionMaterialsService(
  batchesService,
  batchesRepository,
  ordersRepository,
  reservationsService,
  stockInbound,
  stockLedger,
  stockRepository,
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

describe('ProductionMaterialsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    loadOpenBatchWithOrder.mockResolvedValue({
      batch: { id: BATCH_ID, status: 'IN_PROGRESS' },
      order: ORDER,
    });
    findMaterialByItem.mockResolvedValue(MATERIAL);
    updateMaterial.mockResolvedValue(MATERIAL);
    createConsumption.mockResolvedValue({ id: 'consumption-1' });
    createReturn.mockResolvedValue({ id: 'return-1' });
    consumeReservationFromLot.mockResolvedValue('50.0000');
    insertMovement.mockResolvedValue({ id: 'movement-1' });
    loadItemForUpdate.mockResolvedValue(undefined);
    loadLotForItem.mockResolvedValue(undefined);
    loadLocationInWarehouse.mockResolvedValue(undefined);
    applyBalanceDelta.mockResolvedValue(undefined);
    returnStockInTx.mockResolvedValue({
      movements: [{ id: 'movement-return-1' }],
    });
    auditRecord.mockResolvedValue(undefined);
  });

  describe('consumeMaterial', () => {
    const input: MaterialConsumptionInput = {
      itemId: SUBSTITUTED_ID,
      lotId: LOT_ID,
      locationId: LOCATION_ID,
      quantity: '10',
    };

    it('consumes from the reservation, writes an ISSUE movement and updates counters in one transaction', async () => {
      const result = await runInOrganizationA(() =>
        service.consumeMaterial(BATCH_ID, input),
      );

      expect(consumeReservationFromLot).toHaveBeenCalledWith(
        'reservation-1',
        LOT_ID,
        LOCATION_ID,
        '10',
        mockTx,
      );
      expect(insertMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ISSUE',
          itemId: SUBSTITUTED_ID,
          quantity: '10',
          reference: 'PO-2026-001',
        }),
        mockTx,
      );
      expect(applyBalanceDelta).toHaveBeenCalledWith(
        SUBSTITUTED_ID,
        LOT_ID,
        LOCATION_ID,
        '-10',
        mockTx,
      );
      expect(updateMaterial).toHaveBeenCalledWith(
        'material-1',
        { consumedQuantity: '10.0000' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.material.consume',
        }),
        mockTx,
      );
      expect(result).toEqual({ id: 'consumption-1' });
    });

    it('resolves a substituted item to the replaced order material', async () => {
      findMaterialByItem
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(MATERIAL);

      await runInOrganizationA(() =>
        service.consumeMaterial(BATCH_ID, {
          ...input,
          itemId: ITEM_ID,
          substitutedForItemId: SUBSTITUTED_ID,
        }),
      );

      expect(findMaterialByItem).toHaveBeenNthCalledWith(1, ORDER_ID, ITEM_ID);
      expect(findMaterialByItem).toHaveBeenNthCalledWith(
        2,
        ORDER_ID,
        SUBSTITUTED_ID,
      );
      expect(createConsumption).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: ITEM_ID,
          substitutedForItemId: SUBSTITUTED_ID,
        }),
        mockTx,
      );
    });

    it('rejects consumption that exceeds the required quantity', async () => {
      await expect(
        runInOrganizationA(() =>
          service.consumeMaterial(BATCH_ID, {
            ...input,
            quantity: '51',
          }),
        ),
      ).rejects.toBeInstanceOf(ConsumptionExceedsReservationException);

      expect(createConsumption).not.toHaveBeenCalled();
      expect(applyBalanceDelta).not.toHaveBeenCalled();
    });

    it('rejects an item that is not part of the order', async () => {
      findMaterialByItem.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.consumeMaterial(BATCH_ID, input)),
      ).rejects.toBeInstanceOf(MaterialNotInOrderException);
    });
  });

  describe('returnMaterial', () => {
    it('returns stock via the inbound service and updates counters', async () => {
      findMaterialByItem.mockResolvedValue({
        ...MATERIAL,
        consumedQuantity: '50.0000',
      });

      await runInOrganizationA(() =>
        service.returnMaterial(BATCH_ID, {
          itemId: SUBSTITUTED_ID,
          lotId: LOT_ID,
          locationId: LOCATION_ID,
          quantity: '5',
          reason: 'UNUSED',
        }),
      );

      expect(returnStockInTx).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: SUBSTITUTED_ID,
          warehouseId: WAREHOUSE_ID,
          quantity: '5',
          reason: 'UNUSED',
        }),
        mockTx,
      );
      expect(updateMaterial).toHaveBeenCalledWith(
        'material-1',
        { returnedQuantity: '5.0000' },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'manufacturing.material.return',
        }),
        mockTx,
      );
    });

    it('rejects a return that exceeds the consumed quantity', async () => {
      findMaterialByItem.mockResolvedValue({
        ...MATERIAL,
        consumedQuantity: '10.0000',
        returnedQuantity: '8.0000',
      });

      await expect(
        runInOrganizationA(() =>
          service.returnMaterial(BATCH_ID, {
            itemId: SUBSTITUTED_ID,
            lotId: LOT_ID,
            locationId: LOCATION_ID,
            quantity: '3',
            reason: 'UNUSED',
          }),
        ),
      ).rejects.toBeInstanceOf(ReturnExceedsConsumptionException);

      expect(returnStockInTx).not.toHaveBeenCalled();
    });
  });
});
