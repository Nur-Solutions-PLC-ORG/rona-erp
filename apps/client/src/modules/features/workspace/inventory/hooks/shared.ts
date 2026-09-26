import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/modules/workspace/hooks";
import type { ApiResponse } from "@rona/types/api";
import type { Permission } from "@rona/types/tenancy";

export const INVENTORY_PAGE_SIZE = 25;
export const LOOKUP_PAGE_SIZE = 1000;

export function useInventoryQuery<TDto>(
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
