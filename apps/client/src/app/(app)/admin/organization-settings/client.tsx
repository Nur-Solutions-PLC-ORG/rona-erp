"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { createColumns } from "@/lib/create-columns";
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
import { useAdminOrganizationSettings } from "@/modules/features/admin/organization-settings/hooks";
import { useConfirmationModalStore, useModalStore } from "@/store";
import {
  OrganizationSettingsDto,
  OrganizationSettingsListSearchParamsSchema,
} from "@rona/types/admin";
import { organizationSettingsListSearchParamsSchema } from "@rona/validation/admin";
import { useCallback, useState } from "react";
import { HiOutlinePlus, HiOutlineWrenchScrewdriver } from "react-icons/hi2";
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
  } = useListPage<OrganizationSettingsListSearchParamsSchema>();
  const [localSearch, setLocalSearch] = useState("");

  const { organizationSettings, isLoading, deleteMutation, meta } =
    useAdminOrganizationSettings(requestSearchParams, paginationData);
  const { organizationsNameLookup } = useAdminOrganizations();

  const getSearchableText = useCallback(
    (settings: OrganizationSettingsDto) =>
      [
        organizationsNameLookup[settings.organizationId] || "",
        settings.currency,
      ].join(" "),
    [organizationsNameLookup],
  );

  const list = useAccumulatedList({
    items: organizationSettings,
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

  const columns = createColumns<OrganizationSettingsDto>({
    includeActions: true,
    searchQuery: localSearch || searchParams.searchQuery,
    extraColumns: [
      {
        id: "organization",
        header: "Organization",
        isBold: true,
        accessorFn: (settings) =>
          organizationsNameLookup[settings.organizationId],
      },
      { accessorKey: "currency", header: "Currency" },
    ],
    actionsItems: [
      {
        title: "View",
        separator: true,
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal(
              "admin-organization-settings",
              { settings: row.original },
              true,
            ),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore.getState().openModal("admin-organization-settings", {
            settings: row.original,
          }),
      },
      {
        title: "Delete",
        onClick: (row) =>
          useConfirmationModalStore.getState().openModal({
            title: "delete organization settings",
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
        icon={<HiOutlineWrenchScrewdriver className="w-5 h-5" />}
        title="Organization Settings"
        description="Manage per-organization settings like currency"
        actions={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() =>
              useModalStore.getState().openModal("admin-organization-settings")
            }
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Settings
          </button>
        }
      />
      <DataHeader<OrganizationSettingsListSearchParamsSchema>
        searchParamsSchema={organizationSettingsListSearchParamsSchema}
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
        head={null}
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
