import z from "zod";
import {
  BOM_VERSION_STATUS_LIST,
  PRODUCTION_BATCH_STATUS_LIST,
  PRODUCTION_ORDER_STATUS_LIST,
} from "@rona/config/manufacturing";
import {
  batchCreateSchema,
  batchListSearchParamsSchema,
  bomCreateSchema,
  bomLineDto,
  bomListSearchParamsSchema,
  bomUpdateSchema,
  bomVersionCreateSchema,
  bomVersionDto,
  bomVersionLinesUpdateSchema,
  bomVersionListSearchParamsSchema,
  bomDto,
  materialConsumptionDto,
  materialConsumptionSchema,
  materialReturnDto,
  materialReturnSchema,
  productionBatchDto,
  productionOrderDto,
  productionOrderCreateSchema,
  productionOrderListSearchParamsSchema,
  productionOrderMaterialDto,
  productionOutputDto,
  productionOutputSchema,
} from "@rona/validation/manufacturing";

export type BomVersionStatus = (typeof BOM_VERSION_STATUS_LIST)[number];
export type ProductionOrderStatus =
  (typeof PRODUCTION_ORDER_STATUS_LIST)[number];
export type ProductionBatchStatus =
  (typeof PRODUCTION_BATCH_STATUS_LIST)[number];

export type BomCreateSchema = z.infer<typeof bomCreateSchema>;
export type BomUpdateSchema = z.infer<typeof bomUpdateSchema>;
export type BomListSearchParamsSchema = z.infer<
  typeof bomListSearchParamsSchema
>;
export type BomVersionCreateSchema = z.infer<typeof bomVersionCreateSchema>;
export type BomVersionLinesUpdateSchema = z.infer<
  typeof bomVersionLinesUpdateSchema
>;
export type BomVersionListSearchParamsSchema = z.infer<
  typeof bomVersionListSearchParamsSchema
>;
export type ProductionOrderCreateSchema = z.infer<
  typeof productionOrderCreateSchema
>;
export type ProductionOrderListSearchParamsSchema = z.infer<
  typeof productionOrderListSearchParamsSchema
>;
export type BatchCreateSchema = z.infer<typeof batchCreateSchema>;
export type BatchListSearchParamsSchema = z.infer<
  typeof batchListSearchParamsSchema
>;
export type MaterialConsumptionSchema = z.infer<
  typeof materialConsumptionSchema
>;
export type MaterialReturnSchema = z.infer<typeof materialReturnSchema>;
export type ProductionOutputSchema = z.infer<typeof productionOutputSchema>;

export type BomDto = z.infer<typeof bomDto>;
export type BomVersionDto = z.infer<typeof bomVersionDto>;
export type BomLineDto = z.infer<typeof bomLineDto>;
export type ProductionOrderDto = z.infer<typeof productionOrderDto>;
export type ProductionOrderMaterialDto = z.infer<
  typeof productionOrderMaterialDto
>;
export type ProductionBatchDto = z.infer<typeof productionBatchDto>;
export type MaterialConsumptionDto = z.infer<typeof materialConsumptionDto>;
export type MaterialReturnDto = z.infer<typeof materialReturnDto>;
export type ProductionOutputDto = z.infer<typeof productionOutputDto>;

export type BomCreateInput = BomCreateSchema;
export type BomUpdateInput = BomUpdateSchema;
export type BomVersionCreateInput = BomVersionCreateSchema;
export type BomVersionLinesUpdateInput = BomVersionLinesUpdateSchema;
export type ProductionOrderCreateInput = ProductionOrderCreateSchema;
export type BatchCreateInput = BatchCreateSchema;
export type MaterialConsumptionInput = MaterialConsumptionSchema;
export type MaterialReturnInput = MaterialReturnSchema;
export type ProductionOutputInput = ProductionOutputSchema;

export interface Paginated {
  page: number;
  limit: number;
}

export type BomListParams = BomListSearchParamsSchema & Paginated;
export type ProductionOrderListParams =
  ProductionOrderListSearchParamsSchema & Paginated;
export type BatchListParams = BatchListSearchParamsSchema & Paginated;

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface MaterialVarianceEntry {
  componentItemId: string;
  requiredQuantity: string;
  consumedQuantity: string;
  varianceQuantity: string;
}
