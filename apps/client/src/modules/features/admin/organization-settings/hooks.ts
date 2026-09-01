import { RequestSearchParams } from "@/api";
import { buildListQueryKey } from "@/hooks/list-query";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiDeleteOrganizationSettings,
  ApiGetOrganizationSettings,
} from "./api";

export const useAdminOrganizationSettings = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: buildListQueryKey(
      "admin-organization-settings",
      searchParams,
      pagination,
    ),
    queryFn: () =>
      ApiGetOrganizationSettings({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useCreateMutation(
    ApiDeleteOrganizationSettings,
    (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-organization-settings"],
      });
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const items = data?.data ?? [];

  return {
    organizationSettings: items,
    meta: data?.meta,
    isLoading,
    deleteMutation,
  };
};
