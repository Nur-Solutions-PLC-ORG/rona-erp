import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiDeleteEmployee, ApiGetEmployees } from "./api";

export const useAdminEmployees = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-employees", JSON.stringify(searchParams)],
    queryFn: () =>
      ApiGetEmployees({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useCreateMutation(
    ApiDeleteEmployee,
    (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-employees"] });
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const items = data?.data ?? [];

  return {
    employees: items,
    isLoading,
    deleteMutation,
  };
};
