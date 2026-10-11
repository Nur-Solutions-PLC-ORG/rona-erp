"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow, isToday, isYesterday, subDays } from "date-fns";
import { toast } from "sonner";
import { HiOutlineClock, HiOutlinePlus } from "react-icons/hi2";
import { ATTENDANCE_EVENT_TYPE_LIST } from "@rona/config/hr";
import { attendanceManageSchema } from "@rona/validation/hr";
import SearchInput from "@/components/custom/search-input";
import type {
  AttendanceEvent,
  AttendanceEventType,
  AttendanceSource,
} from "@rona/types/hr";
import type { KioskVerificationMethod } from "@rona/types/kiosk";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  Column,
  DataTable,
  DotBadge,
  EmptyState,
  FIELD_TOOLBAR_CLASS,
  FilterSelect,
  Pagination,
  PageHeader,
  StatusBadge,
  type Tone,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import { initials } from "@/modules/features/workspace/dashboard/components/shell";
import {
  useAttendanceEvents,
  useEmployeeLookup,
  usePunchManaged,
  usePunchSelf,
  useSelfAttendanceStatus,
} from "../hooks";

const NEXT_EVENTS: Record<AttendanceEventType | "none", AttendanceEventType[]> = {
  none: ["CLOCK_IN"],
  CLOCK_IN: ["BREAK_START", "CLOCK_OUT"],
  BREAK_START: ["BREAK_END"],
  BREAK_END: ["BREAK_START", "CLOCK_OUT"],
  CLOCK_OUT: ["CLOCK_IN"],
};

// The attendance list joins the kiosk name for kiosk-recorded events.
type AttendanceRow = AttendanceEvent & { kioskName?: string | null };

