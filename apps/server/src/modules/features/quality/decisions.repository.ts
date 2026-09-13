import { desc, eq } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { qaReviews, releaseDecisions } from '@/db/schemas/quality/reviews';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';

@Injectable()
export class DecisionsRepository extends TenantScopedRepository {

  async createReview(
    data: {
      inspectionId: string;
      decision: 'RELEASE' | 'REJECT';
      reviewedBy?: string | null;
      notes?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(qaReviews)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findReviewByInspection(inspectionId: string) {
    const [row] = await db
      .select()
      .from(qaReviews)
      .where(
        this.tenantScope(qaReviews, eq(qaReviews.inspectionId, inspectionId)),
      )
      .limit(1);
    return row;
  }

  async createReleaseDecision(
    data: {
      lotId: string;
      inspectionId: string;
      decision: 'RELEASE' | 'REJECT';
      decidedBy?: string | null;
      notes?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(releaseDecisions)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findReleaseDecisionsByLot(lotId: string) {
    return db
      .select()
      .from(releaseDecisions)
      .where(
        this.tenantScope(releaseDecisions, eq(releaseDecisions.lotId, lotId)),
      )
      .orderBy(desc(releaseDecisions.createdAt));
  }
}
