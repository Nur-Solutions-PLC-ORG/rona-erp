import { RequestSearchParams } from "@/api";
import { buildListQueryKey } from "@/hooks/list-query";
import { PaginationData } from "@/hooks/pagination";
import { useQuery } from "@tanstack/react-query";
import { ApiGetPlatformConfigs } from "./api";

export const useAdminPlatformConfigs = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: buildListQueryKey(
      "admin-platform-configs",
      searchParams,
      pagination,
    ),
    queryFn: () =>
      ApiGetPlatformConfigs({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const items = data?.data ?? [];

  return {
    platformConfigs: items,
    meta: data?.meta,
    isLoading,
  };
};
