import { and, asc, eq, ilike, notInArray, or } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { organizations, organizationSettings } from '@/db/schemas/admin';
import { userRoles, users } from '@/db/schemas/auth';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';

@Injectable()
export class OrganizationRepository extends TenantScopedRepository {
  async findCurrentOrganization() {
    const [row] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, this.organizationId))
      .limit(1);
    return row;
  }

  async findSettings() {
    const [row] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, this.organizationId))
      .limit(1);
    return row;
  }

  async updateOrganization(
    data: Partial<typeof organizations.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(organizations)
      .set(data)
      .where(eq(organizations.id, this.organizationId))
      .returning();
    return row;
  }

  async findMembershipById(membershipId: string) {
    const [row] = await db
      .select({
        id: organizationMemberships.id,
        organizationId: organizationMemberships.organizationId,
        userId: organizationMemberships.userId,
        status: organizationMemberships.status,
        createdAt: organizationMemberships.createdAt,
        updatedAt: organizationMemberships.updatedAt,
        userFullName: users.fullName,
        userEmail: users.email,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(
        and(
          eq(organizationMemberships.id, membershipId),
          eq(organizationMemberships.organizationId, this.organizationId),
        ),
      )
      .limit(1);
    return row;
  }

  async findMembershipByUser(userId: string) {
    const [row] = await db
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, this.organizationId),
        ),
      )
      .limit(1);
    return row;
  }

  async listMemberships() {
    return db
      .select({
        id: organizationMemberships.id,
        organizationId: organizationMemberships.organizationId,
        userId: organizationMemberships.userId,
        status: organizationMemberships.status,
        createdAt: organizationMemberships.createdAt,
        updatedAt: organizationMemberships.updatedAt,
        userFullName: users.fullName,
        userEmail: users.email,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(eq(organizationMemberships.organizationId, this.organizationId))
      .orderBy(asc(organizationMemberships.createdAt));
  }

  async createMembership(
    userId: string,
    status: 'active' | 'invited' | 'suspended',
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(organizationMemberships)
      .values({
        organizationId: this.organizationId,
        userId,
        status,
      })
      .onConflictDoNothing()
      .returning();
    return row;
  }

  async updateMembership(
    membershipId: string,
    data: Partial<typeof organizationMemberships.$inferInsert>,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(organizationMemberships)
      .set(data)
      .where(
        and(
          eq(organizationMemberships.id, membershipId),
          eq(organizationMemberships.organizationId, this.organizationId),
        ),
      )
      .returning();
    return row;
  }

  async deleteMembership(membershipId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const rows = await executor
      .delete(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.id, membershipId),
          eq(organizationMemberships.organizationId, this.organizationId),
        ),
      )
      .returning();
    return rows.length > 0;
  }

  async findUserById(userId: string) {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row;
  }

  async findUserByEmail(email: string) {
    const [row] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row;
  }

  async findTelegramChatIdByEmail(email: string) {
    const [row] = await db
      .select({ telegramChatId: users.telegramChatId })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row?.telegramChatId ?? undefined;
  }

  async createUserWithRole(
    data: typeof users.$inferInsert,
    role: Omit<typeof userRoles.$inferInsert, 'userId'>,
  ) {
    return pooledDb.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values(data)
        .returning({ id: users.id });
      await tx.insert(userRoles).values({ ...role, userId: created.id });
      return created.id;
    });
  }

  async searchCandidateUsers(searchQuery: string, limit = 20) {
    const pattern = `%${searchQuery}%`;
    return db
      .select({ id: users.id, fullName: users.fullName, email: users.email })
      .from(users)
      .where(
        and(
          or(ilike(users.fullName, pattern), ilike(users.email, pattern)),
          notInArray(
            users.id,
            db
              .select({ id: organizationMemberships.userId })
              .from(organizationMemberships)
              .where(
                eq(organizationMemberships.organizationId, this.organizationId),
              ),
          ),
        ),
      )
      .orderBy(asc(users.fullName))
      .limit(limit);
  }
}
