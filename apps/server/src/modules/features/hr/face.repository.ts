import { and, desc, eq, isNull } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { employees } from '@/db/schemas/admin';
import { employeeFaces } from '@/db/schemas/kiosk';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';

@Injectable()
export class FaceRepository extends TenantScopedRepository {
  async list(employeeId: string) {
    return db
      .select()
      .from(employeeFaces)
      .where(
        this.tenantScope(
          employeeFaces,
          eq(employeeFaces.employeeId, employeeId),
        ),
      )
      .orderBy(desc(employeeFaces.enrolledAt));
  }

  async getById(faceId: string, employeeId: string) {
    const [row] = await db
      .select()
      .from(employeeFaces)
      .where(
        this.tenantScope(
          employeeFaces,
          eq(employeeFaces.id, faceId),
          eq(employeeFaces.employeeId, employeeId),
        ),
      )
      .limit(1);
    return row;
  }

  async findActiveById(faceId: string) {
    const [row] = await db
      .select({
        id: employeeFaces.id,
        organizationId: employeeFaces.organizationId,
        employeeId: employeeFaces.employeeId,
        descriptor: employeeFaces.descriptor,
        enrolledAt: employeeFaces.enrolledAt,
        lastUsedAt: employeeFaces.lastUsedAt,
        revokedAt: employeeFaces.revokedAt,
        employeeFullName: employees.fullName,
        employeeStatus: employees.status,
        employeeArchivedAt: employees.archivedAt,
      })
      .from(employeeFaces)
      .innerJoin(
        employees,
        and(
          eq(employees.id, employeeFaces.employeeId),
          eq(employees.organizationId, employeeFaces.organizationId),
        ),
      )
      .where(
        and(
          eq(employeeFaces.id, faceId),
          isNull(employeeFaces.revokedAt),
        ),
      )
      .orderBy(desc(employeeFaces.enrolledAt))
      .limit(1);
    return row;
  }

  async listDescriptorsByOrganization(organizationId: string) {
    return db
      .select({
        id: employeeFaces.id,
        descriptor: employeeFaces.descriptor,
      })
      .from(employeeFaces)
      .where(
        and(
          eq(employeeFaces.organizationId, organizationId),
          isNull(employeeFaces.revokedAt),
        ),
      );
  }

  async insertEnrollment(
    data: {
      organizationId: string;
      employeeId: string;
      descriptor: string;
    },
    tx: Executor,
  ) {
    const [row] = await tx.insert(employeeFaces).values(data).returning();
    return row;
  }

  async revokeExisting(employeeId: string, tx: Executor) {
    await tx
      .update(employeeFaces)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(employeeFaces.organizationId, this.organizationId),
          eq(employeeFaces.employeeId, employeeId),
          isNull(employeeFaces.revokedAt),
        ),
      );
  }

  async revoke(faceId: string, employeeId: string, tx: Executor) {
    const [row] = await tx
      .update(employeeFaces)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(employeeFaces.organizationId, this.organizationId),
          eq(employeeFaces.id, faceId),
          eq(employeeFaces.employeeId, employeeId),
          isNull(employeeFaces.revokedAt),
        ),
      )
      .returning();
    return row;
  }

  async markUsed(faceId: string) {
    await db
      .update(employeeFaces)
      .set({ lastUsedAt: new Date() })
      .where(
        and(eq(employeeFaces.id, faceId), isNull(employeeFaces.revokedAt)),
      );
  }
}