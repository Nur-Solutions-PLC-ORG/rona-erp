import { useQuery } from "@tanstack/react-query";
import { TryCatchNullWrap } from "@/api";
import { usePermissions } from "@/modules/workspace/hooks";
import type { ApiResponse } from "@rona/types/api";
import { ApiGetForwardTrace, ApiGetLotDetail, ApiGetReverseTrace } from "./api";

function useTraceabilityQuery<TDto>(
  queryKey: unknown[],
  queryFn: () => Promise<ApiResponse<TDto> | null>,
  isEnabled = true,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission("traceability.read") && isEnabled,
  });
}

export const useLotDetail = (lotId: string | undefined) => {
  const query = useTraceabilityQuery(
    ["traceability-lot", lotId],
    TryCatchNullWrap(() => ApiGetLotDetail({ slugReplacement: { lotId: lotId ?? "" } })),
    lotId !== undefined && lotId !== "",
  );

  return { detail: query.data?.data, isLoading: query.isLoading };
};

export const useForwardTrace = (lotId: string | undefined) => {
  const query = useTraceabilityQuery(
    ["traceability-forward", lotId],
    TryCatchNullWrap(() => ApiGetForwardTrace({ slugReplacement: { lotId: lotId ?? "" } })),
    lotId !== undefined && lotId !== "",
  );

  return { forward: query.data?.data, isLoading: query.isLoading };
};

export const useReverseTrace = (lotId: string | undefined) => {
  const query = useTraceabilityQuery(
    ["traceability-reverse", lotId],
    TryCatchNullWrap(() => ApiGetReverseTrace({ slugReplacement: { lotId: lotId ?? "" } })),
    lotId !== undefined && lotId !== "",
  );

  return { reverse: query.data?.data, isLoading: query.isLoading };
};
