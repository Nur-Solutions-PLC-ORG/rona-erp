import { useQuery } from "@tanstack/react-query";
import { TryCatchNullWrap } from "@/api/utils";
import { usePermissions } from "@/modules/workspace/hooks";
import type { ApiResponse } from "@rona/types/api";
import type {
  ProductionBatchDto,
  ProductionOrderDto,
  ProductionOrderMaterialDto,
} from "@rona/types/manufacturing";
import {
  ApiGetProductionOrderMaterials,
  ApiGetProductionOrders,
  ApiPostProductionOrder,
  ApiPostProductionOrderApprove,
  ApiPostProductionOrderBatch,
  ApiPostProductionOrderCancel,
  ApiPostProductionOrderComplete,
  ApiPostProductionOrderStart,
} from "../api";
import {
  MANUFACTURING_PAGE_SIZE,
  useManufacturingMutation,
  useManufacturingQuery,
} from "./shared";

export function useProductionOrders(
  page: number,
  filters: {
    status?: string;
    itemId?: string;
    warehouseId?: string;
    searchQuery?: string;
  } = {},
) {
  const query = useManufacturingQuery<ProductionOrderDto>(
    "manufacturing.production.read",
    [
      "manufacturing-orders",
      page,
      filters.status ?? "",
      filters.itemId ?? "",
      filters.warehouseId ?? "",
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetProductionOrders({
        searchParams: {
          page,
          limit: MANUFACTURING_PAGE_SIZE,
          ...filters,
        },
      }),
    ),
  );

  return {
    orders: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
}

export function useActiveOrderOptions() {
  const { hasPermission } = usePermissions();
  const query = useQuery({
    queryKey: ["manufacturing-orders", "active-options"],
    queryFn: TryCatchNullWrap(() =>
      ApiGetProductionOrders({
        searchParams: { page: 1, limit: 100, status: "IN_PROGRESS" },
      }),
    ),
    enabled: hasPermission("manufacturing.production.read"),
    staleTime: 60 * 1000,
  });

  const orders = query.data?.data ?? [];

  return {
    orders,
    labelFor: new Map(
      orders.map((order) => [order.id, `${order.orderNumber} — ${order.plannedQuantity} planned`]),
    ),
    isLoading: query.isLoading,
  };
}

export function useOrderMaterials(orderId?: string) {
  const query = useManufacturingQuery<ProductionOrderMaterialDto>(
    "manufacturing.production.read",
    ["manufacturing-order-materials", orderId ?? ""],
    TryCatchNullWrap(() =>
      ApiGetProductionOrderMaterials({
        slugReplacement: { id: orderId as string },
      }),
    ),
    Boolean(orderId),
  );

  return {
    materials: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
}

const ORDER_KEYS = ["manufacturing-orders", "inventory-reservations"];

export function useCreateProductionOrder() {
  return useManufacturingMutation(ApiPostProductionOrder, [
    ...ORDER_KEYS.map((key) => [key]),
  ]);
}

function useOrderLifecycleMutation(
  operation: (id: string) => Promise<ApiResponse<ProductionOrderDto>>,
) {
  return useManufacturingMutation(operation, ORDER_KEYS.map((key) => [key]));
}

export function useApproveProductionOrder() {
  return useOrderLifecycleMutation((id) =>
    ApiPostProductionOrderApprove({ slugReplacement: { id } }),
  );
}

export function useStartProductionOrder() {
  return useOrderLifecycleMutation((id) =>
    ApiPostProductionOrderStart({ slugReplacement: { id } }),
  );
}

export function useCompleteProductionOrder() {
  return useOrderLifecycleMutation((id) =>
    ApiPostProductionOrderComplete({ slugReplacement: { id } }),
  );
}

export function useCancelProductionOrder() {
  return useOrderLifecycleMutation((id) =>
    ApiPostProductionOrderCancel({ slugReplacement: { id } }),
  );
}

export function useCreateProductionBatch() {
  return useManufacturingMutation<
    ProductionBatchDto,
    { orderId: string; body: { batchNumber?: string; notes?: string } }
  >(
    ({ orderId, body }) =>
      ApiPostProductionOrderBatch({
        slugReplacement: { id: orderId },
        body,
      }),
    [["manufacturing-batches"]],
  );
}
