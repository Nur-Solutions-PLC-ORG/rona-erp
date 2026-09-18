"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineUserPlus,
  HiOutlineUsers,
} from "react-icons/hi2";
import { EMPLOYEE_STATUS_LIST, GENDER_LIST } from "@rona/config/admin";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
} from "@rona/validation/hr";
import type {
  Employee,
  EmployeeCreateInput,
  EmployeeUpdateInput,
} from "@rona/types/hr";
import { usePermissions } from "@/modules/workspace/hooks";
import { useMemberships } from "@/modules/features/workspace/organization/hooks";
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
  ModalActions,
} from "@/modules/workspace/components/form";
import Dropdown from "@/components/custom/dropdown";
import SearchInput from "@/components/custom/search-input";
import {
  useArchiveEmployee,
  useCreateEmployee,
  useDepartments,
  useEmployees,
  usePositions,
  useRestoreEmployee,
  useUpdateEmployee,
} from "../hooks";

const EMPTY_FORM = {
  eId: "",
  fullName: "",
  phone: "",
  email: "",
  gender: "",
  birthDate: "",
  status: "",
  departmentId: "",
  positionId: "",
  hireDate: "",
  userId: "",
};

export default function EmployeesView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("hr.employee.read");
  const canCreate = hasPermission("hr.employee.create");
  const canUpdate = hasPermission("hr.employee.update");
  const canArchive = hasPermission("hr.employee.archive");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { employees, meta, isLoading } = useEmployees(page, {
    status: statusFilter || undefined,
    departmentId: departmentFilter || undefined,
    includeArchived,
    searchQuery: search || undefined,
  });
  const { departments } = useDepartments();
  const { positions } = usePositions(1);
  const { memberships, isLoading: isLoadingMemberships } = useMemberships();
  const canReadMemberships = hasPermission("membership.read");
  const accountOptions = memberships
    .filter((membership) => membership.status === "active")
    .map((membership) => ({
      value: membership.userId,
      label: `${membership.user.fullName} (${membership.user.email ?? membership.userId})`,
    }));
  if (
    editing?.userId &&
    !accountOptions.some((option) => option.value === editing.userId)
  ) {
    const membership = memberships.find(
      (member) => member.userId === editing.userId,
    );
    accountOptions.push({
      value: editing.userId,
      label: membership
        ? `${membership.user.fullName} (${membership.user.email ?? membership.userId}) — ${membership.status}`
        : `Current linked account: ${editing.userId}`,
    });
  }
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const archiveEmployee = useArchiveEmployee();
  const restoreEmployee = useRestoreEmployee();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineUsers className="w-6 h-6" />}
        title="Employees unavailable"
        description="You do not have permission to view employees. Contact an administrator."
      />
    );
  }

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setIsFormOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({
      eId: employee.eId,
      fullName: employee.fullName,
      phone: employee.phone,
      email: employee.email ?? "",
      gender: employee.gender,
      birthDate: employee.birthDate ?? "",
      status: employee.status,
      departmentId: employee.departmentId ?? "",
      positionId: employee.positionId ?? "",
      hireDate: employee.hireDate ?? "",
      userId: employee.userId ?? "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
  };

  const submitForm = () => {
    if (editing) {
      const parsed = employeeUpdateSchema.safeParse({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email === "" ? null : form.email,
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
        status: form.status || undefined,
        departmentId: form.departmentId === "" ? null : form.departmentId,
        positionId: form.positionId === "" ? null : form.positionId,
        hireDate: form.hireDate === "" ? null : form.hireDate,
        userId: form.userId === (editing.userId ?? "")
          ? undefined
          : form.userId || null,
      });

      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid employee details");
        return;
      }

      updateEmployee.mutate(
        { id: editing.id, input: parsed.data as EmployeeUpdateInput },
        { onSuccess: closeForm },
      );
      return;
    }

    const parsed = employeeCreateSchema.safeParse({
      ...form,
      email: form.email || undefined,
      status: form.status || undefined,
      departmentId: form.departmentId || undefined,
      positionId: form.positionId || undefined,
      hireDate: form.hireDate || undefined,
      userId: form.userId || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid employee details");
      return;
    }

    createEmployee.mutate(parsed.data as EmployeeCreateInput, {
      onSuccess: closeForm,
    });
  };

  const columns: Column<Employee>[] = [
    {
      key: "eId",
      header: "EID",
      render: (row) => <span className="font-mono text-zinc-600">{row.eId}</span>,
    },
    {
      key: "name",
      header: "Full Name",
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-800">{row.fullName}</p>
          <p className="text-zinc-400">{row.email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row) => row.departmentName ?? "—",
    },
    {
      key: "position",
      header: "Position",
      render: (row) => row.positionTitle ?? "—",
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => <span className="font-mono text-zinc-600">{row.phone}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "hireDate",
      header: "Hired",
      render: (row) =>
        row.hireDate ? (
          <span className="font-mono text-zinc-600">{row.hireDate}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: Employee) => (
        <RowActionsMenu
          label="Employee actions"
          items={[
            ...(!row.archivedAt && canUpdate
              ? [
                  {
                    label: "Edit",
                    icon: <HiOutlinePencilSquare className="h-3.5 w-3.5" />,
                    onClick: () => openEdit(row),
                  },
                ]
              : []),
            ...(row.archivedAt
              ? [
                  {
                    label: "Restore",
                    icon: <HiOutlineArrowPath className="h-3.5 w-3.5" />,
                    onClick: () => restoreEmployee.mutate(row.id),
                  },
                ]
              : canArchive
                ? [
                    {
                      label: "Archive",
                      icon: <HiOutlineArchiveBox className="h-3.5 w-3.5" />,
                      onClick: () => archiveEmployee.mutate(row.id),
                      destructive: true,
                    },
                  ]
                : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineUsers className="w-5 h-5" />}
        title="Employees"
        description="Workforce directory for the current organization"
        actions={
          canCreate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={openCreate}
            >
              <HiOutlineUserPlus className="w-4 h-4" />
              Add Employee
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
            placeholder="Search name, EID or phone…"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={EMPLOYEE_STATUS_LIST.map((status) => ({
              label: status.replace("_", " ").toUpperCase(),
              value: status,
            }))}
            placeholder="All Statuses"
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
        rows={employees}
        isLoading={isLoading}
        emptyMessage="No employees found."
        emptyDescription="Add an employee to build out the workforce directory."
        emptyAction={
          canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
              onClick={openCreate}
            >
              <HiOutlineUserPlus className="h-4 w-4" />
              Add Employee
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
        open={isFormOpen}
        onClose={closeForm}
        title={editing ? "Edit Employee" : "Add Employee"}
        icon={
          editing ? (
            <HiOutlinePencilSquare className="w-4 h-4" />
          ) : (
            <HiOutlineUserPlus className="w-4 h-4" />
          )
        }
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!editing ? (
            <LabeledInput
              label="EID (5 digits)"
              id="employee-eid"
              value={form.eId}
              onChange={(event) => updateForm("eId", event.target.value)}
              placeholder="e.g. 00042"
            />
          ) : null}
          <LabeledInput
            label="Full Name"
            id="employee-name"
            value={form.fullName}
            onChange={(event) => updateForm("fullName", event.target.value)}
            placeholder="e.g. Abebe Kebede"
          />
          <LabeledInput
            label="Phone"
            id="employee-phone"
            value={form.phone}
            onChange={(event) => updateForm("phone", event.target.value)}
            placeholder="e.g. 0912345678"
          />
          <LabeledInput
            label="Email (optional)"
            id="employee-email"
            type="email"
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="name@example.com"
          />
          <Dropdown
            label="Gender"
            name="employee-gender"
            value={form.gender}
            onChange={(value) => updateForm("gender", value)}
            options={GENDER_LIST.map((gender) => ({
              value: gender,
              label: gender === "M" ? "Male" : "Female",
            }))}
            placeholder="Select…"
          />
          <LabeledInput
            label="Birth Date"
            id="employee-birth-date"
            type="date"
            value={form.birthDate}
            onChange={(event) => updateForm("birthDate", event.target.value)}
          />
          <Dropdown
            label="Status (optional)"
            name="employee-status"
            value={form.status}
            onChange={(value) => updateForm("status", value)}
            options={[
              ...(editing ? [{ value: "", label: "Unchanged" }] : []),
              ...EMPLOYEE_STATUS_LIST.map((status) => ({
                value: status,
                label: status.replace("_", " ").toUpperCase(),
              })),
            ]}
            placeholder="Default (active)"
          />
          <LabeledInput
            label="Hire Date (optional)"
            id="employee-hire-date"
            type="date"
            value={form.hireDate}
            onChange={(event) => updateForm("hireDate", event.target.value)}
          />
          <Dropdown
            label="Department (optional)"
            name="employee-department"
            value={form.departmentId}
            onChange={(value) => updateForm("departmentId", value)}
            options={[
              ...(editing ? [{ value: "", label: "Unassigned" }] : []),
              ...departments.map((department) => ({
                value: department.id,
                label: department.name,
              })),
            ]}
            placeholder="Unassigned"
          />
          <Dropdown
            label="Position (optional)"
            name="employee-position"
            value={form.positionId}
            onChange={(value) => updateForm("positionId", value)}
            options={[
              ...(editing ? [{ value: "", label: "Unassigned" }] : []),
              ...positions.map((position) => ({
                value: position.id,
                label: position.title,
              })),
            ]}
            placeholder="Unassigned"
          />
          <div className="sm:col-span-2 space-y-2">
            <Dropdown
              label="Login account (optional)"
              name="employee-user"
              id="employee-user"
              value={form.userId}
              onChange={(value) => updateForm("userId", value)}
              options={[
                { value: "", label: "No linked account" },
                ...accountOptions,
              ]}
              placeholder="No linked account"
              search
              disabled={!canReadMemberships || isLoadingMemberships}
              desc={canReadMemberships
                ? "Select an active account in this organization to enable employee self-service and face enrollment."
                : "Membership read permission is required to select an organization account. Existing links are preserved."}
            />
            {editing?.userId && form.userId !== editing.userId ? (
              <p role="alert" className="text-xs text-amber-700">
                {form.userId ? "Changing" : "Removing"} this link will remove the previous account&apos;s self-service and face enrollment access for this employee when you save.
              </p>
            ) : null}
          </div>
        </div>
        <ModalActions
          onCancel={closeForm}
          onSubmit={submitForm}
          submitLabel={editing ? "Save Changes" : "Create Employee"}
          isPending={
            editing
              ? updateEmployee.isPending
              : createEmployee.isPending
          }
        />
      </FormModal>
    </div>
    </>
  );
}
