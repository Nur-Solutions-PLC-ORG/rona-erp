"use client";

import CustomButton from "@/components/custom/custom-button";
import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { createColumns } from "@/lib/create-columns";
import { useAdminBranches } from "@/modules/features/admin/branches/hooks";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import { BranchDto, BranchListSearchParamsSchema } from "@rona/types/admin";
import { branchListSearchParamsSchema } from "@rona/validation/admin";
import { useCallback, useState } from "react";
import { FiPlus } from "react-icons/fi";

const Client = () => {
  const {
    pagination,
    paginationData,
    searchParams,
    requestSearchParams,
    updateParams,
    clearParams,
    removeParams,
  } = useListPage<BranchListSearchParamsSchema>();
  const [localSearch, setLocalSearch] = useState("");

  const { branches, isLoading, deleteMutation, meta } = useAdminBranches(
    requestSearchParams,
    paginationData,
  );
  const { organizations } = useAdminOrganizations();

  const getSearchableText = useCallback(
    (branch: BranchDto) => {
      const orgName =
        organizations.find((o) => o.id === branch.organizationId)?.name || "";
      return [branch.name, orgName].join(" ");
    },
    [organizations],
  );

  const list = useAccumulatedList({
    items: branches,
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

  const columns = createColumns<BranchDto>({
    includeActions: true,
    searchQuery: localSearch || searchParams.searchQuery,
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
    </>
  );
};

export default Client;
