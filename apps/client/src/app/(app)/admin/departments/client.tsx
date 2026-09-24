"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { createColumns } from "@/lib/create-columns";
import { slugToString } from "@/lib/utils";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminDepartments } from "@/modules/features/admin/departments/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  DepartmentDto,
  DepartmentListSearchParamsSchema,
} from "@rona/types/admin";
import { departmentListSearchParamsSchema } from "@rona/validation/admin";
import { useCallback, useState } from "react";
import { HiOutlineCube, HiOutlinePlus } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
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
  } = useListPage<DepartmentListSearchParamsSchema>();
  const [localSearch, setLocalSearch] = useState("");

  const { departments, isLoading, deleteMutation, meta } = useAdminDepartments(
    requestSearchParams,
    paginationData,
  );
  const { organizations, organizationsFilter } = useAdminOrganizations();

  const getSearchableText = useCallback(
    (department: DepartmentDto) => {
      const orgName =
        organizations.find((o) => o.id === department.organizationId)?.name ||
        "";
      return [department.name, orgName, ...(department.module || [])].join(" ");
    },
    [organizations],
  );

  const list = useAccumulatedList({
    items: departments,
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

  const columns = createColumns<DepartmentDto>({
    includeActions: true,
    searchQuery: localSearch || searchParams.searchQuery,
    extraColumns: [
      { accessorKey: "name", header: "Department", isBold: true },
      {
        id: "organization",
        header: "Organization",
        accessorFn: (department) =>
          organizations.find(
            (organization) => organization.id === department.organizationId,
          )?.name,
      },
      {
        accessorKey: "module",
        header: "Modules",
        onRender: (modules: string[]) => modules.map(slugToString),
      },
    ],
    actionsItems: [
      {
        title: "View",
        separator: true,
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-department", { department: row.original }, true),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-department", { department: row.original }),
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete department",
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
        icon={<HiOutlineCube className="w-5 h-5" />}
        title="Departments"
        description="Manage organizational departments and their modules"
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() =>
              useModalStore.getState().openModal("admin-department")
            }
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Department
          </button>
        }
      />
      <DataHeader<DepartmentListSearchParamsSchema>
        searchParamsSchema={departmentListSearchParamsSchema}
        replacements={{ orgId: organizationsFilter }}
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
