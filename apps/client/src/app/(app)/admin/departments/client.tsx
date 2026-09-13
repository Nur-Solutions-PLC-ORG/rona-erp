"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
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
import { HiOutlineCube, HiOutlinePlus } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
} from "@/modules/workspace/components/ui";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<DepartmentListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { departments, isLoading, deleteMutation, meta } = useAdminDepartments(
    customSearchParams.requestSearchParams,
    paginationData,
  );
  const { organizations, organizationsFilter } = useAdminOrganizations();

  const columns = createColumns<DepartmentDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
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
        {...customSearchParams}
      />
      <DataTable
        columns={columns}
        data={departments}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
      />
    </div>
  );
};

export default Client;
