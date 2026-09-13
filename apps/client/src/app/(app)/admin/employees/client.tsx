"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminEmployees } from "@/modules/features/admin/employees/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { EmployeeDto, EmployeeListSearchParamsSchema } from "@rona/types/admin";
import { employeeListSearchParamsSchema } from "@rona/validation/admin";
import { HiOutlinePlus, HiOutlineUsers } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<EmployeeListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { employees, isLoading, deleteMutation, meta } = useAdminEmployees(
    customSearchParams.requestSearchParams,
    paginationData,
  );
  const { organizationsNameLookup, organizationsFilter } =
    useAdminOrganizations();

  const columns = createColumns<EmployeeDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
    extraColumns: [
      {
        accessorKey: "eId",
        header: "EID",
        isRaw: true,
        isBold: true,
        isMono: true,
      },
      { accessorKey: "fullName", header: "Name", isBold: true },
      { accessorKey: "email", header: "Email", highlight: true },
      { accessorKey: "phone", header: "Phone" },
      {
        id: "organization",
        header: "Organization",
        accessorFn: (employee) =>
          organizationsNameLookup[employee.organizationId],
      },
      { accessorKey: "gender", header: "Gender" },
      { accessorKey: "birthDate", header: "Birth Date", isDate: true },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.getValue("status") as string} />
        ),
      },
    ],
    actionsItems: [
      {
        title: "View",
        onClick: (row) => {
          useModalStore
            .getState()
            .openModal("admin-employee", { employee: row.original }, true);
        },
        separator: true,
      },
      {
        title: "Edit",
        onClick: (row) => {
          useModalStore
            .getState()
            .openModal("admin-employee", { employee: row.original });
        },
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete employee",
            variant: "destructive",
            onClick: async () => {
              await deleteMutation.mutateAsync({
                slugReplacement: { id: row.original.id },
              });
            },
          }),
      },
    ],
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineUsers className="w-5 h-5" />}
        title="Employees"
        description="Manage employees across all organizations"
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() =>
              useModalStore.getState().openModal("admin-employee")
            }
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Employee
          </button>
        }
      />
      <DataHeader<EmployeeListSearchParamsSchema>
        searchParamsSchema={employeeListSearchParamsSchema}
        head={null}
        {...customSearchParams}
        replacements={{ orgId: organizationsFilter }}
      />
      <DataTable
        columns={columns}
        data={employees}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
      />
    </div>
  );
};

export default Client;
