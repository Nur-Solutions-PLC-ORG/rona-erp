import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiDeleteBranch, ApiGetBranches } from "./api";

export const useAdminBranches = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-branches", JSON.stringify(searchParams)],
    queryFn: () =>
      ApiGetBranches({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useCreateMutation(
    ApiDeleteBranch,
    (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const items = data?.data ?? [];

  return {
    branches: items,
    isLoading,
    deleteMutation,
  };
};
