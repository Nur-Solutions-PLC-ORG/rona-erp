import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  ReservationCreateSchema,
  ReservationListSearchParamsSchema,
} from '@rona/types/inventory';
import type { AllocationService } from './allocation.service';
import {
  InsufficientStockException,
  ReservationNotActiveException,
  ReservationNotFoundException,
} from './inventory.exception';
import type { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';
import type { StockLedgerService } from './stock-ledger.service';
import type { StockRepository } from './stock.repository';

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
const LOCATION_ID = 'location-1';
const LOT_ID = 'lot-1';
const QUANTITY = '30';

const loadItemForUpdate = jest.fn();
const loadActiveWarehouse = jest.fn();
const consumeAllocations = jest.fn();
const stockLedger = {
  loadItemForUpdate,
  loadActiveWarehouse,
  consumeAllocations,
} as unknown as StockLedgerService;

const lockBalancesForReservation = jest.fn();
const adjustReserved = jest.fn();
const stockRepository = {
  lockBalancesForReservation,
  adjustReserved,
} as unknown as StockRepository;

const allocateFromWarehouse = jest.fn();
const allocationService = {
  allocateFromWarehouse,
} as unknown as AllocationService;

const create = jest.fn();
const findByIdForUpdate = jest.fn();
const findById = jest.fn();
const update = jest.fn();
const list = jest.fn();
const reservationsRepository = {
  create,
  findByIdForUpdate,
  findById,
  update,
  list,
} as unknown as ReservationsRepository;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new ReservationsService(
  reservationsRepository,
  allocationService,
  stockLedger,
  stockRepository,
  auditService,
  new TenantContextService(),
);

const mockTx = { sentinel: 'tx' };

const ALLOCATIONS = [
  { lotId: LOT_ID, locationId: LOCATION_ID, quantity: QUANTITY },
];

const ACTIVE_RESERVATION = {
  id: 'reservation-1',
  organizationId: ORG_A,
  itemId: ITEM_ID,
  warehouseId: WAREHOUSE_ID,
  quantity: QUANTITY,
  status: 'ACTIVE',
  allocatedLots: ALLOCATIONS,
  reference: 'RES-001',
  notes: null,
  createdBy: USER_A,
};

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

describe('ReservationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    loadItemForUpdate.mockResolvedValue(undefined);
    loadActiveWarehouse.mockResolvedValue(undefined);
    consumeAllocations.mockResolvedValue([]);

    allocateFromWarehouse.mockResolvedValue(ALLOCATIONS);

    lockBalancesForReservation.mockResolvedValue([
      {
        itemId: ITEM_ID,
        lotId: LOT_ID,
        locationId: LOCATION_ID,
        quantity: '100.0000',
        reservedQuantity: '0.0000',
      },
    ]);

    create.mockResolvedValue(ACTIVE_RESERVATION);
    findByIdForUpdate.mockResolvedValue(ACTIVE_RESERVATION);
    findById.mockResolvedValue(ACTIVE_RESERVATION);
    update.mockResolvedValue(ACTIVE_RESERVATION);
    list.mockResolvedValue({ rows: [ACTIVE_RESERVATION], total: 1 });

    adjustReserved.mockResolvedValue(undefined);
    auditRecord.mockResolvedValue(undefined);
  });

  describe('createReservation', () => {
    const input: ReservationCreateSchema = {
      itemId: ITEM_ID,
      warehouseId: WAREHOUSE_ID,
      quantity: QUANTITY,
    };

    it('locks balances, verifies availability and increments reserved quantity in one transaction', async () => {
      const result = await runInOrganizationA(() =>
        service.createReservation(input),
      );

      expect(allocateFromWarehouse).toHaveBeenCalledWith(
        ITEM_ID,
        WAREHOUSE_ID,
        QUANTITY,
        'FIFO',
        mockTx,
      );
      expect(lockBalancesForReservation).toHaveBeenCalledWith(
        ALLOCATIONS,
        ITEM_ID,
        mockTx,
      );
      expect(create).toHaveBeenCalledWith(
        {
          itemId: ITEM_ID,
          warehouseId: WAREHOUSE_ID,
          quantity: QUANTITY,
          allocatedLots: ALLOCATIONS,
          reference: null,
          notes: null,
        },
        mockTx,
      );
      expect(adjustReserved).toHaveBeenCalledWith(
        LOT_ID,
        LOCATION_ID,
        QUANTITY,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.reservation.create',
          entityType: 'reservation',
          entityId: 'reservation-1',
        }),
        mockTx,
      );
      expect(result.reservation).toEqual(ACTIVE_RESERVATION);
    });

    it('rejects oversubscription when active reservations already cover the stock', async () => {
      lockBalancesForReservation.mockResolvedValue([
        {
          itemId: ITEM_ID,
          lotId: LOT_ID,
          locationId: LOCATION_ID,
          quantity: '100.0000',
          reservedQuantity: '80.0000',
        },
      ]);

      await expect(
        runInOrganizationA(() => service.createReservation(input)),
      ).rejects.toBeInstanceOf(InsufficientStockException);

      expect(create).not.toHaveBeenCalled();
      expect(adjustReserved).not.toHaveBeenCalled();
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('fails safely when a balance row vanishes between allocation and locking', async () => {
      lockBalancesForReservation.mockResolvedValue([]);

      await expect(
        runInOrganizationA(() => service.createReservation(input)),
      ).rejects.toBeInstanceOf(ReservationNotFoundException);
    });
  });

  describe('releaseReservation', () => {
    it('marks the reservation RELEASED and decrements reserved quantity', async () => {
      await runInOrganizationA(() =>
        service.releaseReservation('reservation-1'),
      );

      expect(update).toHaveBeenCalledWith(
        'reservation-1',
        { status: 'RELEASED' },
        mockTx,
      );
      expect(adjustReserved).toHaveBeenCalledWith(
        LOT_ID,
        LOCATION_ID,
        `-${QUANTITY}`,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.reservation.release',
          entityType: 'reservation',
          entityId: 'reservation-1',
          before: { status: 'ACTIVE' },
          after: { status: 'RELEASED' },
        }),
        mockTx,
      );
    });

    it('rejects releasing a non-ACTIVE reservation', async () => {
      findByIdForUpdate.mockResolvedValue({
        ...ACTIVE_RESERVATION,
        status: 'CONSUMED',
      });

      await expect(
        runInOrganizationA(() => service.releaseReservation('reservation-1')),
      ).rejects.toBeInstanceOf(ReservationNotActiveException);
    });
  });

  describe('consumeReservation', () => {
    it('writes ISSUE movements, marks the reservation CONSUMED and decrements reserved quantity', async () => {
      await runInOrganizationA(() =>
        service.consumeReservation('reservation-1'),
      );

      expect(consumeAllocations).toHaveBeenCalledWith(
        {
          type: 'ISSUE',
          itemId: ITEM_ID,
          reference: 'RES-001',
          notes: 'Consumed reservation reservation-1',
        },
        ALLOCATIONS,
        mockTx,
      );
      expect(update).toHaveBeenCalledWith(
        'reservation-1',
        { status: 'CONSUMED' },
        mockTx,
      );
      expect(adjustReserved).toHaveBeenCalledWith(
        LOT_ID,
        LOCATION_ID,
        `-${QUANTITY}`,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'inventory.reservation.consume',
          before: { status: 'ACTIVE' },
          after: { status: 'CONSUMED' },
        }),
        mockTx,
      );
    });

    it('rejects consuming a non-ACTIVE reservation', async () => {
      findByIdForUpdate.mockResolvedValue({
        ...ACTIVE_RESERVATION,
        status: 'RELEASED',
      });

      await expect(
        runInOrganizationA(() => service.consumeReservation('reservation-1')),
      ).rejects.toBeInstanceOf(ReservationNotActiveException);
      expect(consumeAllocations).not.toHaveBeenCalled();
    });
  });

  describe('queries', () => {
    it('resolves pagination defaults for the reservation list', async () => {
      const params: ReservationListSearchParamsSchema = {
        status: 'ACTIVE',
      };

      const result = await runInOrganizationA(() =>
        service.listReservations(params),
      );

      expect(list).toHaveBeenCalledWith({
        status: 'ACTIVE',
        page: 1,
        limit: 25,
      });
      expect(result.pagination.totalItems).toBe(1);
    });

    it('throws ReservationNotFoundException for a reservation outside the organization', async () => {
      findById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.getReservation('reservation-other-org'),
        ),
      ).rejects.toBeInstanceOf(ReservationNotFoundException);
    });
  });
});
