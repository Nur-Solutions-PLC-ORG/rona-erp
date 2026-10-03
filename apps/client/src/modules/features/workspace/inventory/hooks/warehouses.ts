import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { useCreateMutation } from "@/hooks/utils";
import type {
  WarehouseCreateSchema,
  WarehouseDto,
  WarehouseLocationCreateSchema,
  WarehouseLocationDto,
  WarehouseUpdateSchema,
} from "@rona/types/inventory";
import {
  ApiGetWarehouseLocations,
  ApiGetWarehouses,
  ApiPatchWarehouse,
  ApiPostWarehouse,
  ApiPostWarehouseLocation,
} from "../api";
import {
  INVENTORY_PAGE_SIZE,
  LOOKUP_PAGE_SIZE,
  useInventoryQuery,
} from "./shared";

export const useWarehouses = (
  page: number,
  includeInactive = false,
  searchQuery?: string,
) => {
  const query = useInventoryQuery(
    "inventory.warehouse.read",
    ["inventory-warehouses", page, includeInactive, searchQuery ?? ""],
    TryCatchNullWrap(() =>
      ApiGetWarehouses({
        searchParams: {
          page,
          limit: INVENTORY_PAGE_SIZE,
          includeInactive: includeInactive ? "true" : undefined,
          searchQuery: searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    warehouses: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useWarehouseOptions = () => {
  const query = useInventoryQuery(
    "inventory.warehouse.read",
    ["inventory-warehouses-lookup"],
    TryCatchNullWrap(() =>
      ApiGetWarehouses({ searchParams: { limit: LOOKUP_PAGE_SIZE } }),
    ),
  );
  const warehouses = useMemo(
    () => query.data?.data ?? [],
    [query.data],
  );
  const labelFor = useMemo(
    () => new Map(warehouses.map((w) => [w.id, `${w.code} — ${w.name}`])),
    [warehouses],
  );

  return { warehouses, labelFor, isLoading: query.isLoading };
};

export const useWarehouseLocations = (warehouseId: string | undefined) => {
  const query = useInventoryQuery(
    "inventory.warehouse.read",
    ["inventory-warehouse-locations", warehouseId],
    TryCatchNullWrap(() =>
      ApiGetWarehouseLocations({
        slugReplacement: { id: warehouseId ?? "" },
      }),
    ),
    warehouseId !== undefined && warehouseId !== "",
  );

  return {
    locations: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<WarehouseDto, WarehouseCreateSchema>(
    (input) => ApiPostWarehouse({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({
        queryKey: ["inventory-warehouses"],
      });
    },
    (error) => toast.error(error.message),
  );
};

export interface WarehouseUpdateInput extends WarehouseUpdateSchema {
  id: string;
}

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<WarehouseDto, WarehouseUpdateInput>(
    ({ id, ...input }) =>
      ApiPatchWarehouse({ body: input, slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({
        queryKey: ["inventory-warehouses"],
      });
    },
    (error) => toast.error(error.message),
  );
};

export const useCreateWarehouseLocation = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<
    WarehouseLocationDto,
    WarehouseLocationCreateSchema
  >(
    (input) =>
      ApiPostWarehouseLocation({
        body: input,
        slugReplacement: { id: input.warehouseId },
      }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({
        queryKey: ["inventory-warehouse-locations"],
      });
    },
    (error) => toast.error(error.message),
  );
};
