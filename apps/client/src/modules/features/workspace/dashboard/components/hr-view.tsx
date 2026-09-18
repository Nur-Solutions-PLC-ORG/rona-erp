"use client";

import { useMemo } from "react";
import {
  HiOutlineBuildingStorefront,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from "react-icons/hi2";
import {
  CLIENT_ATTENDANCE_PAGE,
  CLIENT_EMPLOYEES_PAGE,
} from "@rona/routes/workspace";
import { useHrDashboardData } from "../role-hooks";
import {
  BarChart,
  BarList,
  ChartCard,
  toCategoryPoints,
  toDailySeries,
} from "@/modules/workspace/components/charts";
import { humanize } from "@/modules/workspace/components/ui";
import {
  DashboardHeader,
  DataCard,
  KpiCard,
  LoadingCard,
  ViewAllLink,
} from "./shell";
import { AttendanceEventsTable, EmployeesTable } from "./tables";

export default function HrDashboardView() {
  const data = useHrDashboardData();

  const clockInSeries = useMemo(
    () =>
      toDailySeries(
        data.attendanceHistory,
        14,
        (event) => event.eventAt,
        (event) => (event.eventType === "CLOCK_IN" ? 1 : 0),
        { key: "clock-ins", label: "Clock-ins", color: "#4f46e5" },
      ),
    [data.attendanceHistory],
  );

  const staffByStatus = useMemo(
    () =>
      toCategoryPoints(data.employees, (employee) => humanize(employee.status), () => 1),
    [data.employees],
  );

  if (data.isLoading) {
    return <LoadingCard />;
  }

  return (
    <div className="space-y-5">
      <DashboardHeader
        roleLabel="HR Manager"
        icon={<HiOutlineUserGroup className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<HiOutlineUsers className="h-5 w-5" />}
          label="Active Staff"
          value={data.activeStaff}
          hint="Currently employed"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineCalendarDays className="h-4 w-4" />}
          label="On Leave"
          value={data.onLeave}
          accent="warn"
          hint="Approved leave"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineClock className="h-5 w-5" />}
          label="Clocked In Today"
          value={data.clockedInToday}
          hint="Unique employees"
          isLoading={data.isLoading}
        />
        <KpiCard
          icon={<HiOutlineBuildingStorefront className="h-5 w-5" />}
          label="Resigned / Terminated"
          value={data.resignedStaff}
          hint="Former staff records"
          isLoading={data.isLoading}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Clock-ins, last 14 days"
            description="Daily CLOCK_IN events from kiosks and HR."
            isEmpty={data.attendanceHistory.length === 0}
            emptyMessage="No attendance recorded yet"
          >
            <BarChart series={[clockInSeries]} />
          </ChartCard>
        </div>

        <ChartCard
          title="Staff by status"
          description="Headcount across employment statuses."
          isEmpty={data.employees.length === 0}
          emptyMessage="No employees yet"
        >
          <BarList points={staffByStatus} valueFormat={(value) => String(value)} />
        </ChartCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <DataCard
          title="Staff"
          action={<ViewAllLink href={CLIENT_EMPLOYEES_PAGE} />}
          isLoading={data.isLoading}
          isEmpty={data.employees.length === 0}
          emptyMessage="No employees recorded yet."
        >
          <EmployeesTable employees={data.employees} />
        </DataCard>

        <DataCard
          title="Recent Attendance"
          action={<ViewAllLink href={CLIENT_ATTENDANCE_PAGE} />}
          isLoading={data.isLoading}
          isEmpty={data.attendance.length === 0}
          emptyMessage="No attendance events yet."
        >
          <AttendanceEventsTable events={data.attendance} nameLookup={data.nameLookup} />
        </DataCard>
      </div>
    </div>
  );
}
