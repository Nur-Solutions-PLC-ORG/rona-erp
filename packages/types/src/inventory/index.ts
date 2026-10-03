import z from "zod";
import {
  ALLOCATION_STRATEGY_LIST,
  ITEM_TYPE_LIST,
  MOVEMENT_TYPE_LIST,
  QUALITY_STATUS_LIST,
  RESERVATION_STATUS_LIST,
} from "@rona/config/inventory";
import {
  adjustStockSchema,
  itemListSearchParamsSchema,
  itemCreateSchema,
  itemUpdateSchema,
  issueStockSchema,
  lotCreateSchema,
  lotListSearchParamsSchema,
  lotQualityStatusUpdateSchema,
  movementDto,
  movementListSearchParamsSchema,
  receiveStockSchema,
  reservationCreateSchema,
  reservationDto,
  reservationListSearchParamsSchema,
  returnStockSchema,
  stockBalanceDto,
  stockQueryParamsSchema,
  transferStockSchema,
  unitOfMeasureCreateSchema,
  unitOfMeasureDto,
  warehouseCreateSchema,
  warehouseDto,
  warehouseLocationCreateSchema,
  warehouseLocationDto,
  warehouseListSearchParamsSchema,
  warehouseUpdateSchema,
  itemDto,
  lotDto,
  lotAllocationDto,
} from "@rona/validation/inventory";

export type ItemType = (typeof ITEM_TYPE_LIST)[number];
export type QualityStatus = (typeof QUALITY_STATUS_LIST)[number];
export type MovementType = (typeof MOVEMENT_TYPE_LIST)[number];
export type ReservationStatus = (typeof RESERVATION_STATUS_LIST)[number];
export type AllocationStrategy = (typeof ALLOCATION_STRATEGY_LIST)[number];

export type ItemCreateSchema = z.infer<typeof itemCreateSchema>;
export type ItemUpdateSchema = z.infer<typeof itemUpdateSchema>;
export type ItemListSearchParamsSchema = z.infer<
  typeof itemListSearchParamsSchema
>;
export type UnitOfMeasureCreateSchema = z.infer<
  typeof unitOfMeasureCreateSchema
>;
export type WarehouseCreateSchema = z.infer<typeof warehouseCreateSchema>;
export type WarehouseUpdateSchema = z.infer<typeof warehouseUpdateSchema>;
export type WarehouseListSearchParamsSchema = z.infer<
  typeof warehouseListSearchParamsSchema
>;
export type WarehouseLocationCreateSchema = z.infer<
  typeof warehouseLocationCreateSchema
>;
export type LotCreateSchema = z.infer<typeof lotCreateSchema>;
export type LotQualityStatusUpdateSchema = z.infer<
  typeof lotQualityStatusUpdateSchema
>;
export type LotListSearchParamsSchema = z.infer<
  typeof lotListSearchParamsSchema
>;
export type ReceiveStockSchema = z.infer<typeof receiveStockSchema>;
export type IssueStockSchema = z.infer<typeof issueStockSchema>;
export type TransferStockSchema = z.infer<typeof transferStockSchema>;
export type AdjustStockSchema = z.infer<typeof adjustStockSchema>;
export type ReturnStockSchema = z.infer<typeof returnStockSchema>;
export type StockQueryParamsSchema = z.infer<typeof stockQueryParamsSchema>;
export type MovementListSearchParamsSchema = z.infer<
  typeof movementListSearchParamsSchema
>;
export type ReservationCreateSchema = z.infer<typeof reservationCreateSchema>;
export type ReservationListSearchParamsSchema = z.infer<
  typeof reservationListSearchParamsSchema
>;

export type UnitOfMeasureDto = z.infer<typeof unitOfMeasureDto>;
export type ItemDto = z.infer<typeof itemDto>;
export type WarehouseDto = z.infer<typeof warehouseDto>;
export type WarehouseLocationDto = z.infer<typeof warehouseLocationDto>;
export type LotDto = z.infer<typeof lotDto>;
export type MovementDto = z.infer<typeof movementDto>;
export type StockBalanceDto = z.infer<typeof stockBalanceDto>;
export type ReservationDto = z.infer<typeof reservationDto>;
export type LotAllocation = z.infer<typeof lotAllocationDto>;

export interface StockOperationResult {
  movements: MovementDto[];
  allocations: LotAllocation[];
}

export type ItemCreateInput = ItemCreateSchema;
export type ItemUpdateInput = ItemUpdateSchema;
export type WarehouseCreateInput = WarehouseCreateSchema;
export type WarehouseUpdateInput = WarehouseUpdateSchema;
export type WarehouseLocationCreateInput = WarehouseLocationCreateSchema;
export type LotCreateInput = LotCreateSchema;
export type ReceiveStockInput = ReceiveStockSchema;
export type IssueStockInput = IssueStockSchema;
export type TransferStockInput = TransferStockSchema;
export type AdjustStockInput = AdjustStockSchema;
export type ReturnStockInput = ReturnStockSchema;

export interface Paginated {
  page: number;
  limit: number;
}

export type ItemListParams = ItemListSearchParamsSchema & Paginated;
export type WarehouseListParams = WarehouseListSearchParamsSchema & Paginated;
export type LotListParams = LotListSearchParamsSchema & Paginated;
export type MovementListSearchParams =
  MovementListSearchParamsSchema & Paginated;
export type StockQueryParams = StockQueryParamsSchema & Paginated;
export type ReservationListParams =
  ReservationListSearchParamsSchema & Paginated;

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
