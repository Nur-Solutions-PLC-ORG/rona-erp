import {
  and,
  asc,
  count,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  sql,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { departments, employees, positions } from '@/db/schemas/admin';
import { attendanceEvents } from '@/db/schemas/hr/attendance';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  HRContext,
  PeriodSpec,
  ShiftName,
  AttendanceStatus,
  TrendComparison,
} from '../types/ai-contexts.types.js';

const LATE_CUTOFF_MINUTES = 8 * 60 + 30;
const LOCAL_OFFSET_MINUTES = 180;

@Injectable()
export class AiHrRepository extends TenantScopedRepository {
  async fetchHr(period: PeriodSpec): Promise<HRContext> {
    const start = new Date(`${period.start}T00:00:00.000Z`);
    const end = new Date(`${period.end}T23:59:59.999Z`);

    const [roster, punches] = await Promise.all([
      this.loadRoster(),
      this.loadPunches(start, end),
    ]);

    const byEmployee = this.groupPunches(punches);
    const counters = this.buildRecords(roster, byEmployee);

    const headcount = roster.length;
    const attendanceRate = headcount
      ? ((counters.present + counters.late) / headcount) * 100
      : 0;
    const absenteeismRate = headcount ? (counters.absent / headcount) * 100 : 0;

    const trends: TrendComparison[] = [];
    if (period.previousStart && period.previousEnd) {
      const previous = await this.attendanceRateFor(
        period.previousStart,
        period.previousEnd,
      );
      if (previous != null) {
        const current = round1(attendanceRate);
        trends.push(
          trend(
            'Attendance Rate',
            current,
            previous,
            round1(current - previous),
            period.previousLabel,
          ),
        );
      }
    }

    return {
      tenantId: this.organizationId,
      domain: 'hr',
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      generatedAt: new Date(),
      sourceSystem: 'rona-erp',
      recordCountTruncated: false,
      totalHeadcount: headcount,
      presentCount: counters.present,
      absentCount: counters.absent,
      lateCount: counters.late,
      onLeaveCount: counters.onLeave,
      notRecordedCount: counters.notRecorded,
      attendanceRatePct: round1(attendanceRate),
      absenteeismRatePct: round1(absenteeismRate),
      totalOvertimeHours: round1(counters.overtime),
      employeesOnOvertime: counters.onOvertime,
      records: counters.records,
      byDepartment: this.rollupByDepartment(counters.records),
      byProductionLine: [],
      trends,
    };
  }

  private async loadRoster() {
    return db
      .select({
        employeeId: employees.id,
        eid: employees.eid,
        fullName: employees.fullName,
        employeeStatus: employees.status,
        departmentName: departments.name,
        positionTitle: positions.title,
      })
      .from(employees)
      .leftJoin(
        departments,
        and(
          eq(departments.id, employees.departmentId),
          eq(departments.organizationId, employees.organizationId),
        ),
      )
      .leftJoin(
        positions,
        and(
          eq(positions.id, employees.positionId),
          eq(positions.organizationId, employees.organizationId),
        ),
      )
      .where(
        and(
          eq(employees.organizationId, this.organizationId),
          isNull(employees.archivedAt),
        ),
      );
  }

  private loadPunches(start: Date, end: Date) {
    return db
      .select({
        employeeId: attendanceEvents.employeeId,
        eventType: attendanceEvents.eventType,
        eventAt: attendanceEvents.eventAt,
      })
      .from(attendanceEvents)
      .where(
        and(
          eq(attendanceEvents.organizationId, this.organizationId),
          gte(attendanceEvents.eventAt, start),
          lte(attendanceEvents.eventAt, end),
          inArray(attendanceEvents.eventType, ['CLOCK_IN', 'CLOCK_OUT']),
        ),
      )
      .orderBy(asc(attendanceEvents.eventAt));
  }

  private groupPunches(
    punches: { employeeId: string; eventType: string; eventAt: Date }[],
  ) {
    const map = new Map<string, { clockIn?: Date; clockOut?: Date }>();
    for (const punch of punches) {
      const entry = map.get(punch.employeeId) ?? {};
      if (punch.eventType === 'CLOCK_IN' && !entry.clockIn) {
        entry.clockIn = punch.eventAt;
      }
      if (punch.eventType === 'CLOCK_OUT') {
        entry.clockOut = punch.eventAt;
      }
      map.set(punch.employeeId, entry);
    }
    return map;
  }

