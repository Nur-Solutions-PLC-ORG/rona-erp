import { Request } from "@/api";
import {
  API_INVENTORY_ITEMS_URL,
  API_INVENTORY_MOVEMENTS_URL,
  API_INVENTORY_STOCK_URL,
  API_MANUFACTURING_PRODUCTION_ORDERS_URL,
  API_QUALITY_INSPECTIONS_URL,
} from "@rona/routes/workspace";
import type {
  ItemDto,
  MovementDto,
  StockBalanceDto,
} from "@rona/types/inventory";
import type { ProductionOrderDto } from "@rona/types/manufacturing";
import type { InspectionDto } from "@rona/types/quality";

export const ApiGetItems = Request<ItemDto[]>("get", API_INVENTORY_ITEMS_URL);

export const ApiGetStockBalances = Request<StockBalanceDto[]>(
  "get",
  API_INVENTORY_STOCK_URL,
);

export const ApiGetMovements = Request<MovementDto[]>(
  "get",
  API_INVENTORY_MOVEMENTS_URL,
);

export const ApiGetProductionOrders = Request<ProductionOrderDto[]>(
  "get",
  API_MANUFACTURING_PRODUCTION_ORDERS_URL,
);

export const ApiGetInspections = Request<InspectionDto[]>(
  "get",
  API_QUALITY_INSPECTIONS_URL,
);
