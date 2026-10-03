import { Request } from "@/api";
import {
  API_INVENTORY_ITEM_ARCHIVE_URL,
  API_INVENTORY_ITEM_DETAILS_URL,
  API_INVENTORY_ITEMS_URL,
  API_INVENTORY_LOT_QUALITY_STATUS_URL,
  API_INVENTORY_LOTS_URL,
  API_INVENTORY_MOVEMENTS_URL,
  API_INVENTORY_RESERVATION_CONSUME_URL,
  API_INVENTORY_RESERVATION_RELEASE_URL,
  API_INVENTORY_RESERVATIONS_URL,
  API_INVENTORY_STOCK_ADJUST_URL,
  API_INVENTORY_STOCK_ISSUE_URL,
  API_INVENTORY_STOCK_RECEIVE_URL,
  API_INVENTORY_STOCK_RETURN_URL,
  API_INVENTORY_STOCK_TRANSFER_URL,
  API_INVENTORY_STOCK_URL,
  API_INVENTORY_UNITS_OF_MEASURE_URL,
  API_INVENTORY_WAREHOUSE_DETAILS_URL,
  API_INVENTORY_WAREHOUSE_LOCATIONS_URL,
  API_INVENTORY_WAREHOUSES_URL,
} from "@rona/routes/workspace";
import type {
  AdjustStockSchema,
  IssueStockSchema,
  ItemCreateSchema,
  ItemUpdateSchema,
  LotCreateSchema,
  LotQualityStatusUpdateSchema,
  MovementDto,
  ReceiveStockSchema,
  ReservationCreateSchema,
  ReservationDto,
  ReturnStockSchema,
  StockBalanceDto,
  TransferStockSchema,
  UnitOfMeasureCreateSchema,
  WarehouseCreateSchema,
  WarehouseLocationCreateSchema,
  WarehouseUpdateSchema,
  ItemDto,
  LotDto,
  UnitOfMeasureDto,
  WarehouseDto,
  WarehouseLocationDto,
} from "@rona/types/inventory";

export const ApiGetItems = Request<ItemDto[]>("get", API_INVENTORY_ITEMS_URL);
export const ApiPostItem = Request<ItemDto, ItemCreateSchema>(
  "post",
  API_INVENTORY_ITEMS_URL,
);
export const ApiPatchItem = Request<ItemDto, ItemUpdateSchema>(
  "patch",
  API_INVENTORY_ITEM_DETAILS_URL,
);
export const ApiPatchItemArchive = Request<ItemDto>(
  "patch",
  API_INVENTORY_ITEM_ARCHIVE_URL,
);

export const ApiGetUnitsOfMeasure = Request<UnitOfMeasureDto[]>(
  "get",
  API_INVENTORY_UNITS_OF_MEASURE_URL,
);
export const ApiPostUnitOfMeasure = Request<
  UnitOfMeasureDto,
  UnitOfMeasureCreateSchema
>("post", API_INVENTORY_UNITS_OF_MEASURE_URL);

export const ApiGetWarehouses = Request<WarehouseDto[]>(
  "get",
  API_INVENTORY_WAREHOUSES_URL,
);
export const ApiPostWarehouse = Request<WarehouseDto, WarehouseCreateSchema>(
  "post",
  API_INVENTORY_WAREHOUSES_URL,
);
export const ApiPatchWarehouse = Request<WarehouseDto, WarehouseUpdateSchema>(
  "patch",
  API_INVENTORY_WAREHOUSE_DETAILS_URL,
);
export const ApiGetWarehouseLocations = Request<WarehouseLocationDto[]>(
  "get",
  API_INVENTORY_WAREHOUSE_LOCATIONS_URL,
);
export const ApiPostWarehouseLocation = Request<
  WarehouseLocationDto,
  WarehouseLocationCreateSchema
>("post", API_INVENTORY_WAREHOUSE_LOCATIONS_URL);

export const ApiGetLots = Request<LotDto[]>("get", API_INVENTORY_LOTS_URL);
export const ApiPostLot = Request<LotDto, LotCreateSchema>(
  "post",
  API_INVENTORY_LOTS_URL,
);
export const ApiPatchLotQualityStatus = Request<
  LotDto,
  LotQualityStatusUpdateSchema
>("patch", API_INVENTORY_LOT_QUALITY_STATUS_URL);

export const ApiGetStockBalances = Request<StockBalanceDto[]>(
  "get",
  API_INVENTORY_STOCK_URL,
);
export const ApiGetMovements = Request<MovementDto[]>(
  "get",
  API_INVENTORY_MOVEMENTS_URL,
);

export const ApiPostStockReceive = Request<unknown, ReceiveStockSchema>(
  "post",
  API_INVENTORY_STOCK_RECEIVE_URL,
);
export const ApiPostStockIssue = Request<unknown, IssueStockSchema>(
  "post",
  API_INVENTORY_STOCK_ISSUE_URL,
);
export const ApiPostStockTransfer = Request<unknown, TransferStockSchema>(
  "post",
  API_INVENTORY_STOCK_TRANSFER_URL,
);
export const ApiPostStockAdjust = Request<unknown, AdjustStockSchema>(
  "post",
  API_INVENTORY_STOCK_ADJUST_URL,
);
export const ApiPostStockReturn = Request<unknown, ReturnStockSchema>(
  "post",
  API_INVENTORY_STOCK_RETURN_URL,
);

export const ApiGetReservations = Request<ReservationDto[]>(
  "get",
  API_INVENTORY_RESERVATIONS_URL,
);
export const ApiPostReservation = Request<
  ReservationDto,
  ReservationCreateSchema
>("post", API_INVENTORY_RESERVATIONS_URL);
export const ApiPostReservationRelease = Request<ReservationDto>(
  "post",
  API_INVENTORY_RESERVATION_RELEASE_URL,
);
export const ApiPostReservationConsume = Request<ReservationDto>(
  "post",
  API_INVENTORY_RESERVATION_CONSUME_URL,
);