  private buildRecords(
    roster: Awaited<ReturnType<AiHrRepository['loadRoster']>>,
    byEmployee: Map<string, { clockIn?: Date; clockOut?: Date }>,
  ) {
    const records: HRContext['records'] = [];
    const totals = {
      present: 0,
      late: 0,
      absent: 0,
      onLeave: 0,
      notRecorded: 0,
      overtime: 0,
      onOvertime: 0,
    };

    for (const employee of roster) {
      const entry = byEmployee.get(employee.employeeId);
      let status: AttendanceStatus;
      let checkInTime: string | null = null;
      let checkOutTime: string | null = null;
      let lateMinutes = 0;
      let overtimeHours = 0;

      if (entry?.clockIn) {
        checkInTime = toLocalHhmm(entry.clockIn);
        const minutesOfDay =
          entry.clockIn.getUTCHours() * 60 +
          entry.clockIn.getUTCMinutes() -
          LOCAL_OFFSET_MINUTES;
        if (minutesOfDay > LATE_CUTOFF_MINUTES) {
          status = 'late';
          totals.late += 1;
          lateMinutes = minutesOfDay - LATE_CUTOFF_MINUTES;
        } else {
          status = 'present';
          totals.present += 1;
        }
        if (entry.clockOut) {
          checkOutTime = toLocalHhmm(entry.clockOut);
          const worked =
            (entry.clockOut.getTime() - entry.clockIn.getTime()) / 3_600_000 -
            1;
          if (worked > 8) {
            overtimeHours = round1(worked - 8);
            if (overtimeHours > 0) totals.onOvertime += 1;
          }
        }
      } else if (employee.employeeStatus === 'on_leave') {
        status = 'on_leave';
        totals.onLeave += 1;
      } else {
        status =
          employee.employeeStatus === 'active' ? 'not_recorded' : 'absent';
        if (employee.employeeStatus === 'active') totals.notRecorded += 1;
        else totals.absent += 1;
      }

      totals.overtime += overtimeHours;
      records.push({
        employeeId: employee.eid,
        fullName: employee.fullName,
        department: employee.departmentName ?? 'Unassigned',
        position: employee.positionTitle ?? 'Employee',
        productionLine: null,
        shift: this.shiftFor(entry?.clockIn),
        status,
        checkInTime,
        checkOutTime,
        lateMinutes,
        overtimeHours,
        absenceReason: status === 'on_leave' ? 'on leave' : null,
      });
    }

    return { records, ...totals };
  }

  private shiftFor(clockIn: Date | undefined): ShiftName {
    if (!clockIn) return 'morning';
    const localMinutes =
      clockIn.getUTCHours() * 60 +
      clockIn.getUTCMinutes() +
      LOCAL_OFFSET_MINUTES;
    const hour = localMinutes / 60;
    if (hour < 14) return 'morning';
    if (hour < 22) return 'afternoon';
    return 'night';
  }

  private rollupByDepartment(records: HRContext['records']) {
    const map = new Map<string, AttendanceRollupAgg>();
    for (const record of records) {
      const agg = map.get(record.department) ?? {
        headcount: 0,
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0,
        overtime: 0,
      };
      agg.headcount += 1;
      if (record.status === 'present') agg.present += 1;
      if (record.status === 'late') agg.late += 1;
      if (record.status === 'absent') agg.absent += 1;
      if (record.status === 'on_leave') agg.onLeave += 1;
      agg.overtime += record.overtimeHours;
      map.set(record.department, agg);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, agg]) => ({
        groupName,
        headcount: agg.headcount,
        present: agg.present,
        absent: agg.absent,
        late: agg.late,
        onLeave: agg.onLeave,
        absenteeismRatePct: agg.headcount
          ? round1((agg.absent / agg.headcount) * 100)
          : 0,
        totalOvertimeHours: round1(agg.overtime),
      }));
  }

  private async attendanceRateFor(
    startIso: string,
    endIso: string,
  ): Promise<number | null> {
    const start = new Date(`${startIso}T00:00:00.000Z`);
    const end = new Date(`${endIso}T23:59:59.999Z`);

    const [headcountRow] = await db
      .select({ total: count() })
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, this.organizationId),
          eq(employees.status, 'active'),
          isNull(employees.archivedAt),
        ),
      );

    const [clockedIn] = await db
      .select({
        total: sql<number>`count(distinct ${attendanceEvents.employeeId})`,
      })
      .from(attendanceEvents)
      .where(
        and(
          eq(attendanceEvents.organizationId, this.organizationId),
          eq(attendanceEvents.eventType, 'CLOCK_IN'),
          gte(attendanceEvents.eventAt, start),
          lte(attendanceEvents.eventAt, end),
        ),
      );

    const headcount = Number(headcountRow?.total ?? 0);
    if (!headcount) return null;
    return round1((Number(clockedIn?.total ?? 0) / headcount) * 100);
  }
}

interface AttendanceRollupAgg {
  headcount: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  overtime: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toLocalHhmm(date: Date): string {
  const local = new Date(date.getTime() + LOCAL_OFFSET_MINUTES * 60_000);
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
}

function trend(
  metricLabel: string,
  current: number,
  previous: number,
  changePct: number,
  label: string | null,
): TrendComparison {
  return {
    metricLabel,
    currentValue: current,
    previousValue: previous,
    changePct,
    direction: current > previous ? 'up' : current < previous ? 'down' : 'flat',
    previousPeriodLabel: label ?? 'previous period',
  };
}
