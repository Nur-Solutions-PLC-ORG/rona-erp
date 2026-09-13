import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TryCatchNullWrap } from "@/api";
import { usePermissions } from "@/modules/workspace/hooks";
import type { ApiResponse } from "@rona/types/api";
import type { Permission } from "@rona/types/tenancy";
import {
  ApiGetInspections,
  ApiGetItems,
  ApiGetMovements,
  ApiGetProductionOrders,
  ApiGetStockBalances,
} from "./api";
import type { ItemDto, MovementDto } from "@rona/types/inventory";
import type { ProductionOrderDto } from "@rona/types/manufacturing";
import type { InspectionDto } from "@rona/types/quality";

const DASHBOARD_PAGE_SIZE = 25;

function useDashboardQuery<TDto>(
  permission: Permission,
  queryKey: string[],
  queryFn: () => Promise<ApiResponse<TDto[]> | null>,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission(permission),
  });
}

export const useDashboardItems = () => {
  const query = useDashboardQuery(
    "inventory.item.read",
    ["inventory-items"],
    TryCatchNullWrap(() =>
      ApiGetItems({ searchParams: { limit: DASHBOARD_PAGE_SIZE } }),
    ),
  );

  const items = useMemo(() => query.data?.data ?? [], [query.data]);

  const itemLookup = useMemo(() => {
    const map = new Map<string, ItemDto>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  return {
    items,
    itemLookup,
    isLoading: query.isLoading,
  };
};

export const useDashboardStock = (itemLookup: Map<string, ItemDto>) => {
  const query = useDashboardQuery(
    "inventory.stock.read",
    ["inventory-stock"],
    TryCatchNullWrap(() =>
      ApiGetStockBalances({ searchParams: { limit: DASHBOARD_PAGE_SIZE } }),
    ),
  );

  const balances = useMemo(() => query.data?.data ?? [], [query.data]);

  const perItem = useMemo(() => {
    const map = new Map<
      string,
      { item: ItemDto; onHand: number; reserved: number }
    >();

    for (const balance of balances) {
      const item = itemLookup.get(balance.itemId);
      if (!item) continue;

      const entry = map.get(balance.itemId) ?? {
        item,
        onHand: 0,
        reserved: 0,
      };
      entry.onHand += Number(balance.quantity);
      entry.reserved += Number(balance.reservedQuantity);
      map.set(balance.itemId, entry);
    }

    return [...map.values()].sort((a, b) => b.onHand - a.onHand);
  }, [balances, itemLookup]);

  return {
    balances,
    perItem,
    isLoading: query.isLoading,
  };
};

export const useDashboardMovements = () => {
  const query = useDashboardQuery(
    "inventory.movement.read",
    ["inventory-movements"],
    TryCatchNullWrap(() =>
      ApiGetMovements({ searchParams: { limit: DASHBOARD_PAGE_SIZE } }),
    ),
  );

  const movements = useMemo(
    () => (query.data?.data ?? []) as MovementDto[],
    [query.data],
  );

  return {
    movements,
    isLoading: query.isLoading,
  };
};

export const useDashboardProductionOrders = () => {
  const query = useDashboardQuery(
    "manufacturing.production.read",
    ["manufacturing-orders"],
    TryCatchNullWrap(() =>
      ApiGetProductionOrders({ searchParams: { limit: DASHBOARD_PAGE_SIZE } }),
    ),
  );

  const orders = useMemo(
    () => (query.data?.data ?? []) as ProductionOrderDto[],
    [query.data],
  );

  const openOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== "COMPLETED" && order.status !== "CANCELLED",
      ),
    [orders],
  );

  return {
    orders,
    openOrders,
    isLoading: query.isLoading,
  };
};

export const useDashboardInspections = () => {
  const query = useDashboardQuery(
    "quality.inspection.read",
    ["quality-inspections"],
    TryCatchNullWrap(() =>
      ApiGetInspections({ searchParams: { limit: DASHBOARD_PAGE_SIZE } }),
    ),
  );

  const inspections = useMemo(
    () => (query.data?.data ?? []) as InspectionDto[],
    [query.data],
  );

  const openInspections = useMemo(
    () => inspections.filter((inspection) => inspection.status === "IN_PROGRESS"),
    [inspections],
  );

  return {
    inspections,
    openInspections,
    isLoading: query.isLoading,
  };
};
