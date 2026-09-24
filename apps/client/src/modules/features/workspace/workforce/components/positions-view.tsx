"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineBriefcase,
  HiOutlinePlus,
} from "react-icons/hi2";
import { positionCreateSchema } from "@rona/validation/hr";
import type { Position } from "@rona/types/hr";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  FilterSelect,
  Pagination,
  PageHeader,
  RowActionsMenu,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  ModalActions,
} from "@/modules/workspace/components/form";
import SearchInput from "@/components/custom/search-input";
import {
  useArchivePosition,
  useCreatePosition,
  useDepartments,
  usePositions,
  useRestorePosition,
} from "../hooks";

const EMPTY_FORM = {
  title: "",
  code: "",
  description: "",
  departmentId: "",
};

export default function PositionsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("hr.employee.read");
  const canCreate = hasPermission("hr.employee.create");
  const canArchive = hasPermission("hr.employee.archive");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { positions, meta, isLoading } = usePositions(page, {
    departmentId: departmentFilter || undefined,
    includeArchived,
    searchQuery: search || undefined,
  });
  const { departments } = useDepartments();
  const createPosition = useCreatePosition();
  const archivePosition = useArchivePosition();
  const restorePosition = useRestorePosition();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineBriefcase className="w-6 h-6" />}
        title="Positions unavailable"
        description="You do not have permission to view positions. Contact an administrator."
      />
    );
  }

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submitCreate = () => {
    const parsed = positionCreateSchema.safeParse({
      title: form.title,
      code: form.code,
      description: form.description || undefined,
      departmentId: form.departmentId || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid position details");
      return;
    }

    createPosition.mutate(parsed.data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setForm({ ...EMPTY_FORM });
      },
    });
  };

  const columns: Column<Position>[] = [
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-800">{row.title}</p>
          {row.description ? (
            <p className="text-zinc-400 max-w-56 truncate">{row.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.code}</span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row) => row.departmentName ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.archivedAt ? (
          <StatusBadge status="archived" />
        ) : (
          <StatusBadge status="active" />
        ),
    },
    ...(canArchive
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: Position) =>
              row.archivedAt ? (
                <RowActionsMenu
                  label="Position actions"
                  items={[
                    {
                      label: "Restore",
                      icon: <HiOutlineArrowPath className="h-3.5 w-3.5" />,
                      onClick: () => restorePosition.mutate(row.id),
                    },
                  ]}
                />
              ) : (
                <RowActionsMenu
                  label="Position actions"
                  items={[
                    {
                      label: "Archive",
                      icon: <HiOutlineArchiveBox className="h-3.5 w-3.5" />,
                      onClick: () => archivePosition.mutate(row.id),
                      destructive: true,
                    },
                  ]}
                />
              ),
          } satisfies Column<Position>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBriefcase className="w-5 h-5" />}
        title="Positions"
        description="Job titles within the organization's departments"
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Position
            </button>
          ) : undefined
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search title or code…"
          />
          <FilterSelect
            value={departmentFilter}
            onChange={(value) => {
              setDepartmentFilter(value);
              setPage(1);
            }}
            options={departments.map((department) => ({
              label: department.name,
              value: department.id,
            }))}
            placeholder="All Departments"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 pl-1">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => {
                setIncludeArchived(event.target.checked);
                setPage(1);
              }}
              className="w-3.5 h-3.5 rounded accent-zinc-900"
            />
            Include archived
          </label>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={positions}
        isLoading={isLoading}
        emptyMessage="No positions found."
        emptyDescription="Create a position to organize job titles within departments."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" />
              Add Position
            </button>
          ) : undefined
        }
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

      <FormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Position"
        icon={<HiOutlineBriefcase className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Title"
            id="position-title"
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            placeholder="e.g. Machine Operator"
          />
          <LabeledInput
            label="Code"
            id="position-code"
            value={form.code}
            onChange={(event) => updateForm("code", event.target.value)}
            placeholder="e.g. MCH-OP"
          />
          <LabeledTextarea
            label="Description (optional)"
            id="position-description"
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="What this role is responsible for"
          />
          <LabeledSelect
            label="Department (optional)"
            id="position-department"
            value={form.departmentId}
            onChange={(event) => updateForm("departmentId", event.target.value)}
          >
            <option value="">Unassigned</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </LabeledSelect>
        </div>
        <ModalActions
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={submitCreate}
          submitLabel="Create Position"
          isPending={createPosition.isPending}
        />
      </FormModal>
    </div>
  );
}
