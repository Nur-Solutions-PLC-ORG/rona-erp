import { asc, count, desc, eq, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import { users } from '@/db/schemas/auth';
import { commissionRecords, commissionRules } from '@/db/schemas/sales';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type { Executor } from '@/db/executor';
import type {
  CommissionRecordListParams,
  CommissionRuleCreateInput,
  CommissionRuleListParams,
  CommissionRuleUpdateInput,
} from '@rona/types/sales';

@Injectable()
export class CommissionRepository extends TenantScopedRepository {
  async createRule(data: CommissionRuleCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(commissionRules)
      .values({
        organizationId: this.organizationId,
        name: data.name,
        salespersonUserId: data.salespersonUserId,
        commissionPercent: data.commissionPercent,
        itemId: data.itemId ?? null,
        itemCategory: data.itemCategory ?? null,
        minimumMarginPercent: data.minimumMarginPercent ?? null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return row;
  }

  async listRules(params: CommissionRuleListParams) {
    const conditions: SQL[] = [];

    if (params.salespersonUserId) {
      conditions.push(
        eq(commissionRules.salespersonUserId, params.salespersonUserId),
      );
    }
    if (params.active === 'true' || params.active === 'false') {
      conditions.push(eq(commissionRules.isActive, params.active === 'true'));
    }

    const where = this.tenantScope(commissionRules, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        rule: commissionRules,
        salespersonName: users.fullName,
      })
      .from(commissionRules)
      .leftJoin(users, eq(users.id, commissionRules.salespersonUserId))
      .where(where)
      .orderBy(asc(commissionRules.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(commissionRules)
      .where(where);

    return {
      rows: rows.map((row) => ({
        ...row.rule,
        salespersonName: row.salespersonName,
      })),
      total: Number(total),
    };
  }

  async findRule(id: string) {
    const [row] = await db
      .select({
        rule: commissionRules,
        salespersonName: users.fullName,
      })
      .from(commissionRules)
      .leftJoin(users, eq(users.id, commissionRules.salespersonUserId))
      .where(this.tenantScope(commissionRules, eq(commissionRules.id, id)))
      .limit(1);

    return row ? { ...row.rule, salespersonName: row.salespersonName } : null;
  }

  async updateRule(id: string, data: CommissionRuleUpdateInput) {
    const [row] = await pooledDb
      .update(commissionRules)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.salespersonUserId !== undefined
          ? { salespersonUserId: data.salespersonUserId }
          : {}),
        ...(data.commissionPercent !== undefined
          ? { commissionPercent: data.commissionPercent }
          : {}),
        ...(data.itemId !== undefined ? { itemId: data.itemId ?? null } : {}),
        ...(data.itemCategory !== undefined
          ? { itemCategory: data.itemCategory ?? null }
          : {}),
        ...(data.minimumMarginPercent !== undefined
          ? { minimumMarginPercent: data.minimumMarginPercent ?? null }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      })
      .where(this.tenantScope(commissionRules, eq(commissionRules.id, id)))
      .returning();

    return row;
  }

  async listRecords(params: CommissionRecordListParams) {
    const conditions: SQL[] = [];

    if (params.status) {
      conditions.push(eq(commissionRecords.status, params.status));
    }
    if (params.salespersonUserId) {
      conditions.push(
        eq(commissionRecords.salespersonUserId, params.salespersonUserId),
      );
    }

    const where = this.tenantScope(commissionRecords, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        record: commissionRecords,
        salespersonName: users.fullName,
        ruleName: commissionRules.name,
      })
      .from(commissionRecords)
      .leftJoin(users, eq(users.id, commissionRecords.salespersonUserId))
      .leftJoin(
        commissionRules,
        eq(commissionRules.id, commissionRecords.ruleId),
      )
      .where(where)
      .orderBy(desc(commissionRecords.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(commissionRecords)
      .where(where);

    return {
      rows: rows.map((row) => ({
        ...row.record,
        salespersonName: row.salespersonName,
        ruleName: row.ruleName,
      })),
      total: Number(total),
    };
  }

  async findRecord(id: string) {
    const [row] = await db
      .select()
      .from(commissionRecords)
      .where(this.tenantScope(commissionRecords, eq(commissionRecords.id, id)))
      .limit(1);

    return row;
  }

  async updateRecordStatus(
    id: string,
    status: 'PENDING' | 'APPROVED' | 'PAID',
    extra?: Partial<typeof commissionRecords.$inferInsert>,
  ) {
    const [row] = await pooledDb
      .update(commissionRecords)
      .set({ status, ...extra })
      .where(this.tenantScope(commissionRecords, eq(commissionRecords.id, id)))
      .returning();

    return row;
  }

  async createRecord(
    data: {
      ruleId: string;
      salespersonUserId: string;
      salesOrderId?: string | null;
      commissionPercent: string;
      amount: string;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(commissionRecords)
      .values({
        organizationId: this.organizationId,
        ruleId: data.ruleId,
        salespersonUserId: data.salespersonUserId,
        salesOrderId: data.salesOrderId ?? null,
        status: 'PENDING',
        commissionPercent: data.commissionPercent,
        amount: data.amount,
      })
      .returning();

    return row;
  }
}
