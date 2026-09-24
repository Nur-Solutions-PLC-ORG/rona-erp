import { asc, count, eq, ilike, or, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { employeeShifts, shifts } from '@/db/schemas/hr/shifts';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  EmployeeShiftAssignInput,
  ShiftListParams,
  ShiftCreateInput,
  ShiftUpdateInput,
} from '@rona/types/hr';

@Injectable()
export class ShiftsRepository extends TenantScopedRepository {
  async createShift(data: ShiftCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(shifts)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findShiftById(shiftId: string) {
    const [row] = await db
      .select()
      .from(shifts)
      .where(this.tenantScope(shifts, eq(shifts.id, shiftId)))
      .limit(1);
    return row;
  }

  async findShiftByCode(code: string) {
    const [row] = await db
      .select()
      .from(shifts)
      .where(this.tenantScope(shifts, eq(shifts.code, code)))
      .limit(1);
    return row;
  }

  async updateShift(shiftId: string, data: ShiftUpdateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(shifts)
      .set(data)
      .where(this.tenantScope(shifts, eq(shifts.id, shiftId)))
      .returning();
    return row;
  }

  async listShifts(params: ShiftListParams) {
    const conditions: SQL[] = [];
    if (params.searchQuery) {
      const searchCondition = or(
        ilike(shifts.name, `%${params.searchQuery}%`),
        ilike(shifts.code, `%${params.searchQuery}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(shifts, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(shifts)
      .where(where)
      .orderBy(asc(shifts.code))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(shifts)
      .where(where);

    return { rows, total: Number(total) };
  }

  async assignShift(
    data: EmployeeShiftAssignInput & { employeeId: string },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(employeeShifts)
      .values({
        employeeId: data.employeeId,
        shiftId: data.shiftId,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo ?? null,
        organizationId: this.organizationId,
      })
      .returning();
    return row;
  }

  async findAssignmentById(assignmentId: string) {
    const [row] = await db
      .select()
      .from(employeeShifts)
      .where(
        this.tenantScope(employeeShifts, eq(employeeShifts.id, assignmentId)),
      )
      .limit(1);
    return row;
  }

  async endAssignment(
    assignmentId: string,
    effectiveTo: string,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(employeeShifts)
      .set({ effectiveTo })
      .where(
        this.tenantScope(employeeShifts, eq(employeeShifts.id, assignmentId)),
      )
      .returning();
    return row;
  }

  async listAssignmentsForEmployee(employeeId: string) {
    return db
      .select({
        id: employeeShifts.id,
        organizationId: employeeShifts.organizationId,
        employeeId: employeeShifts.employeeId,
        shiftId: employeeShifts.shiftId,
        shiftName: shifts.name,
        shiftCode: shifts.code,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        breakMinutes: shifts.breakMinutes,
        effectiveFrom: employeeShifts.effectiveFrom,
        effectiveTo: employeeShifts.effectiveTo,
        createdAt: employeeShifts.createdAt,
        updatedAt: employeeShifts.updatedAt,
      })
      .from(employeeShifts)
      .innerJoin(shifts, eq(shifts.id, employeeShifts.shiftId))
      .where(
        this.tenantScope(
          employeeShifts,
          eq(employeeShifts.employeeId, employeeId),
        ),
      )
      .orderBy(asc(employeeShifts.effectiveFrom));
  }

  async findOverlappingAssignment(
    employeeId: string,
    effectiveFrom: string,
    effectiveTo: string | undefined,
  ) {
    const rows = await db
      .select()
      .from(employeeShifts)
      .where(
        this.tenantScope(
          employeeShifts,
          eq(employeeShifts.employeeId, employeeId),
        ),
      );
    const filtered = rows.filter((row) => {
      const rowFrom = row.effectiveFrom;
      const rowTo = row.effectiveTo ?? '9999-12-31';
      const newTo = effectiveTo ?? '9999-12-31';
      return effectiveFrom <= rowTo && rowFrom <= newTo;
    });
    return filtered[0];
  }
}
