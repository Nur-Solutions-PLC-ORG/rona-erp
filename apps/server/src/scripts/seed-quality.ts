import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { runWithRequestContext } from '@/context/request-context';
import { AuditRepository } from '@/modules/audit/audit.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { ItemsRepository } from '@/modules/features/inventory/items.repository';
import { WarehousesRepository } from '@/modules/features/inventory/warehouses.repository';
import { DecisionsRepository } from '@/modules/features/quality/decisions.repository';
import { InspectionsRepository } from '@/modules/features/quality/inspections.repository';
import { InspectionsService } from '@/modules/features/quality/inspections.service';
import { QualityReviewsService } from '@/modules/features/quality/quality-reviews.service';

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
  const inspectionsRepository = new InspectionsRepository(tenantContext);
  const decisionsRepository = new DecisionsRepository(tenantContext);
  const auditService = new AuditService(new AuditRepository());
  const inspectionsService = new InspectionsService(
    inspectionsRepository,
    warehousesRepository,
    auditService,
    tenantContext,
  );
  const reviewsService = new QualityReviewsService(
    inspectionsRepository,
    decisionsRepository,
    warehousesRepository,
    auditService,
    tenantContext,
  );

  const summary = await runWithRequestContext(
    {
      requestId: `seed-quality-${Date.now()}`,
      userId: membership.userId,
      organizationId: membership.organizationId,
      membershipId: membership.membershipId,
      roles: [],
      permissions: [],
    },
    () =>
      seedQuality({
        inspectionsService,
        reviewsService,
        inspectionsRepository,
        itemsRepository,
        warehousesRepository,
      }),
  );

  console.log(
    `Quality seed complete for organization ${membership.organizationId}:`,
  );
  for (const line of summary) {
    console.log(`  - ${line}`);
  }
}

async function seedQuality(services: {
  inspectionsService: InspectionsService;
  reviewsService: QualityReviewsService;
  inspectionsRepository: InspectionsRepository;
  itemsRepository: ItemsRepository;
  warehousesRepository: WarehousesRepository;
}): Promise<string[]> {
  const {
    inspectionsService,
    reviewsService,
    inspectionsRepository,
    itemsRepository,
    warehousesRepository,
  } = services;
  const summary: string[] = [];
  const inspectionNumber = 'INSP-2026-001';

  const bread = await itemsRepository.findByCode('FG-BREAD');
  if (!bread) {
    throw new Error(
      'Missing prerequisite master data (FG-BREAD). Run `pnpm db:seed:inventory` first.',
    );
  }
  const lot = await warehousesRepository.findLotByNumber(
    bread.id,
    'FG-LOT-2026-001',
  );
  if (!lot) {
    throw new Error(
      'Missing prerequisite lot FG-LOT-2026-001. Run `pnpm db:seed:manufacturing` first.',
    );
  }

  let inspection =
    await inspectionsRepository.findByInspectionNumber(inspectionNumber);
  if (!inspection) {
    inspection = await inspectionsService.createInspection({
      lotId: lot.id,
      type: 'FINISHED_GOOD',
      inspectionNumber,
      notes: 'Demo seed finished-goods inspection',
    });
    summary.push(`Inspection ${inspectionNumber} created (IN_PROGRESS)`);
  } else {
    summary.push(
      `Inspection ${inspectionNumber} reused (status ${inspection.status})`,
    );
  }

  if (inspection.status === 'IN_PROGRESS') {
    const demoTests = [
      {
        name: 'Net weight check',
        specification: '700-750 g per loaf',
        method: 'Scale measurement',
        result: 'PASS' as const,
        measuredValue: '712.5',
      },
      {
        name: 'Visual inspection',
        specification: 'No burns or deformations',
        method: 'Visual check',
        result: 'PASS' as const,
        measuredValue: undefined,
      },
    ];

    const existingTests = await inspectionsRepository.findTests(inspection.id);
    const existingResults = await inspectionsRepository.findResultsByInspection(
      inspection.id,
    );
    const recordedTestIds = new Set(existingResults.map((r) => r.testId));

    for (const demo of demoTests) {
      let test = existingTests.find((t) => t.name === demo.name);
      if (!test) {
        test = await inspectionsService.addTest(inspection.id, {
          name: demo.name,
          specification: demo.specification,
          method: demo.method,
        });
        summary.push(`Test "${demo.name}" added`);
      }
      if (!recordedTestIds.has(test.id)) {
        await inspectionsService.recordResult(inspection.id, test.id, {
          result: demo.result,
          measuredValue: demo.measuredValue,
        });
        summary.push(`Result ${demo.result} recorded for "${demo.name}"`);
      }
    }

    inspection = {
      ...inspection,
      ...(await inspectionsService.completeInspection(inspection.id)),
    };
    summary.push(`Inspection ${inspectionNumber} completed (aggregate PASS)`);
  } else if (inspection.status === 'COMPLETED') {
    summary.push('Inspection already completed');
  }

  if (inspection.status === 'COMPLETED') {
    const outcome = await reviewsService.release(
      inspection.id,
      'Demo seed release',
    );
    summary.push(
      `QA review RELEASE; lot FG-LOT-2026-001 is now ${outcome.lot.qualityStatus}`,
    );
  } else if (inspection.status === 'REVIEWED') {
    summary.push('Inspection already reviewed');
  }

  return summary;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
