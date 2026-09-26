import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  AdjustStockInput,
  IssueStockInput,
  ReceiveStockInput,
  ReturnStockInput,
  TransferStockInput,
} from '@rona/types/inventory';
import type { AllocationService } from './allocation.service';
import { InsufficientStockException } from './inventory.exception';
import type { StockLedgerService } from './stock-ledger.service';
import { StockInboundService } from './stock-inbound.service';
import { StockOutboundService } from './stock-outbound.service';
import type { StockRepository } from './stock.repository';
import type { WarehousesRepository } from './warehouses.repository';

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

const ITEM_ID = 'item-1';
const WAREHOUSE_ID = 'warehouse-1';
const TO_WAREHOUSE_ID = 'warehouse-2';
const LOCATION_ID = 'location-1';
const TO_LOCATION_ID = 'location-2';
const LOT_ID = 'lot-1';
const QUANTITY = '30';

const loadItemForUpdate = jest.fn();
const loadLocationInWarehouse = jest.fn();
const loadActiveWarehouse = jest.fn();
const loadLotForItem = jest.fn();
const applyBalanceDelta = jest.fn();
const consumeAllocations = jest.fn();
const ledger = {
  loadItemForUpdate,
  loadLocationInWarehouse,
  loadActiveWarehouse,
  loadLotForItem,
  applyBalanceDelta,
  consumeAllocations,
} as unknown as StockLedgerService;

const findLotByNumber = jest.fn();
const createLot = jest.fn();
const warehousesRepository = {
  findLotByNumber,
  createLot,
} as unknown as WarehousesRepository;

const insertMovement = jest.fn();
const findLockedBalance = jest.fn();
const stockRepository = {
  insertMovement,
  findLockedBalance,
} as unknown as StockRepository;

const allocateFromWarehouse = jest.fn();
const allocationService = {
  allocateFromWarehouse,
} as unknown as AllocationService;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const inboundService = new StockInboundService(
  ledger,
  warehousesRepository,
  stockRepository,
  auditService,
  new TenantContextService(),
);

const outboundService = new StockOutboundService(
  ledger,
  allocationService,
  stockRepository,
  auditService,
  new TenantContextService(),
);

const mockTx = { sentinel: 'tx' };

const MOVEMENT = {
  id: 'movement-1',
  type: 'RECEIPT',
  itemId: ITEM_ID,
  lotId: LOT_ID,
  quantity: QUANTITY,
};

const BALANCE = { id: 'balance-1', quantity: '150.0000' };

async function runInOrganizationA<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['WAREHOUSE_MANAGER'],
      permissions: [],
    },
    callback,
  );
}

