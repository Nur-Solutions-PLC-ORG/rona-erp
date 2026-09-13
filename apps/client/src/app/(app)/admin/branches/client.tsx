"use client";

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
import { HiOutlineBuildingOffice2, HiOutlinePlus } from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
} from "@/modules/workspace/components/ui";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<BranchListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { branches, isLoading, deleteMutation, meta } = useAdminBranches(
    customSearchParams.requestSearchParams,
    paginationData,
  );
  const { organizations, organizationsFilter } = useAdminOrganizations();

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
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
        title="Branches"
        description="Manage organizational branches and locations"
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => useModalStore.getState().openModal("admin-branch")}
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Branch
          </button>
        }
      />
      <DataHeader<BranchListSearchParamsSchema>
        searchParamsSchema={branchListSearchParamsSchema}
        replacements={{ orgId: organizationsFilter }}
        head={null}
        {...customSearchParams}
      />
      <DataTable
        columns={columns}
        data={branches}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
      />
    </div>
  );
};

export default Client;
