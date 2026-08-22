import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiDeleteUser, ApiGetUsers } from "./api";

export const useAdminUsers = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", JSON.stringify(searchParams)],
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

  const items = data?.data ?? [];

  return {
    users: items,
    isLoading,
    deleteMutation,
  };
};
