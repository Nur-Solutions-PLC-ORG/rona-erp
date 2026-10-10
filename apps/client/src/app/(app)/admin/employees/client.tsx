"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminEmployees } from "@/modules/features/admin/employees/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { EmployeeDto, EmployeeListSearchParamsSchema } from "@rona/types/admin";
import { employeeListSearchParamsSchema } from "@rona/validation/admin";
import { useCallback, useState } from "react";
import { HiOutlinePlus, HiOutlineUsers } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";

const Client = () => {
  const {
    pagination,
    paginationData,
    searchParams,
    requestSearchParams,
    updateParams,
    clearParams,
    removeParams,
  } = useListPage<EmployeeListSearchParamsSchema>();
  const [localSearch, setLocalSearch] = useState("");

  const { employees, isLoading, deleteMutation, meta } = useAdminEmployees(
    requestSearchParams,
    paginationData,
  );
  const { organizationsNameLookup, organizationsFilter } =
    useAdminOrganizations();

  const getSearchableText = useCallback(
    (employee: EmployeeDto) =>
      [
        employee.eId,
        employee.fullName,
        employee.email || "",
        employee.phone,
        employee.gender,
        employee.status,
        organizationsNameLookup[employee.organizationId] || "",
      ].join(" "),
    [organizationsNameLookup],
  );

  const list = useAccumulatedList({
    items: employees,
    meta,
    pagination,
    serverFilterKey: JSON.stringify({
      ...requestSearchParams,
      limit: paginationData.limit,
    }),
    localSearch,
    getSearchableText,
    isLoading,
  });

  const columns = createColumns<EmployeeDto>({
    includeActions: true,
    searchQuery: localSearch || searchParams.searchQuery,
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
        searchParams={searchParams}
        updateParams={updateParams}
        clearParams={() => {
          setLocalSearch("");
          clearParams();
        }}
        removeParams={removeParams}
        localSearch={localSearch}
        onLocalSearchChange={setLocalSearch}
        onSearchServer={(value) => {
          setLocalSearch(value);
          if (value) updateParams({ searchQuery: value });
          else removeParams(["searchQuery"]);
          pagination.setPage(1);
        }}
        replacements={{ orgId: organizationsFilter }}
      />
      <DataTable
        columns={columns}
        data={list.items}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
        loadMore={{
          hasMore: list.hasMore,
          onLoadMore: list.loadMore,
          cachedCount: list.cachedCount,
          isFilteringLocally: list.isFilteringLocally,
        }}
      />
    </div>
  );
};

export default Client;
