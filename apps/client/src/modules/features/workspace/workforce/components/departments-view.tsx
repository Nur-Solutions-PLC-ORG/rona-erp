"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineBuildingOffice2, HiOutlinePlus } from "react-icons/hi2";
import { departmentCreateSchema } from "@rona/validation/hr";
import type { Department } from "@rona/types/hr";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  Column,
  DataTable,
  EmptyState,
  Pagination,
  PageHeader,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  ModalActions,
} from "@/modules/workspace/components/form";
import SearchInput from "@/components/custom/search-input";
import { useCreateDepartment, useDepartments } from "../hooks";

const EMPTY_FORM = {
  name: "",
  code: "",
  modules: "",
};

function formatTimestamp(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DepartmentsView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("hr.employee.read");
  const canCreate = hasPermission("hr.employee.create");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { departments, meta, isLoading } = useDepartments(search || undefined);
  const createDepartment = useCreateDepartment();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineBuildingOffice2 className="w-6 h-6" />}
        title="Departments unavailable"
        description="You do not have permission to view departments. Contact an administrator."
      />
    );
  }

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submitCreate = () => {
    const modulesList = form.modules
      .split(",")
      .map((module) => module.trim())
      .filter(Boolean);

    const parsed = departmentCreateSchema.safeParse({
      name: form.name,
      code: form.code || undefined,
      modules: modulesList.length > 0 ? modulesList : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid department details");
      return;
    }

    createDepartment.mutate(parsed.data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setForm({ ...EMPTY_FORM });
      },
    });
  };

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-800">{row.name}</p>
          <p className="text-zinc-400">
            {row.modules.length} module{row.modules.length === 1 ? "" : "s"}
          </p>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (row) => (
        <span className="font-mono text-zinc-600">{row.code ?? "—"}</span>
      ),
    },
    {
      key: "modules",
      header: "Modules",
      render: (row) =>
        row.modules.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.modules.map((module) => (
              <span
                key={module}
                className="bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5 text-[10px] font-medium"
              >
                {module}
              </span>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => (
        <span className="font-mono text-zinc-600">
          {formatTimestamp(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
        title="Departments"
        description="Organizational units and the modules they cover"
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => setIsCreateOpen(true)}
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Department
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
            placeholder="Search name or code…"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={departments}
        isLoading={isLoading}
        emptyMessage="No departments have been created yet."
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
        title="Add Department"
        icon={<HiOutlineBuildingOffice2 className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <LabeledInput
            label="Name"
            id="department-name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="e.g. Production"
          />
          <LabeledInput
            label="Code (optional)"
            id="department-code"
            value={form.code}
            onChange={(event) => updateForm("code", event.target.value)}
            placeholder="e.g. PROD"
          />
          <LabeledInput
            label="Modules (optional, comma-separated)"
            id="department-modules"
            value={form.modules}
            onChange={(event) => updateForm("modules", event.target.value)}
            placeholder="e.g. inventory, manufacturing, quality"
          />
        </div>
        <ModalActions
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={submitCreate}
          submitLabel="Create Department"
          isPending={createDepartment.isPending}
        />
      </FormModal>
    </div>
  );
}
