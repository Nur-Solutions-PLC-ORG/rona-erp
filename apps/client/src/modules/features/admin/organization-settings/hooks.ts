import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiDeleteOrganizationSettings,
  ApiGetOrganizationSettings,
} from "./api";
import { RequestSearchParams } from "@/api";

export const useAdminOrganizationSettings = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-organization-settings", JSON.stringify(searchParams)],
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
    isLoading,
    deleteMutation,
  };
};
