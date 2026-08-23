import { db } from '@/db';
import { userRoles, users } from '@/db/schemas/auth';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthRepository {
  async findUserByEmail(email: string) {
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return userRecords[0];
  }

  async findUserRoleByUserId(userId: string) {
    const roleRecords = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    return roleRecords[0];
  }

  async createUser(data: typeof users.$inferInsert) {
    const newUserRecord = await db.insert(users).values(data).returning();

    return newUserRecord[0];
  }

  async createUserRole(data: typeof userRoles.$inferInsert) {
    await db.insert(userRoles).values(data);
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }
}