describe('StockInboundService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    loadItemForUpdate.mockResolvedValue(undefined);
    loadLocationInWarehouse.mockResolvedValue(undefined);
    loadActiveWarehouse.mockResolvedValue(undefined);
    loadLotForItem.mockResolvedValue(undefined);
    applyBalanceDelta.mockResolvedValue(BALANCE);
    consumeAllocations.mockResolvedValue([MOVEMENT]);

    findLotByNumber.mockResolvedValue(undefined);
    createLot.mockResolvedValue({ id: LOT_ID, lotNumber: 'LOT-001' });

    insertMovement.mockResolvedValue(MOVEMENT);
    findLockedBalance.mockResolvedValue(undefined);

    allocateFromWarehouse.mockResolvedValue([
      { lotId: LOT_ID, locationId: LOCATION_ID, quantity: QUANTITY },
    ]);

    auditRecord.mockResolvedValue(undefined);
  });

  describe('receiveStock', () => {
    const input: ReceiveStockInput = {
      itemId: ITEM_ID,
      warehouseId: WAREHOUSE_ID,
      locationId: LOCATION_ID,
      quantity: QUANTITY,
      lotNumber: 'LOT-001',
    };

    it('creates a new APPROVED lot when none exists and records a RECEIPT in one transaction', async () => {
      const result = await runInOrganizationA(() =>
        inboundService.receiveStock(input),
      );

      expect(loadItemForUpdate).toHaveBeenCalledWith(ITEM_ID, mockTx);
      expect(createLot).toHaveBeenCalledWith(
        ITEM_ID,
        expect.objectContaining({
          lotNumber: 'LOT-001',
          qualityStatus: 'APPROVED',
        }),
        mockTx,
      );
      expect(insertMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RECEIPT',
          itemId: ITEM_ID,
          lotId: LOT_ID,
          toLocationId: LOCATION_ID,
          quantity: QUANTITY,
        }),
        mockTx,
      );
      expect(applyBalanceDelta).toHaveBeenCalledWith(
        ITEM_ID,
        LOT_ID,
        LOCATION_ID,
        QUANTITY,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.stock.receive',
          entityType: 'stock_balance',
          entityId: 'balance-1',
        }),
        mockTx,
      );
      expect(result.movements).toHaveLength(1);
      expect(result.allocations).toEqual([
        { lotId: LOT_ID, locationId: LOCATION_ID, quantity: QUANTITY },
      ]);
    });

    it('reuses an existing lot instead of creating a duplicate', async () => {
      findLotByNumber.mockResolvedValue({ id: LOT_ID, lotNumber: 'LOT-001' });

      await runInOrganizationA(() => inboundService.receiveStock(input));

      expect(findLotByNumber).toHaveBeenCalledWith(ITEM_ID, 'LOT-001');
      expect(createLot).not.toHaveBeenCalled();
      expect(insertMovement).toHaveBeenCalledWith(
        expect.objectContaining({ lotId: LOT_ID }),
        mockTx,
      );
    });
  });

  describe('returnStock', () => {
    it('records a RETURN movement for an explicit lot and audits it', async () => {
      const input: ReturnStockInput = {
        itemId: ITEM_ID,
        warehouseId: WAREHOUSE_ID,
        locationId: LOCATION_ID,
        lotId: LOT_ID,
        quantity: QUANTITY,
        reason: 'Unused production material',
      };

      await runInOrganizationA(() => inboundService.returnStock(input));

      expect(loadLotForItem).toHaveBeenCalledWith(LOT_ID, ITEM_ID);
      expect(insertMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RETURN',
          itemId: ITEM_ID,
          lotId: LOT_ID,
          toLocationId: LOCATION_ID,
          notes: 'Unused production material',
        }),
        mockTx,
      );
      expect(applyBalanceDelta).toHaveBeenCalledWith(
        ITEM_ID,
        LOT_ID,
        LOCATION_ID,
        QUANTITY,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.stock.return',
        }),
        mockTx,
      );
    });
  });
});

