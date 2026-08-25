"use client";

import DataHeader from "@/components/custom/data-header";
import CustomButton from "@/components/custom/custom-button";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  OrganizationDto,
  OrganizationListSearchParamsSchema,
} from "@rona/types/admin";
import { organizationListSearchParamsSchema } from "@rona/validation/admin";
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
  } = useListPage<OrganizationListSearchParamsSchema>();
  const [localSearch, setLocalSearch] = useState("");

  const { organizations, isLoading, deleteMutation, meta } =
    useAdminOrganizations(requestSearchParams, paginationData);

  const getSearchableText = useCallback(
    (org: OrganizationDto) =>
      [org.name, org.slug, org.email, org.phone, org.country, org.status].join(
        " ",
      ),
    [],
  );

  const list = useAccumulatedList({
    items: organizations,
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

  const columns = createColumns<OrganizationDto>({
    includeActions: true,
    searchQuery: localSearch || searchParams.searchQuery,
    extraColumns: [
      { accessorKey: "name", header: "Organization", isBold: true },
      { accessorKey: "slug", header: "Slug", highlight: true },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "country", header: "Country" },
      {
        accessorKey: "status",
        header: "Status",
        coloring: { active: BADGE_COLORS.green, inactive: BADGE_COLORS.red },
      },
    ],
    actionsItems: [
      {
        title: "View",
        separator: true,
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal(
              "admin-organization",
              { organization: row.original },
              true,
            ),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-organization", { organization: row.original }),
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete organization",
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
      <DataHeader<OrganizationListSearchParamsSchema>
        searchParamsSchema={organizationListSearchParamsSchema}
        head={
          <CustomButton
            primary
            onClick={() =>
              useModalStore.getState().openModal("admin-organization")
            }
            icon={FiPlus}
          >
            Add Organization
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
