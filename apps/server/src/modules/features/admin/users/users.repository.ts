import { db, pooledDb } from '@/db';
import { userRoles, users } from '@/db/schemas/auth';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  ne,
  or,
  type SQL,
} from 'drizzle-orm';
import type { UserListSearchParamsSchema } from '@rona/types/admin';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

const userColumns = getTableColumns(users);

@Injectable()
export class UsersRepository {
  async findMany(params: UserListSearchParamsSchema) {
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = this.listConditions(params);
    const where = conditions.length ? and(...conditions) : undefined;

    const [records, totalResult] = await Promise.all([
      db
        .select({
          user: userColumns,
          role: {
            position: userRoles.position,
            modules: userRoles.module,
          },
        })
        .from(users)
        .innerJoin(userRoles, eq(userRoles.userId, users.id))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(users)
        .innerJoin(userRoles, eq(userRoles.userId, users.id))
        .where(where),
    ]);

    return { records, total: totalResult[0]?.total ?? 0 };
  }

  async findById(id: string) {
    const records = await db
      .select({
        user: userColumns,
        role: {
          position: userRoles.position,
          modules: userRoles.module,
        },
      })
      .from(users)
      .innerJoin(userRoles, eq(userRoles.userId, users.id))
      .where(eq(users.id, id))
      .limit(1);

    return records[0];
  }

  async findByEmail(email: string) {
    const records = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return records[0];
  }

  async findByEmailExceptId(email: string, id: string) {
    const records = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, id)))
      .limit(1);

    return records[0];
  }

  async create(
    data: typeof users.$inferInsert,
    role: Omit<typeof userRoles.$inferInsert, 'userId'>,
  ) {
    return pooledDb.transaction(async (tx) => {
      const createdUsers = await tx
        .insert(users)
        .values(data)
        .returning({ id: users.id });
      const user = createdUsers[0];

      await tx.insert(userRoles).values({ ...role, userId: user.id });
      return user.id;
    });
  }

  async update(
    id: string,
    data: Partial<typeof users.$inferInsert>,
    role?: Pick<typeof userRoles.$inferInsert, 'position' | 'module'>,
  ) {
    return pooledDb.transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        const updatedUsers = await tx
          .update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning({ id: users.id });

        if (!updatedUsers[0]) return false;
      }

      if (role) {
        await tx.update(userRoles).set(role).where(eq(userRoles.userId, id));
      }
      return true;
    });
  }

  async delete(id: string) {
    const deletedUsers = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return Boolean(deletedUsers[0]);
  }

  async findMembership(userId: string, organizationId: string) {
    const records = await db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      )
      .limit(1);

    return records[0];
  }

  async createMembership(userId: string, organizationId: string) {
    const inserted = await db
      .insert(organizationMemberships)
      .values({ userId, organizationId, status: 'active' })
      .onConflictDoNothing()
      .returning();

    if (inserted[0]) return inserted[0];

    return this.findMembership(userId, organizationId);
  }

  async deleteMembership(userId: string, organizationId: string) {
    await db
      .delete(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      );
  }

  private listConditions(params: UserListSearchParamsSchema): SQL[] {
    const conditions: SQL[] = [];

    if (params.orgId) conditions.push(eq(users.organizationId, params.orgId));
    if (params.status) conditions.push(eq(users.status, params.status));
    if (params.position)
      conditions.push(eq(userRoles.position, params.position));
    if (params.searchQuery) {
      const searchQuery = `%${params.searchQuery}%`;
      conditions.push(
        or(
          ilike(users.fullName, searchQuery),
          ilike(users.email, searchQuery),
        )!,
      );
    }

    return conditions;
  }
}