describe('StockOutboundService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    loadItemForUpdate.mockResolvedValue(undefined);
    loadLocationInWarehouse.mockResolvedValue(undefined);
    loadActiveWarehouse.mockResolvedValue(undefined);
    loadLotForItem.mockResolvedValue(undefined);
    applyBalanceDelta.mockResolvedValue(BALANCE);
    consumeAllocations.mockResolvedValue([MOVEMENT]);

    findLotByNumber.mockResolvedValue(undefined);
    createLot.mockResolvedValue({ id: LOT_ID, lotNumber: 'LOT-001' });

    insertMovement.mockResolvedValue(MOVEMENT);
    findLockedBalance.mockResolvedValue({
      itemId: ITEM_ID,
      lotId: LOT_ID,
      locationId: LOCATION_ID,
      quantity: '100.0000',
      reservedQuantity: '0.0000',
    });

    allocateFromWarehouse.mockResolvedValue([
      { lotId: LOT_ID, locationId: LOCATION_ID, quantity: QUANTITY },
    ]);

    auditRecord.mockResolvedValue(undefined);
  });

  describe('issueStock', () => {
    const input: IssueStockInput = {
      itemId: ITEM_ID,
      warehouseId: WAREHOUSE_ID,
      quantity: QUANTITY,
    };

    it('allocates lots then consumes them with ISSUE movements in one transaction', async () => {
      const result = await runInOrganizationA(() =>
        outboundService.issueStock(input),
      );

      expect(allocateFromWarehouse).toHaveBeenCalledWith(
        ITEM_ID,
        WAREHOUSE_ID,
        QUANTITY,
        'FIFO',
        mockTx,
      );
      expect(consumeAllocations).toHaveBeenCalledWith(
        {
          type: 'ISSUE',
          itemId: ITEM_ID,
          reference: null,
          notes: null,
        },
        [{ lotId: LOT_ID, locationId: LOCATION_ID, quantity: QUANTITY }],
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.stock.issue',
          entityType: 'stock_balance',
          entityId: ITEM_ID,
        }),
        mockTx,
      );
      expect(result.movements).toHaveLength(1);
    });

    it('propagates insufficient stock and writes no movement or audit record', async () => {
      allocateFromWarehouse.mockRejectedValue(
        new InsufficientStockException('0.0000', QUANTITY),
      );

      await expect(
        runInOrganizationA(() => outboundService.issueStock(input)),
      ).rejects.toBeInstanceOf(InsufficientStockException);

      expect(consumeAllocations).not.toHaveBeenCalled();
      expect(insertMovement).not.toHaveBeenCalled();
      expect(auditRecord).not.toHaveBeenCalled();
    });
  });

  describe('transferStock', () => {
    it('moves quantity from the allocated source location to the destination', async () => {
      const input: TransferStockInput = {
        itemId: ITEM_ID,
        fromWarehouseId: WAREHOUSE_ID,
        toWarehouseId: TO_WAREHOUSE_ID,
        toLocationId: TO_LOCATION_ID,
        quantity: QUANTITY,
      };

      await runInOrganizationA(() => outboundService.transferStock(input));

      expect(insertMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSFER',
          itemId: ITEM_ID,
          lotId: LOT_ID,
          fromLocationId: LOCATION_ID,
          toLocationId: TO_LOCATION_ID,
          quantity: QUANTITY,
        }),
        mockTx,
      );
      expect(applyBalanceDelta).toHaveBeenCalledWith(
        ITEM_ID,
        LOT_ID,
        LOCATION_ID,
        `-${QUANTITY}`,
        mockTx,
      );
      expect(applyBalanceDelta).toHaveBeenCalledWith(
        ITEM_ID,
        LOT_ID,
        TO_LOCATION_ID,
        QUANTITY,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.stock.transfer',
        }),
        mockTx,
      );
    });
  });

  describe('adjustStock', () => {
    it('records a signed adjustment with before/after audit context', async () => {
      const input: AdjustStockInput = {
        itemId: ITEM_ID,
        warehouseId: WAREHOUSE_ID,
        locationId: LOCATION_ID,
        lotId: LOT_ID,
        quantityDelta: '-5',
        reason: 'Cycle count correction',
      };

      await runInOrganizationA(() => outboundService.adjustStock(input));

      expect(insertMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADJUSTMENT',
          itemId: ITEM_ID,
          lotId: LOT_ID,
          fromLocationId: LOCATION_ID,
          toLocationId: null,
          quantity: '5',
          notes: 'Cycle count correction',
        }),
        mockTx,
      );
      expect(applyBalanceDelta).toHaveBeenCalledWith(
        ITEM_ID,
        LOT_ID,
        LOCATION_ID,
        '-5',
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.stock.adjust',
          before: { quantity: '100.0000' },
          after: {
            itemId: ITEM_ID,
            lotId: LOT_ID,
            locationId: LOCATION_ID,
            quantity: '150.0000',
            reason: 'Cycle count correction',
          },
        }),
        mockTx,
      );
    });
  });
});
