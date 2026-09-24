import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import {
  QUALITY_DEFAULT_PAGE,
  QUALITY_DEFAULT_PAGE_SIZE,
  INSPECTION_CODE_PREFIX,
} from '@rona/config/quality';
import type {
  InspectionAggregateResult,
  InspectionCreateInput,
  InspectionListSearchParamsSchema,
  InspectionListParams,
  InspectionTestCreateInput,
  PaginatedResult,
  TestResultCreateInput,
} from '@rona/types/quality';
import { LotNotFoundException } from '../inventory/inventory.exception';
import { WarehousesRepository } from '../inventory/warehouses.repository';
import {
  InspectionNotFoundException,
  InspectionNumberConflictException,
  InspectionStatusException,
  InspectionTestNotFoundException,
  TestResultConflictException,
} from './quality.exception';
import { InspectionsRepository } from './inspections.repository';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly inspectionsRepository: InspectionsRepository,
    private readonly warehousesRepository: WarehousesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createInspection(input: InspectionCreateInput) {
    const lot = await this.warehousesRepository.findLotById(input.lotId);
    if (!lot) throw new LotNotFoundException();

    const inspectionNumber =
      input.inspectionNumber ?? this.generateInspectionNumber();
    const existing =
      await this.inspectionsRepository.findByInspectionNumber(inspectionNumber);
    if (existing) throw new InspectionNumberConflictException();

    return pooledDb.transaction(async (tx) => {
      const created = await this.inspectionsRepository.create(
        {
          inspectionNumber,
          type: input.type,
          lotId: input.lotId,
          itemId: lot.itemId,
          performedBy: this.tenantContext.userId,
          notes: input.notes,
        },
        tx,
      );
      await this.audit(
        'quality.inspection.create',
        'inspection',
        created.id,
        undefined,
        {
          inspectionNumber,
          type: created.type,
          lotId: created.lotId,
          itemId: created.itemId,
        },
        tx,
      );
      return created;
    });
  }

  async getInspection(inspectionId: string) {
    const inspection = await this.inspectionsRepository.findById(inspectionId);
    if (!inspection) throw new InspectionNotFoundException();
    return inspection;
  }

  async getInspectionTests(inspectionId: string) {
    const inspection = await this.inspectionsRepository.findById(inspectionId);
    if (!inspection) throw new InspectionNotFoundException();
    return this.inspectionsRepository.findTests(inspectionId);
  }

  async listInspections(
    params: InspectionListSearchParamsSchema,
  ): Promise<PaginatedResult<unknown>> {
    const resolved: InspectionListParams = {
      ...params,
      page: params.page ?? QUALITY_DEFAULT_PAGE,
      limit: params.limit ?? QUALITY_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.inspectionsRepository.list(resolved);
    return {
      data: rows,
      pagination: {
        page: resolved.page,
        limit: resolved.limit,
        totalItems: total,
        totalPages: Math.ceil(total / resolved.limit),
      },
    };
  }

  async addTest(inspectionId: string, input: InspectionTestCreateInput) {
    const inspection = await this.inspectionsRepository.findById(inspectionId);
    if (!inspection) throw new InspectionNotFoundException();
    if (inspection.status !== 'IN_PROGRESS') {
      throw new InspectionStatusException(
        'Tests can only be added while the inspection is in progress',
      );
    }

    return pooledDb.transaction(async (tx) => {
      const created = await this.inspectionsRepository.addTest(
        inspectionId,
        input,
        tx,
      );
      await this.audit(
        'quality.inspection.test.create',
        'inspection_test',
        created.id,
        undefined,
        {
          inspectionId,
          name: created.name,
          specification: created.specification,
        },
        tx,
      );
      return created;
    });
  }

  async recordResult(
    inspectionId: string,
    testId: string,
    input: TestResultCreateInput,
  ) {
    const inspection = await this.inspectionsRepository.findById(inspectionId);
    if (!inspection) throw new InspectionNotFoundException();
    if (inspection.status !== 'IN_PROGRESS') {
      throw new InspectionStatusException(
        'Results can only be recorded while the inspection is in progress',
      );
    }

    const test = await this.inspectionsRepository.findTestByInspectionAndId(
      inspectionId,
      testId,
    );
    if (!test) throw new InspectionTestNotFoundException();

    const existingResult =
      await this.inspectionsRepository.findResultByTest(testId);
    if (existingResult) throw new TestResultConflictException();

    return pooledDb.transaction(async (tx) => {
      const created = await this.inspectionsRepository.addResult(
        {
          testId,
          inspectionId,
          result: input.result,
          measuredValue: input.measuredValue,
          notes: input.notes,
          performedBy: this.tenantContext.userId,
        },
        tx,
      );
      await this.audit(
        'quality.inspection.result.create',
        'test_result',
        created.id,
        undefined,
        {
          inspectionId,
          testId,
          result: created.result,
          measuredValue: created.measuredValue,
        },
        tx,
      );
      return created;
    });
  }

  async completeInspection(inspectionId: string, notes?: string) {
    const inspection = await this.inspectionsRepository.findById(inspectionId);
    if (!inspection) throw new InspectionNotFoundException();
    if (inspection.status !== 'IN_PROGRESS') {
      throw new InspectionStatusException(
        'Only in-progress inspections can be completed',
      );
    }

    const tests = await this.inspectionsRepository.findTests(inspectionId);
    if (tests.length === 0) {
      throw new InspectionStatusException(
        'An inspection with no tests cannot be completed',
      );
    }
    const results =
      await this.inspectionsRepository.findResultsByInspection(inspectionId);
    if (results.length !== tests.length) {
      throw new InspectionStatusException(
        'All tests must have results before the inspection can be completed',
      );
    }

    const aggregate = this.computeAggregate(results.map((r) => r.result));

    return pooledDb.transaction(async (tx) => {
      const updated = await this.inspectionsRepository.update(
        inspectionId,
        {
          status: 'COMPLETED',
          completedAt: new Date(),
          notes: notes ?? inspection.notes,
        },
        tx,
      );
      await this.audit(
        'quality.inspection.complete',
        'inspection',
        inspectionId,
        { status: inspection.status },
        { status: updated.status, aggregateResult: aggregate },
        tx,
      );
      return { ...updated, aggregateResult: aggregate };
    });
  }

  private computeAggregate(
    results: Array<'PASS' | 'FAIL'>,
  ): InspectionAggregateResult {
    return results.includes('FAIL') ? 'FAIL' : 'PASS';
  }

  private generateInspectionNumber() {
    return `${INSPECTION_CODE_PREFIX}-${Date.now()}`;
  }

  private audit(
    action: string,
    entityType: string,
    entityId: string,
    before: Record<string, unknown> | undefined,
    after: Record<string, unknown> | undefined,
    tx?: Parameters<Parameters<typeof pooledDb.transaction>[0]>[0],
  ) {
    return this.auditService.record(
      {
        organizationId: this.tenantContext.organizationId,
        action,
        entityType,
        entityId,
        before,
        after,
      },
      tx,
    );
  }
}
