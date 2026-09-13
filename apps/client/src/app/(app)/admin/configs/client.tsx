"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { useAdminPlatformConfigs } from "@/modules/features/admin/platform-configs/hooks";
import { useModalStore } from "@/store";
import {
  ConfigsListSearchParamsSchema,
  PlatformConfigDto,
} from "@rona/types/admin";
import { configsListSearchParamsSchema } from "@rona/validation/admin";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import {
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<ConfigsListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { platformConfigs, isLoading, meta } = useAdminPlatformConfigs(
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
        {...customSearchParams}
        searchParamsSchema={configsListSearchParamsSchema}
        head={null}
      />
      <DataTable
        columns={columns}
        data={platformConfigs}
        loading={isLoading}
        pagination={pagination}
        responseMeta={meta}
      />
    </div>
  );
};

export default Client;
