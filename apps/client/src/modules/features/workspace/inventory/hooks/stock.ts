import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { useCreateMutation } from "@/hooks/utils";
import type { ApiResponse } from "@rona/types/api";
import type {
  AdjustStockSchema,
  IssueStockSchema,
  ReceiveStockSchema,
  ReturnStockSchema,
  TransferStockSchema,
} from "@rona/types/inventory";
import {
  ApiGetMovements,
  ApiGetStockBalances,
  ApiPostStockAdjust,
  ApiPostStockIssue,
  ApiPostStockReceive,
  ApiPostStockReturn,
  ApiPostStockTransfer,
} from "../api";
import { INVENTORY_PAGE_SIZE, useInventoryQuery } from "./shared";

export interface StockFilters {
  itemId?: string;
  warehouseId?: string;
  locationId?: string;
  lotId?: string;
  searchQuery?: string;
}

export const useStockBalances = (page: number, filters: StockFilters = {}) => {
  const query = useInventoryQuery(
    "inventory.stock.read",
    [
      "inventory-stock",
      page,
      filters.itemId,
      filters.warehouseId,
      filters.locationId,
      filters.lotId,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetStockBalances({
        searchParams: {
          page,
          limit: INVENTORY_PAGE_SIZE,
          itemId: filters.itemId,
          warehouseId: filters.warehouseId,
          locationId: filters.locationId,
          lotId: filters.lotId,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    balances: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export interface MovementFilters {
  itemId?: string;
  warehouseId?: string;
  locationId?: string;
  lotId?: string;
  type?: string;
  searchQuery?: string;
}

export const useMovements = (page: number, filters: MovementFilters = {}) => {
  const query = useInventoryQuery(
    "inventory.movement.read",
    [
      "inventory-movements",
      page,
      filters.itemId,
      filters.warehouseId,
      filters.locationId,
      filters.lotId,
      filters.type,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetMovements({
        searchParams: {
          page,
          limit: INVENTORY_PAGE_SIZE,
          itemId: filters.itemId,
          warehouseId: filters.warehouseId,
          locationId: filters.locationId,
          lotId: filters.lotId,
          type: filters.type,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    movements: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

function useStockOperation<TSchema>(
  operation: (input: TSchema) => Promise<ApiResponse<unknown>>,
) {
  const queryClient = useQueryClient();

  return useCreateMutation<unknown, TSchema>(
    operation,
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-lots"] });
    },
    (error) => toast.error(error.message),
  );
}

export const useReceiveStock = () =>
  useStockOperation((input: ReceiveStockSchema) =>
    ApiPostStockReceive({ body: input }),
  );

export const useIssueStock = () =>
  useStockOperation((input: IssueStockSchema) =>
    ApiPostStockIssue({ body: input }),
  );

export const useTransferStock = () =>
  useStockOperation((input: TransferStockSchema) =>
    ApiPostStockTransfer({ body: input }),
  );

export const useAdjustStock = () =>
  useStockOperation((input: AdjustStockSchema) =>
    ApiPostStockAdjust({ body: input }),
  );

export const useReturnStock = () =>
  useStockOperation((input: ReturnStockSchema) =>
    ApiPostStockReturn({ body: input }),
  );
