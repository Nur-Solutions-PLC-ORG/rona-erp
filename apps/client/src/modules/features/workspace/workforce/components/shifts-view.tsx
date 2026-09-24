"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineClock, HiOutlinePencilSquare, HiOutlinePlus } from "react-icons/hi2";
import { shiftCreateSchema, shiftUpdateSchema } from "@rona/validation/hr";
import type { Shift } from "@rona/types/hr";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  RowActionsMenu,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  ModalActions,
} from "@/modules/workspace/components/form";
import SearchInput from "@/components/custom/search-input";
import { useCreateShift, useShifts, useUpdateShift } from "../hooks";

const EMPTY_FORM = {
  name: "",
  code: "",
  startTime: "",
  endTime: "",
  breakMinutes: "",
};

function shortTime(value: string): string {
  return value.slice(0, 5);
}

export default function ShiftsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("hr.schedule.read");
  const canCreate = hasPermission("hr.schedule.create");
  const canUpdate = hasPermission("hr.schedule.update");

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { shifts, meta, isLoading } = useShifts(search || undefined);
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineClock className="w-6 h-6" />}
        title="Shifts unavailable"
        description="You do not have permission to view shift schedules. Contact an administrator."
      />
    );
  }

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submitCreate = () => {
    const parsed = shiftCreateSchema.safeParse({
      name: form.name,
      code: form.code,
      startTime: form.startTime,
      endTime: form.endTime,
      breakMinutes: form.breakMinutes ? Number(form.breakMinutes) : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid shift details");
      return;
    }

    createShift.mutate(parsed.data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setForm({ ...EMPTY_FORM });
      },
    });
  };

  const openEdit = (shift: Shift) => {
    setEditing(shift);
    setForm({
      name: shift.name,
      code: shift.code,
      startTime: shortTime(shift.startTime),
      endTime: shortTime(shift.endTime),
      breakMinutes: shift.breakMinutes != null ? String(shift.breakMinutes) : "",
    });
  };

  const submitEdit = () => {
    if (!editing) return;
    const parsed = shiftUpdateSchema.safeParse({
      name: form.name,
      code: form.code,
      startTime: form.startTime,
      endTime: form.endTime,
      breakMinutes: form.breakMinutes ? Number(form.breakMinutes) : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid shift details");
      return;
    }

    updateShift.mutate(
      { id: editing.id, input: parsed.data as import("@rona/types/hr").ShiftUpdateInput },
      {
        onSuccess: () => {
          setEditing(null);
          setForm({ ...EMPTY_FORM });
        },
      },
    );
  };

  const columns: Column<Shift>[] = [
    {
      key: "name",
      header: "Shift",
      render: (row) => <span className="font-medium text-zinc-800">{row.name}</span>,
    },
    {
      key: "code",
      header: "Code",
      render: (row) => <span className="font-mono text-zinc-600">{row.code}</span>,
    },
    {
      key: "window",
      header: "Start – End",
      render: (row) => (
        <span className="font-mono text-zinc-600">
          {shortTime(row.startTime)} – {shortTime(row.endTime)}
        </span>
      ),
    },
    {
      key: "break",
      header: "Break",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.breakMinutes} min</span>
      ),
    },
    ...(canUpdate
      ? [
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (row: Shift) => (
              <RowActionsMenu
                items={[
                  {
                    label: "Edit",
                    icon: <HiOutlinePencilSquare className="h-4 w-4" />,
                    onClick: () => openEdit(row),
                  },
                ]}
              />
            ),
          } satisfies Column<Shift>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineClock className="w-5 h-5" />}
        title="Shifts"
        description="Shift templates assigned to employees"
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Shift
            </button>
          ) : undefined
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or code…"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={shifts}
        isLoading={isLoading}
        emptyMessage={
          meta && meta.totalItems > 0
            ? "No shifts found."
            : "No shift templates yet — create the first one."
        }
      />

      <FormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Shift"
        icon={<HiOutlineClock className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Name"
            id="shift-name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="e.g. Morning Shift"
          />
          <LabeledInput
            label="Code"
            id="shift-code"
            value={form.code}
            onChange={(event) => updateForm("code", event.target.value)}
            placeholder="e.g. MORNING"
          />
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Start Time"
              id="shift-start"
              type="time"
              value={form.startTime}
              onChange={(event) => updateForm("startTime", event.target.value)}
            />
            <LabeledInput
              label="End Time"
              id="shift-end"
              type="time"
              value={form.endTime}
              onChange={(event) => updateForm("endTime", event.target.value)}
            />
          </div>
          <LabeledInput
            label="Break Minutes (optional)"
            id="shift-break"
            type="number"
            min={0}
            max={1440}
            value={form.breakMinutes}
            onChange={(event) => updateForm("breakMinutes", event.target.value)}
            placeholder="e.g. 60"
          />
        </div>
        <ModalActions
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={submitCreate}
          submitLabel="Create Shift"
          isPending={createShift.isPending}
        />
      </FormModal>

      <FormModal
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          setForm({ ...EMPTY_FORM });
        }}
        title="Edit Shift"
        icon={<HiOutlineClock className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Name"
            id="shift-name-edit"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="e.g. Morning Shift"
          />
          <LabeledInput
            label="Code"
            id="shift-code-edit"
            value={form.code}
            onChange={(event) => updateForm("code", event.target.value)}
            placeholder="e.g. MORNING"
          />
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Start Time"
              id="shift-start-edit"
              type="time"
              value={form.startTime}
              onChange={(event) => updateForm("startTime", event.target.value)}
            />
            <LabeledInput
              label="End Time"
              id="shift-end-edit"
              type="time"
              value={form.endTime}
              onChange={(event) => updateForm("endTime", event.target.value)}
            />
          </div>
          <LabeledInput
            label="Break Minutes (optional)"
            id="shift-break-edit"
            type="number"
            min={0}
            max={1440}
            value={form.breakMinutes}
            onChange={(event) => updateForm("breakMinutes", event.target.value)}
            placeholder="e.g. 60"
          />
        </div>
        <ModalActions
          onCancel={() => {
            setEditing(null);
            setForm({ ...EMPTY_FORM });
          }}
          onSubmit={submitEdit}
          submitLabel="Save Changes"
          isPending={updateShift.isPending}
        />
      </FormModal>
    </div>
  );
}
