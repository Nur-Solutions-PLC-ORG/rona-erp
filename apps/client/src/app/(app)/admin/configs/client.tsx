"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { useAccumulatedList } from "@/hooks/use-accumulated-list";
import { useListPage } from "@/hooks/list-page";
import { createColumns } from "@/lib/create-columns";
import { useAdminPlatformConfigs } from "@/modules/features/admin/platform-configs/hooks";
import { useModalStore } from "@/store";
import {
  ConfigsListSearchParamsSchema,
  PlatformConfigDto,
} from "@rona/types/admin";
import { configsListSearchParamsSchema } from "@rona/validation/admin";
import { useCallback, useState } from "react";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import {
  PageHeader,
  StatusBadge,
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
  } = useListPage<ConfigsListSearchParamsSchema>();
  const [localSearch, setLocalSearch] = useState("");

  const { platformConfigs, isLoading, meta } = useAdminPlatformConfigs(
    requestSearchParams,
    paginationData,
  );

  const getSearchableText = useCallback(
    (config: PlatformConfigDto) =>
      [config.key, config.value, config.type].join(" "),
    [],
  );

  const list = useAccumulatedList({
    items: platformConfigs,
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

  const columns = createColumns<PlatformConfigDto>({
    includeActions: true,
    searchQuery: localSearch || searchParams.searchQuery,
    extraColumns: [
      {
        accessorKey: "key",
        header: "Config",
        isBold: true,
        isMono: true,
        isRaw: true,
      },
      { accessorKey: "value", header: "Value", isBold: true },
      {
        accessorKey: "type",
        header: "Type",
        isMono: true,
      },
    ],
    actionsItems: [
      {
        title: "View",
        separator: true,
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-platform-config", { config: row.original }, true),
      },
      {
        title: "Edit",
        onClick: (row) =>
          useModalStore
            .getState()
            .openModal("admin-platform-config", { config: row.original }),
      },
    ],
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineCog6Tooth className="w-5 h-5" />}
        title="Platform Configs"
        description="View and manage platform-wide configuration settings"
      />
      <DataHeader<ConfigsListSearchParamsSchema>
        searchParamsSchema={configsListSearchParamsSchema}
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
