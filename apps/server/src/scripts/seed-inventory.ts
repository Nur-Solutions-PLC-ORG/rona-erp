import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { runWithRequestContext } from '@/context/request-context';
import type { ItemCreateInput, ReceiveStockInput } from '@rona/types/inventory';
import { AuditRepository } from '@/modules/audit/audit.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { ItemsRepository } from '@/modules/features/inventory/items.repository';
import { ItemsService } from '@/modules/features/inventory/items.service';
import { StockInboundService } from '@/modules/features/inventory/stock-inbound.service';
import { StockLedgerService } from '@/modules/features/inventory/stock-ledger.service';
import { StockRepository } from '@/modules/features/inventory/stock.repository';
import { WarehousesRepository } from '@/modules/features/inventory/warehouses.repository';
import { WarehousesService } from '@/modules/features/inventory/warehouses.service';

async function main() {
  const targetOrgId = process.env.SEED_ORGANIZATION_ID;

  const [membership] = await db
    .select({
      organizationId: organizationMemberships.organizationId,
      userId: organizationMemberships.userId,
      membershipId: organizationMemberships.id,
    })
    .from(organizationMemberships)
    .where(
      targetOrgId
        ? and(
            eq(organizationMemberships.status, 'active'),
            eq(organizationMemberships.organizationId, targetOrgId),
          )
        : eq(organizationMemberships.status, 'active'),
    )
    .limit(1);

  if (!membership) {
    throw new Error(
      targetOrgId
        ? `No active membership found for organization ${targetOrgId}.`
        : 'No active organization membership found. Create an organization with an owner membership first, or set SEED_ORGANIZATION_ID.',
    );
  }

  const tenantContext = new TenantContextService();
  const itemsRepository = new ItemsRepository(tenantContext);
  const warehousesRepository = new WarehousesRepository(tenantContext);
  const stockRepository = new StockRepository(tenantContext);
  const auditService = new AuditService(new AuditRepository());
  const stockLedger = new StockLedgerService(
    itemsRepository,
    warehousesRepository,
    stockRepository,
  );
  const itemsService = new ItemsService(
    itemsRepository,
    auditService,
    tenantContext,
  );
  const warehousesService = new WarehousesService(
    warehousesRepository,
    itemsRepository,
    auditService,
    tenantContext,
  );
  const inboundService = new StockInboundService(
    stockLedger,
    warehousesRepository,
    stockRepository,
    auditService,
    tenantContext,
  );

  const summary = await runWithRequestContext(
    {
      requestId: `seed-inventory-${Date.now()}`,
      userId: membership.userId,
      organizationId: membership.organizationId,
      membershipId: membership.membershipId,
      roles: [],
      permissions: [],
    },
    () =>
      seedInventory(itemsService, warehousesService, inboundService, {
        itemsRepository,
        warehousesRepository,
      }),
  );

  console.log(
    `Inventory seed complete for organization ${membership.organizationId}:`,
  );
  for (const line of summary) {
    console.log(`  - ${line}`);
  }
}

