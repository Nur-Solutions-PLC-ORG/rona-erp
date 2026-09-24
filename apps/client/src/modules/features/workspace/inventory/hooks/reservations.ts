import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { useCreateMutation } from "@/hooks/utils";
import type { ApiResponse } from "@rona/types/api";
import type {
  ReservationCreateSchema,
  ReservationDto,
} from "@rona/types/inventory";
import {
  ApiGetReservations,
  ApiPostReservation,
  ApiPostReservationConsume,
  ApiPostReservationRelease,
} from "../api";
import { INVENTORY_PAGE_SIZE, useInventoryQuery } from "./shared";

export interface ReservationFilters {
  itemId?: string;
  warehouseId?: string;
  status?: string;
  searchQuery?: string;
}

export const useReservations = (
  page: number,
  filters: ReservationFilters = {},
) => {
  const query = useInventoryQuery(
    "inventory.reservation.read",
    [
      "inventory-reservations",
      page,
      filters.itemId,
      filters.warehouseId,
      filters.status,
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetReservations({
        searchParams: {
          page,
          limit: INVENTORY_PAGE_SIZE,
          itemId: filters.itemId,
          warehouseId: filters.warehouseId,
          status: filters.status,
          searchQuery: filters.searchQuery || undefined,
        },
      }),
    ),
  );

  return {
    reservations: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<ReservationDto, ReservationCreateSchema>(
    (input) => ApiPostReservation({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({
        queryKey: ["inventory-reservations"],
      });
      void queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
    },
    (error) => toast.error(error.message),
  );
};

function useReservationAction(
  operation: (id: string) => Promise<ApiResponse<ReservationDto>>,
) {
  const queryClient = useQueryClient();

  return useCreateMutation<ReservationDto, string>(
    operation,
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({
        queryKey: ["inventory-reservations"],
      });
      void queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    (error) => toast.error(error.message),
  );
}

export const useReleaseReservation = () =>
  useReservationAction((id) =>
    ApiPostReservationRelease({ slugReplacement: { id } }),
  );

export const useConsumeReservation = () =>
  useReservationAction((id) =>
    ApiPostReservationConsume({ slugReplacement: { id } }),
  );
