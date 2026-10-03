import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { useCreateMutation } from "@/hooks/utils";
import type {
  LotCreateSchema,
  LotDto,
  LotQualityStatusUpdateSchema,
} from "@rona/types/inventory";
import {
  ApiGetLots,
  ApiPatchLotQualityStatus,
  ApiPostLot,
} from "../api";
import {
  INVENTORY_PAGE_SIZE,
  LOOKUP_PAGE_SIZE,
  useInventoryQuery,
} from "./shared";

export interface LotFilters {
  itemId?: string;
  qualityStatus?: string;
  excludeExpired?: boolean;
  searchQuery?: string;
}

export const useLots = (page: number, filters: LotFilters = {}) => {
  const query = useInventoryQuery(
    "inventory.lot.read",
    [
      "inventory-lots",
      page,
      filters.itemId,
      filters.qualityStatus,
      filters.excludeExpired,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetLots({
        searchParams: {
          page,
          limit: INVENTORY_PAGE_SIZE,
          itemId: filters.itemId,
          qualityStatus: filters.qualityStatus,
          excludeExpired: filters.excludeExpired ? "true" : undefined,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    lots: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useLotsForItem = (itemId: string | undefined) => {
  const query = useInventoryQuery(
    "inventory.lot.read",
    ["inventory-lots", "by-item", itemId],
    TryCatchNullWrap(() =>
      ApiGetLots({
        searchParams: { itemId: itemId ?? "", limit: LOOKUP_PAGE_SIZE },
      }),
    ),
    itemId !== undefined && itemId !== "",
  );

  return {
    lots: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useCreateLot = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<LotDto, LotCreateSchema>(
    (input) => ApiPostLot({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["inventory-lots"] });
    },
    (error) => toast.error(error.message),
  );
};

export interface LotQualityStatusInput extends LotQualityStatusUpdateSchema {
  id: string;
}

export const useUpdateLotQualityStatus = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<LotDto, LotQualityStatusInput>(
    ({ id, ...input }) =>
      ApiPatchLotQualityStatus({ body: input, slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["inventory-lots"] });
    },
    (error) => toast.error(error.message),
  );
};
