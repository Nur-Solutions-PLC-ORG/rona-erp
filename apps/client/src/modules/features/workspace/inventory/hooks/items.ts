import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { useCreateMutation } from "@/hooks/utils";
import type {
  ItemCreateSchema,
  ItemDto,
  ItemUpdateSchema,
  UnitOfMeasureCreateSchema,
  UnitOfMeasureDto,
} from "@rona/types/inventory";
import {
  ApiGetItems,
  ApiGetUnitsOfMeasure,
  ApiPatchItem,
  ApiPatchItemArchive,
  ApiPostItem,
  ApiPostUnitOfMeasure,
} from "../api";
import {
  INVENTORY_PAGE_SIZE,
  LOOKUP_PAGE_SIZE,
  useInventoryQuery,
} from "./shared";

export interface ItemFilters {
  type?: string;
  includeArchived?: boolean;
  searchQuery?: string;
}

export const useItems = (page: number, filters: ItemFilters = {}) => {
  const query = useInventoryQuery(
    "inventory.item.read",
    [
      "inventory-items",
      page,
      filters.type,
      filters.includeArchived,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetItems({
        searchParams: {
          page,
          limit: INVENTORY_PAGE_SIZE,
          type: filters.type,
          includeArchived: filters.includeArchived ? "true" : undefined,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    items: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useItemOptions = () => {
  const query = useInventoryQuery(
    "inventory.item.read",
    ["inventory-items-lookup"],
    TryCatchNullWrap(() =>
      // Archived items stay referenced by historical records (production
      // orders, BOMs, movements) — include them so names still resolve.
      ApiGetItems({
        searchParams: { limit: LOOKUP_PAGE_SIZE, includeArchived: "true" },
      }),
    ),
  );
  const items = useMemo(
    () => query.data?.data ?? [],
    [query.data],
  );
  const labelFor = useMemo(
    () => new Map(items.map((item) => [item.id, `${item.code} — ${item.name}`])),
    [items],
  );
  const nameFor = useMemo(
    () => new Map(items.map((item) => [item.id, item.name])),
    [items],
  );

  return { items, labelFor, nameFor, isLoading: query.isLoading };
};

export const useUnitsOfMeasure = () => {
  const query = useInventoryQuery(
    "inventory.item.read",
    ["inventory-uom"],
    TryCatchNullWrap(() => ApiGetUnitsOfMeasure()),
  );

  return {
    units: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<ItemDto, ItemCreateSchema>(
    (input) => ApiPostItem({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
    (error) => toast.error(error.message),
  );
};

export interface ItemUpdateInput extends ItemUpdateSchema {
  id: string;
}

export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<ItemDto, ItemUpdateInput>(
    ({ id, ...input }) =>
      ApiPatchItem({ body: input, slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useArchiveItem = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<ItemDto, string>(
    (id) => ApiPatchItemArchive({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useCreateUnitOfMeasure = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<UnitOfMeasureDto, UnitOfMeasureCreateSchema>(
    (input) => ApiPostUnitOfMeasure({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["inventory-uom"] });
    },
    (error) => toast.error(error.message),
  );
};
