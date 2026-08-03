"use client";

import DataHeader from "@/components/custom/data-header";
import { DataTable } from "@/components/custom/data-table";
import { usePagination } from "@/hooks/pagination";
import { useCustomSearchParams } from "@/hooks/search-params";
import { createColumns } from "@/lib/create-columns";
import { slugToString } from "@/lib/utils";
import { useAdminPlatformConfigs } from "@/modules/features/platform-configs/hooks";
import {
  ConfigsListSearchParamsSchema,
  PlatformConfigDto,
} from "@rona/types/admin";

const Client = () => {
  const customSearchParams =
    useCustomSearchParams<ConfigsListSearchParamsSchema>();
  const { pagination, paginationData } = usePagination();
  const { platformConfigs, isLoading } = useAdminPlatformConfigs(
    customSearchParams.requestSearchParams,
    paginationData,
  );

  const columns = createColumns<PlatformConfigDto>({
    extraColumns: [
      {
        accessorKey: "key",
        header: "Config",
        isBold: true,
        onRender: slugToString,
      },
      { accessorKey: "value", header: "Value", isBold: true },
      { accessorKey: "type", header: "Type", onRender: slugToString },
    ],
  });

  return (
    <>
      <DataHeader<ConfigsListSearchParamsSchema> {...customSearchParams} />
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
