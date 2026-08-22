import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useQuery } from "@tanstack/react-query";
import { ApiGetPlatformConfigs } from "./api";

export const useAdminPlatformConfigs = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-platform-configs", JSON.stringify(searchParams)],
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
    isLoading,
  };
};
