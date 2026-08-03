"use client";

import DataHeader from "@/components/custom/data-header";
import CustomButton from "@/components/custom/custom-button";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminBranches } from "@/modules/features/branches/hooks";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useAdminDepartments } from "@/modules/features/departments/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { BranchDto, BranchListSearchParamsSchema } from "@rona/types/admin";
import { branchListSearchParamsSchema } from "@rona/validation/admin";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<BranchListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { branches, isLoading, deleteMutation } = useAdminBranches(
    customSearchParams.requestSearchParams,
    paginationData,
  );
  const { companies } = useAdminCompanies();
  const { departments } = useAdminDepartments();

  const columns = createColumns<BranchDto>({
    includeActions: true,
    extraColumns: [
      { accessorKey: "name", header: "Branch", isBold: true },
      {
        id: "company",
        header: "Company",
        accessorFn: (branch) =>
          companies.find((company) => company.id === branch.tenantId)?.name,
      },
      {
        id: "department",
        header: "Department",
        accessorFn: (branch) =>
          departments.find(
            (department) => department.id === branch.departmentId,
          )?.name,
      },
    ],
    actionsItems: [
      { title: "View", separator: true, onClick: (row) => useModalStore.getState().openModal("admin-branch", { branch: row.original }, true) },
      { title: "Edit", onClick: (row) => useModalStore.getState().openModal("admin-branch", { branch: row.original }) },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete branch",
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
      <DataHeader<BranchListSearchParamsSchema>
        searchParamsSchema={branchListSearchParamsSchema}
        head={<CustomButton primary onClick={() => useModalStore.getState().openModal("admin-branch")} icon={FiPlus}>Add Branch</CustomButton>}
        {...customSearchParams}
      />
      <DataTable
        columns={columns}
        data={branches}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
