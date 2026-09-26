import { db } from '@/db';
import { authCodes, userRoles, users } from '@/db/schemas/auth';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

export type AuthCodePurpose = 'login' | 'reset';

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

  async updateUserMustChangePassword(
    userId: string,
    mustChangePassword: boolean,
  ) {
    await db
      .update(users)
      .set({ mustChangePassword })
      .where(eq(users.id, userId));
  }

  async saveCode(
    email: string,
    purpose: AuthCodePurpose,
    code: string,
    expiresAt: Date,
    telegramToken?: string,
  ) {
    await db
      .insert(authCodes)
      .values({ email, purpose, code, expiresAt, telegramToken })
      .onConflictDoUpdate({
        target: [authCodes.email, authCodes.purpose],
        set: {
          code,
          expiresAt,
          telegramToken,
          createdAt: new Date(),
        },
      });
  }

  async getCode(email: string, purpose: AuthCodePurpose) {
    const records = await db
      .select()
      .from(authCodes)
      .where(and(eq(authCodes.email, email), eq(authCodes.purpose, purpose)))
      .limit(1);

    const record = records[0];
    if (!record) return undefined;

    if (record.expiresAt.getTime() < Date.now()) {
      await this.deleteCode(email, purpose);
      return undefined;
    }

    return record.code;
  }

  async deleteCode(email: string, purpose: AuthCodePurpose) {
    await db
      .delete(authCodes)
      .where(and(eq(authCodes.email, email), eq(authCodes.purpose, purpose)));
  }

  async findCodeByTelegramToken(
    token: string,
  ): Promise<typeof authCodes.$inferSelect | undefined> {
    const rows = await db
      .select()
      .from(authCodes)
      .where(eq(authCodes.telegramToken, token))
      .limit(1);
    return rows[0];
  }

  async claimCodeChat(token: string, chatId: string) {
    await db
      .update(authCodes)
      .set({ telegramChatId: chatId })
      .where(eq(authCodes.telegramToken, token));
  }

  async bindUserTelegram(email: string, chatId: string) {
    await db
      .update(users)
      .set({ telegramChatId: chatId })
      .where(eq(users.email, email));
  }

  async findTelegramChatIdByEmail(email: string) {
    const rows = await db
      .select({ telegramChatId: users.telegramChatId })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return rows[0]?.telegramChatId ?? undefined;
  }
}
