"use client";

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
  DashboardHeader,
  DataCard,
  KpiCard,
  LoadingCard,
  ViewAllLink,
} from "./shell";
import { AttendanceEventsTable, EmployeesTable } from "./tables";

export default function HrDashboardView() {
  const data = useHrDashboardData();

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
