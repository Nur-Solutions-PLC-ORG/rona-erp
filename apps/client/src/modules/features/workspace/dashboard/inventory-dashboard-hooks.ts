import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { TryCatchNullWrap } from "@/api";
import { allocatePercentages } from "@/lib/format";
import type { ItemDto, WarehouseDto } from "@rona/types/inventory";
import type { SearchResult } from "./components/shell";
import {
  ApiGetWarehouseLocations,
  ApiGetWarehouses,
} from "../inventory/api";
import { useInventoryQuery } from "../inventory/hooks/shared";
import { ApiGetItems, ApiGetStockBalances } from "./api";

const ITEMS_LIMIT = 1000;
const STOCK_LIMIT = 200;
const WAREHOUSES_LIMIT = 100;
const TOP_LOCATIONS_PER_ITEM = 2;

export type StockStatus = "OUT" | "LOW" | "OK";

export interface ItemStockRow {
  item: ItemDto;
  onHand: number;
  reserved: number;
  status: StockStatus;
  locations: string[];
}

export interface WarehouseStock {
  warehouse: WarehouseDto;
  onHand: number;
  share: number;
}

function statusOf(onHand: number, reorder: number | null): StockStatus {
  if (onHand <= 0) return "OUT";
  if (reorder !== null && onHand <= reorder) return "LOW";
  return "OK";
}

export const useInventoryDashboardData = () => {
  const itemsQuery = useInventoryQuery(
    "inventory.item.read",
    ["inventory-items"],
    TryCatchNullWrap(() =>
      ApiGetItems({ searchParams: { limit: String(ITEMS_LIMIT) } }),
    ),
  );

  const stockQuery = useInventoryQuery(
    "inventory.stock.read",
    ["inventory-stock"],
    TryCatchNullWrap(() =>
      ApiGetStockBalances({ searchParams: { limit: String(STOCK_LIMIT) } }),
    ),
  );

  const warehousesQuery = useInventoryQuery(
    "inventory.warehouse.read",
    ["inventory-warehouses"],
    TryCatchNullWrap(() =>
      ApiGetWarehouses({ searchParams: { limit: String(WAREHOUSES_LIMIT) } }),
    ),
  );

  const items = itemsQuery.data?.data ?? [];
  const balances = stockQuery.data?.data ?? [];
  const warehouses = warehousesQuery.data?.data ?? [];
  const isLoading =
    itemsQuery.isLoading || stockQuery.isLoading || warehousesQuery.isLoading;

  const locationResults = useQueries({
    queries: warehouses.map((warehouse) => ({
      queryKey: ["inventory-warehouse-locations", warehouse.id],
      queryFn: () =>
        ApiGetWarehouseLocations({ slugReplacement: { id: warehouse.id } }),
    })),
  });

  const locations = useMemo(
    () => locationResults.flatMap((query) => query.data?.data ?? []),
    [locationResults],
  );

  const locationMap = useMemo(() => {
    const map = new Map<
      string,
      { warehouse: WarehouseDto; locationName: string; locationCode: string }
    >();
    for (const location of locations) {
      const warehouse = warehouses.find((w) => w.id === location.warehouseId);
      if (!warehouse) continue;
      map.set(location.id, {
        warehouse,
        locationName: location.name,
        locationCode: location.code,
      });
    }
    return map;
  }, [locations, warehouses]);

  const locationByWarehouse = useMemo(() => {
    const map = new Map<string, number>();
    for (const balance of balances) {
      const entry = locationMap.get(balance.locationId);
      if (!entry) continue;
      map.set(
        entry.warehouse.id,
        (map.get(entry.warehouse.id) ?? 0) + Number(balance.quantity),
      );
    }
    return map;
  }, [balances, locationMap]);

  const warehouseStock = useMemo<WarehouseStock[]>(() => {
    const active = warehouses.filter((w) => w.isActive);
    const allocated = allocatePercentages(
      active,
      (warehouse) => locationByWarehouse.get(warehouse.id) ?? 0,
    );
    return active
      .map((warehouse, index) => ({
        warehouse,
        onHand: locationByWarehouse.get(warehouse.id) ?? 0,
        share: allocated[index]?.share ?? 0,
      }))
      .sort((a, b) => b.onHand - a.onHand);
  }, [warehouses, locationByWarehouse]);

  const itemRows = useMemo<ItemStockRow[]>(() => {
    const totals = new Map<
      string,
      { onHand: number; reserved: number; perLocation: Map<string, number> }
    >();
    for (const balance of balances) {
      const entry = totals.get(balance.itemId) ?? {
        onHand: 0,
        reserved: 0,
        perLocation: new Map<string, number>(),
      };
      entry.onHand += Number(balance.quantity);
      entry.reserved += Number(balance.reservedQuantity);
      entry.perLocation.set(
        balance.locationId,
        (entry.perLocation.get(balance.locationId) ?? 0) + Number(balance.quantity),
      );
      totals.set(balance.itemId, entry);
    }

    const rows: ItemStockRow[] = [];
    for (const item of items) {
      if (item.isArchived) continue;
      const total = totals.get(item.id);
      const onHand = total?.onHand ?? 0;
      const reorder = item.reorderPoint !== null ? Number(item.reorderPoint) : null;
      const tracked = total !== undefined || reorder !== null;
      if (!tracked) continue;

      const locationsForItem = total
        ? [...total.perLocation.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, TOP_LOCATIONS_PER_ITEM)
            .map(([id]) => {
              const entry = locationMap.get(id);
              return entry
                ? `${entry.warehouse.code} / ${entry.locationCode}`
                : "—";
            })
        : [];

      rows.push({
        item,
        onHand,
        reserved: total?.reserved ?? 0,
        status: statusOf(onHand, reorder),
        locations: locationsForItem.length ? locationsForItem : ["—"],
      });
    }

    const order: StockStatus[] = ["OUT", "LOW", "OK"];
    return rows.sort(
      (a, b) => order.indexOf(a.status) - order.indexOf(b.status),
    );
  }, [items, balances, locationMap]);

  const totals = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const row of itemRows) {
      if (row.status === "OUT") out += 1;
      else if (row.status === "LOW") low += 1;
    }
    return { low, out };
  }, [itemRows]);

  const primaryWarehouse = warehouses.find((w) => w.isActive) ?? warehouses[0];

  const searchIndex = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];
    for (const item of items) {
      results.push({
        type: "item",
        label: `${item.code} — ${item.name}`,
        hint: `Stock ${itemRows.find((r) => r.item.id === item.id)?.onHand ?? 0}`,
        href: "/inventory/items",
      });
    }
    for (const w of warehouses) {
      results.push({
        type: "warehouse",
        label: w.name,
        hint: w.code,
        href: "/inventory/warehouses",
      });
    }
    for (const location of locations) {
      const entry = locationMap.get(location.id);
      if (!entry) continue;
      results.push({
        type: "location",
        label: `${entry.warehouse.code} / ${location.name}`,
        hint: location.code,
        href: "/inventory/warehouses",
      });
    }
    return results;
  }, [items, warehouses, locations, locationMap, itemRows]);

  return {
    isLoading,
    items,
    itemRows,
    warehouseStock,
    primaryWarehouse,
    lowCount: totals.low,
    outCount: totals.out,
    searchIndex,
    keyResultsLoading: locationResults.some((q) => q.isLoading),
  };
};
