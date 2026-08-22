import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiDeleteCompany, ApiGetCompanies } from "./api";
import { createLookup } from "@/lib/utils";

export const useAdminCompanies = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies", JSON.stringify(searchParams)],
    queryFn: () =>
      ApiGetCompanies({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useCreateMutation(
    ApiDeleteCompany,
    (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const items = data?.data ?? [];

  const companiesNameLookup = createLookup(items, "id", "name");

  return {
    companies: items,
    isLoading,
    deleteMutation,
    companiesNameLookup,
  };
};