const SOURCE_BADGES: Record<AttendanceSource, { label: string; className: string }> = {
  KIOSK: { label: "Kiosk", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  SELF: { label: "Self", className: "bg-sky-50 text-sky-700 border-sky-200" },
  MANUAL: { label: "Manual", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};

const METHOD_LABELS: Record<KioskVerificationMethod, string> = {
  FACE: "Face",
  FINGER: "Fingerprint",
  CARD: "Card",
  PASSCODE: "Passcode",
};

function SourceCell({ row }: { row: AttendanceRow }) {
  if (!row.source) return <span className="text-zinc-400">—</span>;
  const badge = SOURCE_BADGES[row.source];
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
        {row.kioskName ? (
          <span className="text-xs text-zinc-500">{row.kioskName}</span>
        ) : null}
      </div>
      {row.methods?.length ? (
        <div className="flex flex-wrap gap-1">
          {row.methods.map((method) => (
            <span
              key={method}
              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600"
            >
              {METHOD_LABELS[method] ?? method}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const EVENT_LABELS: Record<AttendanceEventType, string> = {
  CLOCK_IN: "Clock In",
  CLOCK_OUT: "Clock Out",
  BREAK_START: "Start Break",
  BREAK_END: "End Break",
};

// Same colours as the kiosk action tiles.
const EVENT_TONES: Record<AttendanceEventType, Tone> = {
  CLOCK_IN: "emerald",
  CLOCK_OUT: "rose",
  BREAK_START: "amber",
  BREAK_END: "sky",
};

function formatTimestamp(value: string | Date): string {
  return format(new Date(value), "dd MMM yyyy HH:mm");
}

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, dd MMM yyyy");
}

function WhenCell({ value }: { value: string | Date }) {
  const date = new Date(value);
  return (
    <div
      className="flex flex-col leading-tight"
      title={`${formatTimestamp(date)} · ${formatDistanceToNow(date, { addSuffix: true })}`}
    >
      <span className="font-mono text-sm font-semibold text-zinc-800">
        {format(date, "HH:mm")}
      </span>
      <span className="text-[11px] text-zinc-500">{dayLabel(date)}</span>
    </div>
  );
}

const DATE_PRESETS = [
  { key: "today", label: "Today", days: 0 },
  { key: "7d", label: "Last 7 days", days: 6 },
  { key: "30d", label: "Last 30 days", days: 29 },
  { key: "all", label: "All time", days: null },
] as const;

function presetRange(days: number | null): { from: string; to: string } {
  if (days === null) return { from: "", to: "" };
  const today = new Date();
  return {
    from: format(subDays(today, days), "yyyy-MM-dd"),
    to: format(today, "yyyy-MM-dd"),
  };
}

export default function AttendanceView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("hr.attendance.read");
  const canClock = hasPermission("hr.attendance.clock");
  const canManage = hasPermission("hr.attendance.manage");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageForm, setManageForm] = useState({
    employeeId: "",
    eventType: "",
    eventAt: "",
    notes: "",
  });

  const { events, meta, isLoading } = useAttendanceEvents(page, {
    employeeId: employeeFilter || undefined,
    eventType: (eventTypeFilter || undefined) as AttendanceEventType | undefined,
    from: fromFilter || undefined,
    to: toFilter || undefined,
    searchQuery: search || undefined,
  });
  const { employees, nameLookup } = useEmployeeLookup();
  const selfStatus = useSelfAttendanceStatus();
  const punchSelf = usePunchSelf();
  const punchManaged = usePunchManaged();

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );

  const userNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of employees) {
      if (employee.userId) map.set(employee.userId, employee.fullName);
    }
    return map;
  }, [employees]);

  if (!canRead && !canClock && !canManage) {
    return (
      <EmptyState
        icon={<HiOutlineClock className="w-6 h-6" />}
        title="Attendance unavailable"
        description="You do not have permission to view or record attendance. Contact an administrator."
      />
    );
  }

  const status = selfStatus.data?.data;
  const nextEvents = status ? NEXT_EVENTS[status.currentState] : [];

  const submitManaged = () => {
    const parsed = attendanceManageSchema.safeParse({
      employeeId: manageForm.employeeId,
      eventType: manageForm.eventType,
      eventAt: manageForm.eventAt ? new Date(manageForm.eventAt) : undefined,
      notes: manageForm.notes || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid punch details");
      return;
    }

    punchManaged.mutate(parsed.data, {
      onSuccess: () => {
        setIsManageOpen(false);
        setManageForm({ employeeId: "", eventType: "", eventAt: "", notes: "" });
      },
    });
  };

  const columns: Column<AttendanceRow>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => {
        const employee = employeeById.get(row.employeeId);
        if (!employee) {
          return (
            <span className="font-mono text-zinc-400">
              {nameLookup.get(row.employeeId) ?? row.employeeId.slice(0, 8)}
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-aqua/15 text-[11px] font-semibold text-brand-sea">
              {initials(employee.fullName)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium text-zinc-800">{employee.fullName}</p>
              <p className="font-mono text-[11px] text-zinc-500">{employee.eId}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "event",
      header: "Event",
      render: (row) => (
        <DotBadge tone={EVENT_TONES[row.eventType]} label={EVENT_LABELS[row.eventType]} />
      ),
    },
    {
      key: "time",
      header: "When",
      render: (row) => <WhenCell value={row.eventAt} />,
    },
    {
      key: "source",
      header: "Source",
      className: "hidden sm:table-cell",
      render: (row) => <SourceCell row={row} />,
    },
    {
      key: "details",
      header: "Details",
      className: "hidden lg:table-cell",
      render: (row) => {
        const recordedBy = row.recordedBy
          ? (userNameLookup.get(row.recordedBy) ?? "Manager")
          : null;
        // Legacy kiosk punches carry the note "Kiosk", already shown as the source.
        const notes = row.notes && !(row.source === "KIOSK" && row.notes === "Kiosk") ? row.notes : null;
        if (!recordedBy && !notes) return <span className="text-zinc-400">—</span>;
        return (
          <div className="max-w-xs space-y-0.5 text-xs leading-snug">
            {recordedBy ? <p className="text-zinc-600">Recorded by {recordedBy}</p> : null}
            {notes ? <p className="truncate text-zinc-500" title={notes}>{notes}</p> : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineClock className="w-5 h-5" />}
        title="Attendance"
        description="Punch clock and attendance event history"
        actions={
          canManage ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsManageOpen(true)}
            >
              <HiOutlinePlus className="w-4 h-4" />
              Record Punch
            </button>
          ) : undefined
        }
      />

      {canClock ? (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 flex items-center justify-center text-zinc-700 shrink-0">
                <HiOutlineClock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-zinc-700">My Punch Clock</h2>
                {selfStatus.isLoading ? (
                  <p className="text-xs text-zinc-500">Checking your punch state…</p>
                ) : status ? (
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <StatusBadge status={status.currentState} />
                    {status.lastEvent ? (
                      <span className="text-[11px] text-zinc-500 font-mono">
                        last {formatTimestamp(status.lastEvent.eventAt)}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    No employee record is linked to your account — contact HR.
                  </p>
                )}
              </div>
            </div>
            {status && nextEvents.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {nextEvents.map((eventType) => (
                  <button
                    key={eventType}
                    type="button"
                    className={BTN_PRIMARY}
                    onClick={() => punchSelf.mutate({ eventType })}
                    disabled={punchSelf.isPending}
                  >
                    {EVENT_LABELS[eventType]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {canRead ? (
        <>
          <Card className="p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Date range">
              {DATE_PRESETS.map((preset) => {
                const range = presetRange(preset.days);
                const active = fromFilter === range.from && toFilter === range.to;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setFromFilter(range.from);
                      setToFilter(range.to);
                      setPage(1);
                    }}
                    className={
                      active
                        ? "rounded-full border border-brand-teal bg-brand-teal px-3 py-1 text-xs font-medium text-white"
                        : "rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-brand-sea hover:text-brand-sea"
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search employee name or EID…"
              />
              <FilterSelect
                value={employeeFilter}
                onChange={(value) => {
                  setEmployeeFilter(value);
                  setPage(1);
                }}
                options={employees.map((employee) => ({
                  label: `${employee.eId} — ${employee.fullName}`,
                  value: employee.id,
                }))}
                placeholder="All Employees"
              />
              <FilterSelect
                value={eventTypeFilter}
                onChange={(value) => {
                  setEventTypeFilter(value);
                  setPage(1);
                }}
                options={ATTENDANCE_EVENT_TYPE_LIST.map((eventType) => ({
                  label: EVENT_LABELS[eventType],
                  value: eventType,
                }))}
                placeholder="All Events"
              />
              <input
                type="date"
                className={FIELD_TOOLBAR_CLASS}
                value={fromFilter}
                onChange={(event) => {
                  setFromFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="From date"
              />
              <input
                type="date"
                className={FIELD_TOOLBAR_CLASS}
                value={toFilter}
                onChange={(event) => {
                  setToFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="To date"
              />
            </div>
          </Card>

          <DataTable
            columns={columns}
            rows={events}
            isLoading={isLoading}
            emptyMessage="No attendance events match these filters."
            footer={
              meta && meta.totalPages > 1 ? (
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              ) : null
            }
          />
        </>
      ) : null}

      <FormModal
        open={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        title="Record Punch"
        icon={<HiOutlineClock className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledSelect
            label="Employee"
            id="punch-employee"
            value={manageForm.employeeId}
            onChange={(event) =>
              setManageForm((previous) => ({
                ...previous,
                employeeId: event.target.value,
              }))
            }
          >
            <option value="">Select employee…</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.eId} — {employee.fullName}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Event"
            id="punch-event"
            value={manageForm.eventType}
            onChange={(event) =>
              setManageForm((previous) => ({
                ...previous,
                eventType: event.target.value,
              }))
            }
          >
            <option value="">Select event…</option>
            {ATTENDANCE_EVENT_TYPE_LIST.map((eventType) => (
              <option key={eventType} value={eventType}>
                {EVENT_LABELS[eventType]}
              </option>
            ))}
          </LabeledSelect>
          <LabeledInput
            label="Time (optional — defaults to now)"
            id="punch-time"
            type="datetime-local"
            value={manageForm.eventAt}
            onChange={(event) =>
              setManageForm((previous) => ({
                ...previous,
                eventAt: event.target.value,
              }))
            }
          />
          <LabeledTextarea
            label="Notes (optional)"
            id="punch-notes"
            value={manageForm.notes}
            onChange={(event) =>
              setManageForm((previous) => ({ ...previous, notes: event.target.value }))
            }
            placeholder="Context for this punch, e.g. backdated correction"
          />
        </div>
        <ModalActions
          onCancel={() => setIsManageOpen(false)}
          onSubmit={submitManaged}
          submitLabel="Record Punch"
          isPending={punchManaged.isPending}
        />
      </FormModal>
    </div>
  );
}
