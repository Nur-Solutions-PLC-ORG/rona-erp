"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminBranches } from "@/modules/features/admin/branches/hooks";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
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
  const { organizations } = useAdminOrganizations();

  const columns = createColumns<BranchDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
    extraColumns: [
      { accessorKey: "name", header: "Branch", isBold: true },
      {
        id: "organization",
        header: "Organization",
        accessorFn: (branch) =>
          organizations.find(
            (organization) => organization.id === branch.organizationId,
          )?.name,
      },
    ],
    actionsItems: [
      {
        title: "View",
        separator: true,
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-branch", { branch: row.original }, true),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-branch", { branch: row.original }),
      },
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
        head={
          <CustomButton
            primary
            onClick={() => useModalStore.getState().openModal("admin-branch")}
            icon={FiPlus}
          >
            Add Branch
          </CustomButton>
        }
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
