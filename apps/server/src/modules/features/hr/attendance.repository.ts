import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  getTableColumns,
  or,
  type SQL,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { employees } from '@/db/schemas/admin';
import { attendanceEvents } from '@/db/schemas/hr/attendance';
import { kiosks } from '@/db/schemas/kiosk/kiosk';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  AttendanceEventType,
  AttendanceListParams,
  AttendanceSource,
} from '@rona/types/hr';
import type { KioskVerificationMethod } from '@rona/types/kiosk';

@Injectable()
export class AttendanceRepository extends TenantScopedRepository {
  async create(
    data: {
      employeeId: string;
      eventType: AttendanceEventType;
      eventAt: Date;
      recordedBy: string | null;
      notes?: string;
      source?: AttendanceSource | null;
      kioskId?: string | null;
      methods?: KioskVerificationMethod[] | null;
      matchScore?: number | null;
      clientEventId?: string | null;
      deviceEventAt?: Date | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(attendanceEvents)
      .values({ ...data, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findByClientEventId(clientEventId: string) {
    const [row] = await db
      .select()
      .from(attendanceEvents)
      .where(
        this.tenantScope(
          attendanceEvents,
          eq(attendanceEvents.clientEventId, clientEventId),
        ),
      )
      .limit(1);
    return row;
  }

  async listEventsForEmployee(employeeId: string) {
    return db
      .select()
      .from(attendanceEvents)
      .where(
        this.tenantScope(
          attendanceEvents,
          eq(attendanceEvents.employeeId, employeeId),
        ),
      )
      .orderBy(asc(attendanceEvents.eventAt), asc(attendanceEvents.createdAt));
  }

  async list(params: AttendanceListParams) {
    const conditions: SQL[] = [];
    if (params.employeeId) {
      conditions.push(eq(attendanceEvents.employeeId, params.employeeId));
    }
    if (params.eventType) {
      conditions.push(eq(attendanceEvents.eventType, params.eventType));
    }
    if (params.from) {
      conditions.push(
        gte(attendanceEvents.eventAt, new Date(`${params.from}T00:00:00.000Z`)),
      );
    }
    if (params.to) {
      conditions.push(
        lte(attendanceEvents.eventAt, new Date(`${params.to}T23:59:59.999Z`)),
      );
    }
    if (params.searchQuery) {
      const pattern = `%${params.searchQuery}%`;
      conditions.push(
        inArray(
          attendanceEvents.employeeId,
          db
            .select({ id: employees.id })
            .from(employees)
            .where(
              and(
                eq(employees.organizationId, this.organizationId),
                or(
                  ilike(employees.fullName, pattern),
                  ilike(employees.eid, pattern),
                ),
              ),
            ),
        ),
      );
    }

    const where = this.tenantScope(attendanceEvents, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        ...getTableColumns(attendanceEvents),
        kioskName: kiosks.name,
      })
      .from(attendanceEvents)
      .leftJoin(kiosks, eq(kiosks.id, attendanceEvents.kioskId))
      .where(where)
      .orderBy(asc(attendanceEvents.eventAt), asc(attendanceEvents.createdAt))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(attendanceEvents)
      .where(where);

    return { rows, total: Number(total) };
  }
}
