import { Injectable, UnauthorizedException } from '@nestjs/common';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { employees, organizations } from '@/db/schemas/admin';
import { kiosks } from '@/db/schemas/kiosk/kiosk';
import { employeeCredentials, kioskEmployeeGrants, webauthnChallenges } from '@/db/schemas/kiosk/webauthn';
import type { KioskDeviceContext } from './kiosk.service';
import { createHash } from 'node:crypto';

export interface ChallengeBinding {
  organizationId: string;
  purpose: 'registration' | 'authentication';
  actorId?: string;
  employeeId?: string;
  kioskId?: string;
  sessionHash?: string;
}

@Injectable()
export class CredentialRepository {
  transaction<T>(callback: (tx: Executor) => Promise<T>) {
    return pooledDb.transaction(callback);
  }

  async activeOrganization(organizationId: string, tx: Executor) {
    const [row] = await tx.select({ id: organizations.id }).from(organizations)
      .where(and(eq(organizations.id, organizationId), eq(organizations.status, 'active'))).for('share');
    if (!row) throw new UnauthorizedException('WebAuthn authorization failed');
  }

  async activeDevice(context: KioskDeviceContext, tx: Executor) {
    await this.activeOrganization(context.organizationId, tx);
    const [row] = await tx.select().from(kiosks).where(and(
      eq(kiosks.id, context.kioskId), eq(kiosks.organizationId, context.organizationId),
      eq(kiosks.deviceId, context.deviceId), eq(kiosks.status, 'ACTIVE'),
    )).for('share');
    if (!row || createHash('sha256').update(row.tokenHash).digest('hex') !== context.tokenVersion) {
      throw new UnauthorizedException('WebAuthn authorization failed');
    }
  }

  async employee(organizationId: string, employeeId: string, tx: Executor, active = true) {
    const [row] = await tx.select({ id: employees.id, fullName: employees.fullName, eid: employees.eid,
      status: employees.status, archivedAt: employees.archivedAt }).from(employees)
      .where(and(eq(employees.organizationId, organizationId), eq(employees.id, employeeId))).for('update');
    if (!row || (active && (row.status !== 'active' || row.archivedAt))) {
      throw new UnauthorizedException('WebAuthn authorization failed');
    }
    return row;
  }

  async employeeByEid(organizationId: string, eid: string, tx: Executor) {
    const [row] = await tx.select({ id: employees.id }).from(employees).where(and(
      eq(employees.organizationId, organizationId), eq(employees.eid, eid),
      eq(employees.status, 'active'), isNull(employees.archivedAt),
    ));
    if (!row) throw new UnauthorizedException('WebAuthn authorization failed');
    return row;
  }

  async list(organizationId: string, employeeId: string, tx: Executor) {
    return tx.select().from(employeeCredentials).where(and(
      eq(employeeCredentials.organizationId, organizationId), eq(employeeCredentials.employeeId, employeeId),
    ));
  }

  async find(organizationId: string, credentialId: string) {
    const [row] = await pooledDb.select().from(employeeCredentials).where(and(
      eq(employeeCredentials.organizationId, organizationId), eq(employeeCredentials.credentialId, credentialId),
      isNull(employeeCredentials.revokedAt),
    ));
    return row;
  }

  async lockCredential(organizationId: string, employeeId: string, id: string, tx: Executor) {
    const [row] = await tx.select().from(employeeCredentials).where(and(
      eq(employeeCredentials.id, id), eq(employeeCredentials.organizationId, organizationId),
      eq(employeeCredentials.employeeId, employeeId), isNull(employeeCredentials.revokedAt),
    )).for('update');
    if (!row) throw new UnauthorizedException('WebAuthn authorization failed');
    return row;
  }

  async create(data: typeof employeeCredentials.$inferInsert, tx: Executor) {
    const [row] = await tx.insert(employeeCredentials).values(data).onConflictDoNothing().returning();
    if (!row) throw new UnauthorizedException('WebAuthn authorization failed');
    return row;
  }

  async advanceCounter(row: typeof employeeCredentials.$inferSelect, counter: number, backedUp: boolean, deviceType: string, tx: Executor) {
    if (!Number.isInteger(counter) || counter < 0 || counter > 4294967295 ||
      ((row.counter !== 0 || counter !== 0) && counter <= row.counter)) {
      throw new UnauthorizedException('WebAuthn authorization failed');
    }
    const [updated] = await tx.update(employeeCredentials).set({ counter, backedUp, deviceType, lastUsedAt: new Date() })
      .where(and(eq(employeeCredentials.id, row.id), eq(employeeCredentials.organizationId, row.organizationId),
        eq(employeeCredentials.counter, row.counter), isNull(employeeCredentials.revokedAt))).returning({ id: employeeCredentials.id });
    if (!updated) throw new UnauthorizedException('WebAuthn authorization failed');
  }

  async revoke(organizationId: string, employeeId: string, id: string, tx: Executor) {
    const [row] = await tx.update(employeeCredentials).set({ revokedAt: sql`coalesce(${employeeCredentials.revokedAt}, now())` })
      .where(and(eq(employeeCredentials.id, id), eq(employeeCredentials.organizationId, organizationId),
        eq(employeeCredentials.employeeId, employeeId))).returning();
    if (!row) throw new UnauthorizedException('WebAuthn authorization failed');
    return row;
  }

  async createChallenge(data: typeof webauthnChallenges.$inferInsert, tx: Executor) {
    const [row] = await tx.insert(webauthnChallenges).values(data).returning({ id: webauthnChallenges.id });
    return row.id;
  }

  async consumeChallenge(id: string, binding: ChallengeBinding) {
    const [row] = await pooledDb.delete(webauthnChallenges).where(and(
      eq(webauthnChallenges.id, id), eq(webauthnChallenges.organizationId, binding.organizationId),
      eq(webauthnChallenges.purpose, binding.purpose), gt(webauthnChallenges.expiresAt, sql`now()`),
      binding.actorId ? eq(webauthnChallenges.actorId, binding.actorId) : isNull(webauthnChallenges.actorId),
      binding.employeeId ? eq(webauthnChallenges.employeeId, binding.employeeId) : undefined,
      binding.kioskId ? eq(webauthnChallenges.kioskId, binding.kioskId) : isNull(webauthnChallenges.kioskId),
      binding.sessionHash ? eq(webauthnChallenges.sessionHash, binding.sessionHash) : isNull(webauthnChallenges.sessionHash),
    )).returning();
    if (!row) throw new UnauthorizedException('WebAuthn authorization failed');
    return row;
  }

  async createGrant(data: typeof kioskEmployeeGrants.$inferInsert, tx: Executor) {
    await tx.insert(kioskEmployeeGrants).values(data);
  }

  async consumeGrant(tokenHash: string, context: KioskDeviceContext) {
    const [row] = await pooledDb.delete(kioskEmployeeGrants).where(and(
      eq(kioskEmployeeGrants.tokenHash, tokenHash), eq(kioskEmployeeGrants.organizationId, context.organizationId),
      eq(kioskEmployeeGrants.kioskId, context.kioskId), eq(kioskEmployeeGrants.sessionHash, context.sessionHash),
      gt(kioskEmployeeGrants.expiresAt, sql`now()`),
    )).returning();
    if (!row) throw new UnauthorizedException('WebAuthn authorization failed');
    return row;
  }
}
