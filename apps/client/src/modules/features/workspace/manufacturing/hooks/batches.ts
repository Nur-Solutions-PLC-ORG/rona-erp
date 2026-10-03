import { TryCatchNullWrap } from "@/api/utils";
import type {
  MaterialConsumptionDto,
  MaterialReturnDto,
  ProductionBatchDto,
  ProductionOutputDto,
} from "@rona/types/manufacturing";
import {
  ApiGetBatches,
  ApiGetBatchConsumptions,
  ApiGetBatchOutputs,
  ApiGetBatchReturns,
  ApiPostBatchComplete,
  ApiPostBatchConsume,
  ApiPostBatchOutput,
  ApiPostBatchReturn,
} from "../api";
import {
  MANUFACTURING_PAGE_SIZE,
  useManufacturingMutation,
  useManufacturingQuery,
} from "./shared";

export function useBatches(
  page: number,
  filters: {
    productionOrderId?: string;
    status?: string;
    searchQuery?: string;
  } = {},
) {
  const query = useManufacturingQuery<ProductionBatchDto>(
    "manufacturing.production.read",
    [
      "manufacturing-batches",
      page,
      filters.productionOrderId ?? "",
      filters.status ?? "",
      filters.searchQuery ?? "",
    ],
    TryCatchNullWrap(() =>
      ApiGetBatches({
        searchParams: {
          page,
          limit: MANUFACTURING_PAGE_SIZE,
          productionOrderId: filters.productionOrderId,
          status: filters.status,
          searchQuery: filters.searchQuery,
        },
      }),
    ),
  );

  return {
    batches: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
}

export function useBatchConsumptions(batchId?: string) {
  const query = useManufacturingQuery<MaterialConsumptionDto>(
    "manufacturing.production.read",
    ["manufacturing-batch-consumptions", batchId ?? ""],
    TryCatchNullWrap(() =>
      ApiGetBatchConsumptions({ slugReplacement: { id: batchId as string } }),
    ),
    Boolean(batchId),
  );

  return {
    consumptions: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useBatchReturns(batchId?: string) {
  const query = useManufacturingQuery<MaterialReturnDto>(
    "manufacturing.production.read",
    ["manufacturing-batch-returns", batchId ?? ""],
    TryCatchNullWrap(() =>
      ApiGetBatchReturns({ slugReplacement: { id: batchId as string } }),
    ),
    Boolean(batchId),
  );

  return {
    returns: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useBatchOutputs(batchId?: string) {
  const query = useManufacturingQuery<ProductionOutputDto>(
    "manufacturing.production.read",
    ["manufacturing-batch-outputs", batchId ?? ""],
    TryCatchNullWrap(() =>
      ApiGetBatchOutputs({ slugReplacement: { id: batchId as string } }),
    ),
    Boolean(batchId),
  );

  return {
    outputs: query.data?.data ?? [],
    isLoading: query.isLoading,
  };
}

const BATCH_KEYS = [
  ["manufacturing-batches"],
  ["manufacturing-orders"],
  ["inventory-stock"],
  ["inventory-movements"],
  ["inventory-lots"],
];

export function useConsumeMaterial() {
  return useManufacturingMutation(ApiPostBatchConsume, [
    ...BATCH_KEYS,
    ["manufacturing-batch-consumptions"],
  ]);
}

export function useReturnMaterial() {
  return useManufacturingMutation(ApiPostBatchReturn, [
    ...BATCH_KEYS,
    ["manufacturing-batch-returns"],
  ]);
}

export function useRecordOutput() {
  return useManufacturingMutation(ApiPostBatchOutput, [
    ...BATCH_KEYS,
    ["manufacturing-batch-outputs"],
  ]);
}

export function useCompleteBatch() {
  return useManufacturingMutation(ApiPostBatchComplete, [...BATCH_KEYS]);
}
