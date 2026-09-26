import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { WarehousesRepository } from '../inventory/warehouses.repository';
import {
  InspectionAlreadyReviewedException,
  InspectionNotFoundException,
  InspectionResultConflictException,
  InspectionStatusException,
  LotNotQuarantinedException,
} from './quality.exception';
import { DecisionsRepository } from './decisions.repository';
import { InspectionsRepository } from './inspections.repository';

@Injectable()
export class QualityReviewsService {
  constructor(
    private readonly inspectionsRepository: InspectionsRepository,
    private readonly decisionsRepository: DecisionsRepository,
    private readonly warehousesRepository: WarehousesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async release(inspectionId: string, notes?: string) {
    return this.review(inspectionId, 'RELEASE', notes);
  }

  async reject(inspectionId: string, notes?: string) {
    return this.review(inspectionId, 'REJECT', notes);
  }

  private async review(
    inspectionId: string,
    decision: 'RELEASE' | 'REJECT',
    notes?: string,
  ) {
    return pooledDb.transaction(async (tx) => {
      const inspection = await this.inspectionsRepository.findByIdForUpdate(
        inspectionId,
        tx,
      );
      if (!inspection) throw new InspectionNotFoundException();
      if (inspection.status !== 'COMPLETED') {
        throw new InspectionStatusException(
          'Only completed inspections can be reviewed',
        );
      }

      const existingReview =
        await this.decisionsRepository.findReviewByInspection(inspectionId);
      if (existingReview) throw new InspectionAlreadyReviewedException();

      const results =
        await this.inspectionsRepository.findResultsByInspection(inspectionId);
      const aggregate = this.computeAggregate(results.map((r) => r.result));

      if (decision === 'RELEASE' && aggregate === 'FAIL') {
        throw new InspectionResultConflictException();
      }

      const lot = await this.warehousesRepository.findLotById(inspection.lotId);
      if (!lot) {
        throw new InspectionStatusException(
          'The inspected lot no longer exists',
        );
      }
      if (lot.qualityStatus !== 'QUARANTINED') {
        throw new LotNotQuarantinedException(lot.qualityStatus);
      }

      const review = await this.decisionsRepository.createReview(
        {
          inspectionId,
          decision,
          reviewedBy: this.tenantContext.userId,
          notes,
        },
        tx,
      );

      const targetStatus = decision === 'RELEASE' ? 'RELEASED' : 'REJECTED';
      const updatedLot = await this.warehousesRepository.updateLot(
        lot.id,
        { qualityStatus: targetStatus },
        tx,
      );

      const releaseDecision =
        await this.decisionsRepository.createReleaseDecision(
          {
            lotId: lot.id,
            inspectionId,
            decision,
            decidedBy: this.tenantContext.userId,
            notes,
          },
          tx,
        );

      const updatedInspection = await this.inspectionsRepository.update(
        inspectionId,
        { status: 'REVIEWED', reviewedAt: new Date() },
        tx,
      );

      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'quality.inspection.review',
          entityType: 'inspection',
          entityId: inspectionId,
          before: { status: inspection.status },
          after: {
            status: updatedInspection.status,
            decision,
            aggregateResult: aggregate,
            lotId: lot.id,
            lotQualityStatusBefore: lot.qualityStatus,
            lotQualityStatusAfter: updatedLot.qualityStatus,
          },
        },
        tx,
      );

      return {
        review,
        releaseDecision,
        inspection: updatedInspection,
        lot: updatedLot,
        aggregateResult: aggregate,
      };
    });
  }

  private computeAggregate(results: Array<'PASS' | 'FAIL'>): 'PASS' | 'FAIL' {
    return results.includes('FAIL') ? 'FAIL' : 'PASS';
  }
}
