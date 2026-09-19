import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import type { Executor } from '@/db/executor';
import { employeeWebAuthnCredentials } from '@/db/schemas/kiosk';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';

export interface WebAuthnCredentialRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface WebAuthnCredentialInsert {
  organizationId: string;
  employeeId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType: string;
}

@Injectable()
export class WebAuthnCredentialRepository extends TenantScopedRepository {
  async listForEmployee(
    organizationId: string,
    employeeId: string,
  ): Promise<WebAuthnCredentialRecord[]> {
    return db
      .select()
      .from(employeeWebAuthnCredentials)
      .where(
        and(
          eq(employeeWebAuthnCredentials.organizationId, organizationId),
          eq(employeeWebAuthnCredentials.employeeId, employeeId),
        ),
      )
      .orderBy(desc(employeeWebAuthnCredentials.createdAt));
  }

  async listActiveCredentialIds(
    organizationId: string,
    employeeId: string,
  ): Promise<{ credentialId: string }[]> {
    return db
      .select({ credentialId: employeeWebAuthnCredentials.credentialId })
      .from(employeeWebAuthnCredentials)
      .where(
        and(
          eq(employeeWebAuthnCredentials.organizationId, organizationId),
          eq(employeeWebAuthnCredentials.employeeId, employeeId),
          isNull(employeeWebAuthnCredentials.revokedAt),
        ),
      );
  }

  async findActiveByCredentialId(
    organizationId: string,
    credentialId: string,
  ): Promise<WebAuthnCredentialRecord | undefined> {
    const [row] = await db
      .select()
      .from(employeeWebAuthnCredentials)
      .where(
        and(
          eq(employeeWebAuthnCredentials.organizationId, organizationId),
          eq(employeeWebAuthnCredentials.credentialId, credentialId),
          isNull(employeeWebAuthnCredentials.revokedAt),
        ),
      )
      .limit(1);
    return row;
  }

  async insert(
    data: WebAuthnCredentialInsert,
    tx: Executor,
  ): Promise<WebAuthnCredentialRecord> {
    const [row] = await tx
      .insert(employeeWebAuthnCredentials)
      .values(data)
      .returning();
    return row;
  }

  async updateCounter(
    organizationId: string,
    credentialId: string,
    counter: number,
  ): Promise<WebAuthnCredentialRecord | undefined> {
    const [row] = await db
      .update(employeeWebAuthnCredentials)
      .set({ counter, lastUsedAt: new Date() })
      .where(
        and(
          eq(employeeWebAuthnCredentials.organizationId, organizationId),
          eq(employeeWebAuthnCredentials.credentialId, credentialId),
          isNull(employeeWebAuthnCredentials.revokedAt),
        ),
      )
      .returning();
    return row;
  }

  async revokeByCredentialId(
    organizationId: string,
    credentialId: string,
  ): Promise<WebAuthnCredentialRecord[] | null> {
    const rows = await db
      .update(employeeWebAuthnCredentials)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(employeeWebAuthnCredentials.organizationId, organizationId),
          eq(employeeWebAuthnCredentials.credentialId, credentialId),
          isNull(employeeWebAuthnCredentials.revokedAt),
        ),
      )
      .returning();
    return rows.length > 0 ? rows : null;
  }
}
