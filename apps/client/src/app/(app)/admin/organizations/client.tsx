"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  OrganizationDto,
  OrganizationListSearchParamsSchema,
} from "@rona/types/admin";
import { organizationListSearchParamsSchema } from "@rona/validation/admin";
import { useCallback, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlinePlus,
} from "react-icons/hi2";
import {
  BTN_PRIMARY,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import OrgLogo from "@/components/custom/org-logo";
import { highlightSearchMatch } from "@/lib/create-columns";

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
      {
        accessorKey: "name",
        header: "Organization",
        isBold: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <OrgLogo
              src={(row.original as OrganizationDto).logoUrl}
              className="h-6 w-6"
              iconClassName="h-3 w-3"
            />
            <span className="text-xs font-semibold text-zinc-800">
              {highlightSearchMatch(
                row.original.name,
                localSearch || searchParams.searchQuery,
              )}
            </span>
          </div>
        ),
      },
      { accessorKey: "slug", header: "Slug", highlight: true },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "country", header: "Country" },
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
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
        title="Organizations"
        description="Manage all organizations on the platform"
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() =>
              useModalStore.getState().openModal("admin-organization")
            }
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Organization
          </button>
        }
      />
      <DataHeader<OrganizationListSearchParamsSchema>
        searchParamsSchema={organizationListSearchParamsSchema}
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
