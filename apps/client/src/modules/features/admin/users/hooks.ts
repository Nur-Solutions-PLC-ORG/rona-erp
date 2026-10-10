import { RequestSearchParams } from "@/api";
import { buildListQueryKey } from "@/hooks/list-query";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiDeleteUser, ApiGetUsers, ApiPostResetUserPassword } from "./api";

export const useAdminUsers = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: buildListQueryKey("admin-users", searchParams, pagination),
    queryFn: () =>
      ApiGetUsers({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const queryClient = useQueryClient();
  const deleteMutation = useCreateMutation(
    ApiDeleteUser,
    (data) => {
      toast.success(data.message);

      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const resetPasswordMutation = useCreateMutation(
    ApiPostResetUserPassword,
    (data) => {
      toast.success(data.message);
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const items = data?.data ?? [];

  return {
    users: items,
    meta: data?.meta,
    isLoading,
    deleteMutation,
    resetPasswordMutation,
  };
};
