import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiGetPlatformConfigs } from "../api";

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

  const items = data?.data ?? [
    {
      id: "pc-1",
      key: "name" as const,
      value: "Rona ERP",
      type: "string" as const,
      createdAt: "",
    },
  ];

  return {
    platformConfigs: items,
    isLoading,
  };
};