async function seedInventory(
  itemsService: ItemsService,
  warehousesService: WarehousesService,
  inboundService: StockInboundService,
  repositories: {
    itemsRepository: ItemsRepository;
    warehousesRepository: WarehousesRepository;
  },
): Promise<string[]> {
  const { itemsRepository, warehousesRepository } = repositories;
  const summary: string[] = [];

  const kg = await itemsService.createUnitOfMeasure({
    code: 'KG',
    name: 'Kilogram',
  });
  const pcs = await itemsService.createUnitOfMeasure({
    code: 'PCS',
    name: 'Pieces',
  });
  await itemsService.createUnitOfMeasure({ code: 'L', name: 'Litre' });
  summary.push('Units of measure: KG, PCS, L');

  let warehouse = await warehousesRepository.findByCode('MAIN');
  if (!warehouse) {
    warehouse = await warehousesService.createWarehouse({
      code: 'MAIN',
      name: 'Main Warehouse',
      address: 'Addis Ababa, Ethiopia',
      isActive: true,
    });
    summary.push('Warehouse MAIN created');
  } else {
    summary.push('Warehouse MAIN reused');
  }

  const ensureLocation = async (code: string, name: string) => {
    const existing = await warehousesRepository.findLocationByCode(
      warehouse.id,
      code,
    );
    if (existing) return existing;
    return warehousesService.createLocation({
      warehouseId: warehouse.id,
      code,
      name,
      isActive: true,
    });
  };
  const aisleA = await ensureLocation('AISLE-A-01', 'Aisle A Bin 01');
  const aisleB = await ensureLocation('AISLE-B-01', 'Aisle B Bin 01');
  await ensureLocation('RECEIVING', 'Receiving Dock');
  summary.push('Locations: AISLE-A-01, AISLE-B-01, RECEIVING');

  const ensureItem = async (input: ItemCreateInput) => {
    const existing = await itemsRepository.findByCode(input.code);
    if (existing) return existing;
    const created = await itemsService.createItem(input);
    summary.push(`Item ${input.code} created`);
    return created;
  };

  const flour = await ensureItem({
    code: 'RM-FLOUR',
    name: 'Wheat Flour',
    description: 'Premium wheat flour for bakery production',
    type: 'RAW_MATERIAL',
    unitOfMeasureId: kg.id,
    reorderPoint: '100',
    reorderQuantity: '500',
  });
  const sugar = await ensureItem({
    code: 'RM-SUGAR',
    name: 'White Sugar',
    type: 'RAW_MATERIAL',
    unitOfMeasureId: kg.id,
    reorderPoint: '50',
    reorderQuantity: '250',
  });
  await ensureItem({
    code: 'FG-BREAD',
    name: 'Bread Loaf',
    type: 'FINISHED_GOOD',
    unitOfMeasureId: pcs.id,
    reorderPoint: '20',
    reorderQuantity: '100',
  });

  const ensureReceipt = async (
    input: ReceiveStockInput,
    approve: boolean,
  ): Promise<string> => {
    const existingLot = await warehousesRepository.findLotByNumber(
      input.itemId,
      input.lotNumber,
    );
    if (existingLot) {
      return `Lot ${input.lotNumber} reused (status ${existingLot.qualityStatus})`;
    }

    const result = await inboundService.receiveStock(input);
    const lotId = result.allocations[0]?.lotId;
    if (!lotId)
      throw new Error(`Receipt of ${input.lotNumber} allocated no lot`);

    if (approve) {
      await warehousesService.updateLotQualityStatus(lotId, {
        qualityStatus: 'APPROVED',
      });
    }
    const lot = await warehousesService.getLot(lotId);
    return `Lot ${input.lotNumber} received ${input.quantity} (status ${lot.qualityStatus})`;
  };

  const dayMs = 24 * 60 * 60 * 1000;
  summary.push(
    await ensureReceipt(
      {
        itemId: flour.id,
        warehouseId: warehouse.id,
        locationId: aisleA.id,
        quantity: '500',
        unitCost: '1.20',
        lotNumber: 'LOT-2026-001',
        supplier: 'Ethio Grain Co.',
        manufactureDate: new Date(Date.now() - 10 * dayMs),
        expiryDate: new Date(Date.now() + 180 * dayMs),
        reference: 'PO-2026-001',
        notes: 'Demo seed receipt',
      },
      true,
    ),
  );
  summary.push(
    await ensureReceipt(
      {
        itemId: flour.id,
        warehouseId: warehouse.id,
        locationId: aisleA.id,
        quantity: '200',
        lotNumber: 'LOT-2025-090',
        supplier: 'Old Mill Ltd.',
        expiryDate: new Date(Date.now() - 5 * dayMs),
        reference: 'PO-2025-090',
      },
      true,
    ),
  );
  summary.push(
    await ensureReceipt(
      {
        itemId: sugar.id,
        warehouseId: warehouse.id,
        locationId: aisleA.id,
        quantity: '300',
        unitCost: '0.95',
        lotNumber: 'LOT-2026-010',
        supplier: 'Sugar plc',
        reference: 'PO-2026-010',
      },
      false,
    ),
  );
  summary.push(
    await ensureReceipt(
      {
        itemId: sugar.id,
        warehouseId: warehouse.id,
        locationId: aisleB.id,
        quantity: '150',
        lotNumber: 'LOT-FG-001',
        reference: 'DEMO-FG',
      },
      true,
    ),
  );

  return summary;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
