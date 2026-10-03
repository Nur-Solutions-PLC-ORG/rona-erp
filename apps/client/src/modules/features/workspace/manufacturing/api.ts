import { Request } from "@/api";
import {
  API_MANUFACTURING_BATCH_COMPLETE_URL,
  API_MANUFACTURING_BATCH_CONSUME_URL,
  API_MANUFACTURING_BATCH_CONSUMPTIONS_URL,
  API_MANUFACTURING_BATCH_OUTPUT_URL,
  API_MANUFACTURING_BATCH_OUTPUTS_URL,
  API_MANUFACTURING_BATCH_RETURNS_URL,
  API_MANUFACTURING_BATCH_RETURN_URL,
  API_MANUFACTURING_BATCHES_URL,
  API_MANUFACTURING_BOM_DETAILS_URL,
  API_MANUFACTURING_BOM_VERSIONS_URL,
  API_MANUFACTURING_BOM_VERSION_APPROVE_URL,
  API_MANUFACTURING_BOM_VERSION_RETIRE_URL,
  API_MANUFACTURING_BOMS_URL,
  API_MANUFACTURING_PRODUCTION_ORDER_APPROVE_URL,
  API_MANUFACTURING_PRODUCTION_ORDER_BATCHES_URL,
  API_MANUFACTURING_PRODUCTION_ORDER_CANCEL_URL,
  API_MANUFACTURING_PRODUCTION_ORDER_COMPLETE_URL,
  API_MANUFACTURING_PRODUCTION_ORDER_MATERIALS_URL,
  API_MANUFACTURING_PRODUCTION_ORDER_START_URL,
  API_MANUFACTURING_PRODUCTION_ORDERS_URL,
} from "@rona/routes/workspace";
import type {
  BatchCreateSchema,
  BomCreateSchema,
  BomUpdateSchema,
  BomVersionCreateSchema,
  BomVersionDto,
  BomDto,
  MaterialConsumptionDto,
  MaterialConsumptionSchema,
  MaterialReturnDto,
  MaterialReturnSchema,
  ProductionBatchDto,
  ProductionOutputDto,
  ProductionOutputSchema,
  ProductionOrderDto,
  ProductionOrderCreateSchema,
  ProductionOrderMaterialDto,
} from "@rona/types/manufacturing";

export const ApiGetBoms = Request<BomDto[]>("get", API_MANUFACTURING_BOMS_URL);
export const ApiPostBom = Request<BomDto, BomCreateSchema>(
  "post",
  API_MANUFACTURING_BOMS_URL,
);
export const ApiPatchBom = Request<BomDto, BomUpdateSchema>(
  "patch",
  API_MANUFACTURING_BOM_DETAILS_URL,
);

export const ApiGetBomVersions = Request<BomVersionDto[]>(
  "get",
  API_MANUFACTURING_BOM_VERSIONS_URL,
);
export const ApiPostBomVersion = Request<BomVersionDto, BomVersionCreateSchema>(
  "post",
  API_MANUFACTURING_BOM_VERSIONS_URL,
);
export const ApiPostBomVersionApprove = Request<BomVersionDto>(
  "post",
  API_MANUFACTURING_BOM_VERSION_APPROVE_URL,
);
export const ApiPostBomVersionRetire = Request<BomVersionDto>(
  "post",
  API_MANUFACTURING_BOM_VERSION_RETIRE_URL,
);

export const ApiGetProductionOrders = Request<ProductionOrderDto[]>(
  "get",
  API_MANUFACTURING_PRODUCTION_ORDERS_URL,
);
export const ApiPostProductionOrder = Request<
  ProductionOrderDto,
  ProductionOrderCreateSchema
>("post", API_MANUFACTURING_PRODUCTION_ORDERS_URL);
export const ApiGetProductionOrderMaterials = Request<
  ProductionOrderMaterialDto[]
>("get", API_MANUFACTURING_PRODUCTION_ORDER_MATERIALS_URL);

export const ApiPostProductionOrderApprove = Request<ProductionOrderDto>(
  "post",
  API_MANUFACTURING_PRODUCTION_ORDER_APPROVE_URL,
);
export const ApiPostProductionOrderStart = Request<ProductionOrderDto>(
  "post",
  API_MANUFACTURING_PRODUCTION_ORDER_START_URL,
);
export const ApiPostProductionOrderComplete = Request<ProductionOrderDto>(
  "post",
  API_MANUFACTURING_PRODUCTION_ORDER_COMPLETE_URL,
);
export const ApiPostProductionOrderCancel = Request<ProductionOrderDto>(
  "post",
  API_MANUFACTURING_PRODUCTION_ORDER_CANCEL_URL,
);
export const ApiPostProductionOrderBatch = Request<
  ProductionBatchDto,
  BatchCreateSchema
>("post", API_MANUFACTURING_PRODUCTION_ORDER_BATCHES_URL);

export const ApiGetBatches = Request<ProductionBatchDto[]>(
  "get",
  API_MANUFACTURING_BATCHES_URL,
);
export const ApiGetBatchConsumptions = Request<MaterialConsumptionDto[]>(
  "get",
  API_MANUFACTURING_BATCH_CONSUMPTIONS_URL,
);
export const ApiGetBatchReturns = Request<MaterialReturnDto[]>(
  "get",
  API_MANUFACTURING_BATCH_RETURNS_URL,
);
export const ApiGetBatchOutputs = Request<ProductionOutputDto[]>(
  "get",
  API_MANUFACTURING_BATCH_OUTPUTS_URL,
);

export const ApiPostBatchConsume = Request<
  MaterialConsumptionDto,
  MaterialConsumptionSchema
>("post", API_MANUFACTURING_BATCH_CONSUME_URL);
export const ApiPostBatchReturn = Request<MaterialReturnDto, MaterialReturnSchema>(
  "post",
  API_MANUFACTURING_BATCH_RETURN_URL,
);
export const ApiPostBatchOutput = Request<
  ProductionOutputDto,
  ProductionOutputSchema
>("post", API_MANUFACTURING_BATCH_OUTPUT_URL);
export const ApiPostBatchComplete = Request<ProductionBatchDto>(
  "post",
  API_MANUFACTURING_BATCH_COMPLETE_URL,
);
