import { RequestSearchParams } from "@/api";
import { PaginationData } from "@/hooks/pagination";
import { useCreateMutation } from "@/hooks/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiDeleteOrganization, ApiGetOrganizations } from "./api";
import { createLookup } from "@/lib/utils";

export const useAdminOrganizations = (
  searchParams: RequestSearchParams = {},
  pagination?: PaginationData,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-organizations", JSON.stringify(searchParams)],
    queryFn: () =>
      ApiGetOrganizations({
        searchParams: {
          ...searchParams,
          ...pagination,
        },
      }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useCreateMutation(
    ApiDeleteOrganization,
    (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const items = data?.data ?? [];

  const organizationsNameLookup = createLookup(items, "id", "name");
  const organizationsFilter = {
    label: "Organization",
    options: items.map((organization) => ({
      label: organization.name,
      value: organization.id,
    })),
  };

  return {
    organizations: items,
    isLoading,
    deleteMutation,
    organizationsNameLookup,
    organizationsFilter,
  };
};
