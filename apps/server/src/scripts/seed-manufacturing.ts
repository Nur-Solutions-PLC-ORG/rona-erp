import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { runWithRequestContext } from '@/context/request-context';
import { AuditRepository } from '@/modules/audit/audit.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { AllocationService } from '@/modules/features/inventory/allocation.service';
import { ItemsRepository } from '@/modules/features/inventory/items.repository';
import { ReservationsRepository } from '@/modules/features/inventory/reservations.repository';
import { ReservationsService } from '@/modules/features/inventory/reservations.service';
import { StockInboundService } from '@/modules/features/inventory/stock-inbound.service';
import { StockLedgerService } from '@/modules/features/inventory/stock-ledger.service';
import { StockRepository } from '@/modules/features/inventory/stock.repository';
import { WarehousesRepository } from '@/modules/features/inventory/warehouses.repository';
import { BomsRepository } from '@/modules/features/manufacturing/boms.repository';
import { BomsService } from '@/modules/features/manufacturing/boms.service';
import { ProductionBatchesRepository } from '@/modules/features/manufacturing/production-batches.repository';
import { ProductionBatchesService } from '@/modules/features/manufacturing/production-batches.service';
import { ProductionMaterialsService } from '@/modules/features/manufacturing/production-materials.service';
import { ProductionMathService } from '@/modules/features/manufacturing/production-math.service';
import { ProductionOrdersRepository } from '@/modules/features/manufacturing/production-orders.repository';
import { ProductionOrdersService } from '@/modules/features/manufacturing/production-orders.service';
import { ProductionOutputService } from '@/modules/features/manufacturing/production-output.service';

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
  const stockInbound = new StockInboundService(
    stockLedger,
    warehousesRepository,
    stockRepository,
    auditService,
    tenantContext,
  );
  const reservationsService = new ReservationsService(
    new ReservationsRepository(tenantContext),
    new AllocationService(stockRepository),
    stockLedger,
    stockRepository,
    auditService,
    tenantContext,
  );
  const bomsRepository = new BomsRepository(tenantContext);
  const ordersRepository = new ProductionOrdersRepository(tenantContext);
  const batchesRepository = new ProductionBatchesRepository(tenantContext);
  const math = new ProductionMathService();
  const bomsService = new BomsService(
    bomsRepository,
    itemsRepository,
    auditService,
    tenantContext,
  );
  const ordersService = new ProductionOrdersService(
    ordersRepository,
    batchesRepository,
    bomsRepository,
    bomsService,
    reservationsService,
    math,
    warehousesRepository,
    auditService,
    tenantContext,
  );
  const batchesService = new ProductionBatchesService(
    batchesRepository,
    ordersRepository,
    auditService,
    tenantContext,
  );
  const materialsService = new ProductionMaterialsService(
    batchesService,
    batchesRepository,
    ordersRepository,
    reservationsService,
    stockInbound,
    stockLedger,
    stockRepository,
    auditService,
    tenantContext,
  );
  const outputService = new ProductionOutputService(
    batchesService,
    batchesRepository,
    stockInbound,
    auditService,
    tenantContext,
  );

  const summary = await runWithRequestContext(
    {
      requestId: `seed-manufacturing-${Date.now()}`,
      userId: membership.userId,
      organizationId: membership.organizationId,
      membershipId: membership.membershipId,
      roles: [],
      permissions: [],
    },
    () =>
      seedManufacturing({
        bomsService,
        ordersService,
        batchesService,
        materialsService,
        outputService,
        bomsRepository,
        ordersRepository,
        batchesRepository,
        itemsRepository,
        warehousesRepository,
      }),
  );

  console.log(
    `Manufacturing seed complete for organization ${membership.organizationId}:`,
  );
  for (const line of summary) {
    console.log(`  - ${line}`);
  }
}

