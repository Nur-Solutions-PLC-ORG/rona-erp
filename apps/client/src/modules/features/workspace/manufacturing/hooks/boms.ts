import { useQuery } from "@tanstack/react-query";
import { TryCatchNullWrap } from "@/api/utils";
import { usePermissions } from "@/modules/workspace/hooks";
import type { BomDto, BomVersionDto } from "@rona/types/manufacturing";
import {
  ApiGetBoms,
  ApiGetBomVersions,
  ApiPatchBom,
  ApiPostBom,
  ApiPostBomVersion,
  ApiPostBomVersionApprove,
  ApiPostBomVersionRetire,
} from "../api";
import {
  MANUFACTURING_PAGE_SIZE,
  useManufacturingMutation,
  useManufacturingQuery,
} from "./shared";

export function useBoms(
  page: number,
  filters: { itemId?: string; searchQuery?: string } = {},
) {
  const query = useManufacturingQuery<BomDto>(
    "manufacturing.bom.read",
    ["manufacturing-boms", page, filters.itemId ?? "", filters.searchQuery ?? ""],
    TryCatchNullWrap(() =>
      ApiGetBoms({
        searchParams: {
          page,
          limit: MANUFACTURING_PAGE_SIZE,
          ...filters,
        },
      }),
    ),
  );

  return {
    boms: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
}

export function useBomOptions() {
  const { hasPermission } = usePermissions();
  const query = useQuery({
    queryKey: ["manufacturing-boms", "options"],
    queryFn: TryCatchNullWrap(() =>
      ApiGetBoms({ searchParams: { page: 1, limit: 100 } }),
    ),
    enabled: hasPermission("manufacturing.bom.read"),
    staleTime: 5 * 60 * 1000,
  });

  const boms = query.data?.data ?? [];

  return {
    boms,
    labelFor: new Map(boms.map((bom) => [bom.id, `${bom.code} — ${bom.name}`])),
    isLoading: query.isLoading,
  };
}

export function useBomVersions(bomId?: string, status?: string) {
  const query = useManufacturingQuery<BomVersionDto>(
    "manufacturing.bom.read",
    ["manufacturing-bom-versions", bomId ?? "", status ?? ""],
    TryCatchNullWrap(() =>
      ApiGetBomVersions({
        searchParams: { page: 1, limit: 50, ...(status ? { status } : {}) },
        slugReplacement: { id: bomId as string },
      }),
    ),
    Boolean(bomId),
  );

  return {
    versions: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
}

export function useCreateBom() {
  return useManufacturingMutation(ApiPostBom, [["manufacturing-boms"]]);
}

export function useUpdateBom() {
  return useManufacturingMutation(ApiPatchBom, [
    ["manufacturing-boms"],
    ["manufacturing-boms", "options"],
  ]);
}

export function useCreateBomVersion(bomId: string) {
  return useManufacturingMutation(ApiPostBomVersion, [
    ["manufacturing-bom-versions", bomId],
  ]);
}

export function useApproveBomVersion(bomId: string) {
  return useManufacturingMutation(ApiPostBomVersionApprove, [
    ["manufacturing-bom-versions", bomId],
    ["manufacturing-boms"],
  ]);
}

export function useRetireBomVersion(bomId: string) {
  return useManufacturingMutation(ApiPostBomVersionRetire, [
    ["manufacturing-bom-versions", bomId],
    ["manufacturing-boms"],
  ]);
}
