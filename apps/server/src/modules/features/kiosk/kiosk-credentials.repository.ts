import { asc, eq, gt, isNull, sql, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import {
  employeeBiometricTemplates,
  employeeCards,
  kiosks,
} from '@/db/schemas/kiosk';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { KioskTemplateKind } from '@rona/types/kiosk';

// Biometric templates and cards of the current tenant.
@Injectable()
export class KioskCredentialsRepository extends TenantScopedRepository {
  async insertTemplate(
    data: Omit<
      typeof employeeBiometricTemplates.$inferInsert,
      'id' | 'organizationId'
    >,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(employeeBiometricTemplates)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  /** Revokes the active template for the same employee/kind/finger. */
  async revokeActiveTemplates(
    employeeId: string,
    kind: KioskTemplateKind,
    fingerIndex: number | null,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    return executor
      .update(employeeBiometricTemplates)
      .set({ revokedAt: new Date() })
      .where(
        this.tenantScope(
          employeeBiometricTemplates,
          eq(employeeBiometricTemplates.employeeId, employeeId),
          eq(employeeBiometricTemplates.kind, kind),
          sql`coalesce(${employeeBiometricTemplates.fingerIndex}, -1) = ${fingerIndex ?? -1}`,
          isNull(employeeBiometricTemplates.revokedAt),
        ),
      )
      .returning({ id: employeeBiometricTemplates.id });
  }

  async findTemplateById(templateId: string) {
    const [row] = await db
      .select()
      .from(employeeBiometricTemplates)
      .where(
        this.tenantScope(
          employeeBiometricTemplates,
          eq(employeeBiometricTemplates.id, templateId),
        ),
      )
      .limit(1);
    return row;
  }

  async revokeTemplate(templateId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(employeeBiometricTemplates)
      .set({ revokedAt: new Date() })
      .where(
        this.tenantScope(
          employeeBiometricTemplates,
          eq(employeeBiometricTemplates.id, templateId),
          isNull(employeeBiometricTemplates.revokedAt),
        ),
      )
      .returning();
    return row;
  }

  /** Without `since`: active templates only. With `since`: every change after it. */
  async listTemplatesSince(since?: Date) {
    const conditions: SQL[] = since
      ? [gt(employeeBiometricTemplates.updatedAt, since)]
      : [isNull(employeeBiometricTemplates.revokedAt)];
    return db
      .select()
      .from(employeeBiometricTemplates)
      .where(this.tenantScope(employeeBiometricTemplates, ...conditions))
      .orderBy(asc(employeeBiometricTemplates.updatedAt));
  }

  async listTemplatesForEmployee(employeeId: string) {
    return db
      .select({
        id: employeeBiometricTemplates.id,
        employeeId: employeeBiometricTemplates.employeeId,
        kind: employeeBiometricTemplates.kind,
        fingerIndex: employeeBiometricTemplates.fingerIndex,
        algorithmVersion: employeeBiometricTemplates.algorithmVersion,
        enrolledByKioskId: employeeBiometricTemplates.enrolledByKioskId,
        enrolledByKioskName: kiosks.name,
        enrolledByUserId: employeeBiometricTemplates.enrolledByUserId,
        consentAt: employeeBiometricTemplates.consentAt,
        createdAt: employeeBiometricTemplates.createdAt,
        revokedAt: employeeBiometricTemplates.revokedAt,
      })
      .from(employeeBiometricTemplates)
      .leftJoin(
        kiosks,
        eq(kiosks.id, employeeBiometricTemplates.enrolledByKioskId),
      )
      .where(
        this.tenantScope(
          employeeBiometricTemplates,
          eq(employeeBiometricTemplates.employeeId, employeeId),
        ),
      )
      .orderBy(asc(employeeBiometricTemplates.createdAt));
  }

  async findActiveCardByHash(uidHash: string) {
    const [row] = await db
      .select()
      .from(employeeCards)
      .where(
        this.tenantScope(
          employeeCards,
          eq(employeeCards.uidHash, uidHash),
          isNull(employeeCards.revokedAt),
        ),
      )
      .limit(1);
    return row;
  }

  async insertCard(
    data: Omit<typeof employeeCards.$inferInsert, 'id' | 'organizationId'>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(employeeCards)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findCardById(cardId: string) {
    const [row] = await db
      .select()
      .from(employeeCards)
      .where(this.tenantScope(employeeCards, eq(employeeCards.id, cardId)))
      .limit(1);
    return row;
  }

  async revokeCard(cardId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(employeeCards)
      .set({ revokedAt: new Date() })
      .where(
        this.tenantScope(
          employeeCards,
          eq(employeeCards.id, cardId),
          isNull(employeeCards.revokedAt),
        ),
      )
      .returning();
    return row;
  }

  async listCardsSince(since?: Date) {
    const conditions: SQL[] = since
      ? [gt(employeeCards.updatedAt, since)]
      : [isNull(employeeCards.revokedAt)];
    return db
      .select()
      .from(employeeCards)
      .where(this.tenantScope(employeeCards, ...conditions))
      .orderBy(asc(employeeCards.updatedAt));
  }

  async listCardsForEmployee(employeeId: string) {
    return db
      .select()
      .from(employeeCards)
      .where(
        this.tenantScope(
          employeeCards,
          eq(employeeCards.employeeId, employeeId),
        ),
      )
      .orderBy(asc(employeeCards.createdAt));
  }
}