async function seedManufacturing(services: {
  bomsService: BomsService;
  ordersService: ProductionOrdersService;
  batchesService: ProductionBatchesService;
  materialsService: ProductionMaterialsService;
  outputService: ProductionOutputService;
  bomsRepository: BomsRepository;
  ordersRepository: ProductionOrdersRepository;
  batchesRepository: ProductionBatchesRepository;
  itemsRepository: ItemsRepository;
  warehousesRepository: WarehousesRepository;
}): Promise<string[]> {
  const {
    bomsService,
    ordersService,
    batchesService,
    materialsService,
    outputService,
    bomsRepository,
    ordersRepository,
    batchesRepository,
    itemsRepository,
    warehousesRepository,
  } = services;
  const summary: string[] = [];

  const flour = await itemsRepository.findByCode('RM-FLOUR');
  const sugar = await itemsRepository.findByCode('RM-SUGAR');
  const bread = await itemsRepository.findByCode('FG-BREAD');
  const warehouse = await warehousesRepository.findByCode('MAIN');
  if (!flour || !sugar || !bread || !warehouse) {
    throw new Error(
      'Missing prerequisite master data (RM-FLOUR, RM-SUGAR, FG-BREAD, warehouse MAIN). Run `pnpm db:seed:inventory` first.',
    );
  }

  const aisleA = await warehousesRepository.findLocationByCode(
    warehouse.id,
    'AISLE-A-01',
  );
  const aisleB = await warehousesRepository.findLocationByCode(
    warehouse.id,
    'AISLE-B-01',
  );
  const flourLot = await warehousesRepository.findLotByNumber(
    flour.id,
    'LOT-2026-001',
  );
  const sugarLot = await warehousesRepository.findLotByNumber(
    sugar.id,
    'LOT-FG-001',
  );
  if (!aisleA || !aisleB || !flourLot || !sugarLot) {
    throw new Error(
      'Missing prerequisite stock (lots LOT-2026-001 / LOT-FG-001, locations AISLE-A-01 / AISLE-B-01). Run `pnpm db:seed:inventory` first.',
    );
  }

  let bom = await bomsRepository.findByCode('BOM-BREAD');
  if (!bom) {
    const created = await bomsService.createBom({
      code: 'BOM-BREAD',
      name: 'Bread Loaf BOM',
      itemId: bread.id,
      description: 'Standard white bread recipe',
      lines: [
        { componentItemId: flour.id, quantityPerUnit: '0.5' },
        { componentItemId: sugar.id, quantityPerUnit: '0.05' },
      ],
    });
    bom = created.bom;
    summary.push('BOM BOM-BREAD created (version 1 DRAFT)');
  } else {
    summary.push('BOM BOM-BREAD reused');
  }

  let approvedVersion = await bomsRepository.findApprovedVersion(bom.id);
  if (!approvedVersion) {
    const draft = await bomsRepository.findDraftVersion(bom.id);
    if (!draft) {
      throw new Error(
        'BOM BOM-BREAD has neither an approved nor a draft version.',
      );
    }
    approvedVersion = await bomsService.approveVersion(draft.id);
    summary.push(`BOM version ${approvedVersion.version} approved`);
  } else {
    summary.push(`BOM version ${approvedVersion.version} already approved`);
  }

  let order = await ordersRepository.findByOrderNumber('PO-2026-001');
  if (!order) {
    order = await ordersService.createOrder({
      orderNumber: 'PO-2026-001',
      bomId: bom.id,
      warehouseId: warehouse.id,
      plannedQuantity: '100',
      expectedYieldPercent: '95',
      notes: 'Demo seed production order',
    });
    summary.push('Production order PO-2026-001 created');
  } else {
    summary.push(
      `Production order PO-2026-001 reused (status ${order.status})`,
    );
  }

  if (order.status === 'DRAFT' || order.status === 'PLANNED') {
    order = await ordersService.approveOrder(order.id);
    summary.push('Order approved (components reserved)');
  }
  if (order.status === 'APPROVED') {
    order = await ordersService.startOrder(order.id);
    summary.push('Order started');
  }

  if (order.status === 'IN_PROGRESS') {
    const openBatches = await batchesRepository.findOpenByOrder(order.id);
    const batch =
      openBatches[0] ??
      (await batchesService.createBatch(order.id, {
        notes: 'Demo seed batch',
      }));
    summary.push(`Batch ${batch.batchNumber} in progress`);

    const materials = await ordersRepository.findMaterials(order.id);
    const consumeRemaining = async (
      itemId: string,
      lotId: string,
      locationId: string,
      label: string,
    ) => {
      const material = materials.find((row) => row.componentItemId === itemId);
      if (!material) return;
      const remaining =
        Number(material.requiredQuantity) -
        Number(material.consumedQuantity) +
        Number(material.returnedQuantity);
      if (remaining <= 0) {
        summary.push(`${label} fully consumed`);
        return;
      }
      await materialsService.consumeMaterial(batch.id, {
        itemId,
        lotId,
        locationId,
        quantity: remaining.toFixed(4),
      });
      summary.push(`${label} consumed ${remaining.toFixed(4)}`);
    };
    await consumeRemaining(flour.id, flourLot.id, aisleA.id, 'Flour');
    await consumeRemaining(sugar.id, sugarLot.id, aisleB.id, 'Sugar');

    const outputs = await batchesService.getBatchOutputs(batch.id);
    if (outputs.length === 0) {
      await outputService.recordOutput(batch.id, {
        lotNumber: 'FG-LOT-2026-001',
        locationId: aisleB.id,
        quantity: '95',
        unitCost: '2.50',
        notes: 'Demo seed output',
      });
      summary.push(
        'Output 95 x FG-BREAD recorded (lot FG-LOT-2026-001, QUARANTINED)',
      );
    } else {
      summary.push('Output already recorded');
    }

    await batchesService.completeBatch(batch.id);
    order = await ordersService.completeOrder(order.id);
    summary.push(
      `Batch completed; order completed (actual yield ${order.actualYieldPercent}%)`,
    );
  } else if (order.status === 'COMPLETED') {
    summary.push('Order already completed');
  }

  return summary;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
