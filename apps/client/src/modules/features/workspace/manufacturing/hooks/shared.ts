import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/modules/workspace/hooks";
import { useCreateMutation } from "@/hooks/utils";
import type { ApiResponse } from "@rona/types/api";
import type { Permission } from "@rona/types/tenancy";

export const MANUFACTURING_PAGE_SIZE = 25;

export function useManufacturingQuery<TDto>(
  permission: Permission,
  queryKey: unknown[],
  queryFn: () => Promise<ApiResponse<TDto[]> | null>,
  isEnabled = true,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission(permission) && isEnabled,
  });
}

export function useManufacturingMutation<TData, TVariables>(
  operation: (variables: TVariables) => Promise<ApiResponse<TData>>,
  invalidate: string[][],
  successExtra?: (data: ApiResponse<TData>) => void,
) {
  const queryClient = useQueryClient();

  return useCreateMutation<TData, TVariables>(
    operation,
    (data) => {
      toast.success(data.message);
      for (const key of invalidate) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      successExtra?.(data);
    },
    (error) => toast.error(error.message),
  );
}
