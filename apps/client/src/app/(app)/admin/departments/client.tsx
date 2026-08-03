"use client";

import DataHeader from "@/components/custom/data-header";
import CustomButton from "@/components/custom/custom-button";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { slugToString } from "@/lib/utils";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useAdminDepartments } from "@/modules/features/departments/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  DepartmentDto,
  DepartmentListSearchParamsSchema,
} from "@rona/types/admin";
import { departmentListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<DepartmentListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { departments, isLoading, deleteMutation } = useAdminDepartments(
    customSearchParams.requestSearchParams,
    paginationData,
  );
  const { companies } = useAdminCompanies();

  const columns = createColumns<DepartmentDto>({
    includeActions: true,
    extraColumns: [
      { accessorKey: "name", header: "Department", isBold: true },
      {
        id: "company",
        header: "Company",
        accessorFn: (department) =>
          companies.find((company) => company.id === department.tenantId)?.name,
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
    <>
      <DataHeader<DepartmentListSearchParamsSchema>
        searchParamsSchema={departmentListSearchParamsSchema}
        head={
          <CustomButton
            primary
            onClick={() =>
              useModalStore.getState().openModal("admin-department")
            }
            icon={FiPlus}
          >
            Add Department
          </CustomButton>
        }
        {...customSearchParams}
      />
      <DataTable
        columns={columns}
        data={departments}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
