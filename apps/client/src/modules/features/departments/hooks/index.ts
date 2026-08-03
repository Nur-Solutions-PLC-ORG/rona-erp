import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiDeleteDepartment, ApiGetDepartments } from "../api";

export const useAdminDepartments = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-departments", JSON.stringify(searchParams)],
    queryFn: () =>
      ApiGetDepartments({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useCreateMutation(
    ApiDeleteDepartment,
    (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const items = data?.data ?? [
    {
      id: "dept-1",
      tenantId: "a;s",
      name: "Engineering",
      module: ["accounting", "sales"],
      createdAt: "",
    },
  ];

  return {
    departments: items,
    isLoading,
    deleteMutation,
  };
};
