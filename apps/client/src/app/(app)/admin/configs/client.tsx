"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { BADGE_COLORS } from "@/lib/colors";
import { createColumns } from "@/lib/create-columns";
import { useAdminPlatformConfigs } from "@/modules/features/admin/platform-configs/hooks";
import { useModalStore } from "@/store";
import {
  ConfigsListSearchParamsSchema,
  PlatformConfigDto,
} from "@rona/types/admin";
import { configsListSearchParamsSchema } from "@rona/validation/admin";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<ConfigsListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { platformConfigs, isLoading } = useAdminPlatformConfigs(
    customSearchParams.requestSearchParams,
    paginationData,
  );

  const columns = createColumns<PlatformConfigDto>({
    includeActions: true,
    searchQuery: customSearchParams.searchParams.searchQuery,
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
        coloring: {
          string: BADGE_COLORS.yellow,
          number: BADGE_COLORS.blue,
          boolean: BADGE_COLORS.red,
        },
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
    <>
      <DataHeader<ConfigsListSearchParamsSchema>
        {...customSearchParams}
        searchParamsSchema={configsListSearchParamsSchema}
      />
      <DataTable
        columns={columns}
        data={platformConfigs}
        loading={isLoading}
        pagination={pagination}
      />
    </>
  );
};

export default Client;
