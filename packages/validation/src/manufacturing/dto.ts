import z from "zod";
import {
  BOM_VERSION_STATUS_LIST,
  PRODUCTION_BATCH_STATUS_LIST,
  PRODUCTION_ORDER_STATUS_LIST,
} from "@rona/config/manufacturing";

export const bomDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  itemId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const bomVersionDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  bomId: z.string(),
  version: z.number(),
  status: z.enum(BOM_VERSION_STATUS_LIST),
  approvedAt: z.date().nullable(),
  approvedBy: z.string().nullable(),
  retiredAt: z.date().nullable(),
  isUsedInProduction: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const bomLineDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  bomVersionId: z.string(),
  componentItemId: z.string(),
  quantityPerUnit: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productionOrderDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderNumber: z.string(),
  bomId: z.string(),
  bomVersionId: z.string(),
  itemId: z.string(),
  warehouseId: z.string(),
  status: z.enum(PRODUCTION_ORDER_STATUS_LIST),
  plannedQuantity: z.string(),
  producedQuantity: z.string(),
  expectedYieldPercent: z.string(),
  actualYieldPercent: z.string().nullable(),
  materialVariance: z
    .array(
      z.object({
        componentItemId: z.string(),
        requiredQuantity: z.string(),
        consumedQuantity: z.string(),
        varianceQuantity: z.string(),
      }),
    )
    .nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  plannedStartDate: z.date().nullable(),
  plannedEndDate: z.date().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productionOrderMaterialDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  productionOrderId: z.string(),
  componentItemId: z.string(),
  requiredQuantity: z.string(),
  reservationId: z.string().nullable(),
  consumedQuantity: z.string(),
  returnedQuantity: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productionBatchDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  productionOrderId: z.string(),
  batchNumber: z.string(),
  status: z.enum(PRODUCTION_BATCH_STATUS_LIST),
  scrapQuantity: z.string(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const materialConsumptionDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  productionBatchId: z.string(),
  itemId: z.string(),
  lotId: z.string(),
  locationId: z.string(),
  quantity: z.string(),
  isScrap: z.boolean(),
  substitutedForItemId: z.string().nullable(),
  movementId: z.string(),
  consumedBy: z.string().nullable(),
  consumedAt: z.date(),
  notes: z.string().nullable(),
});

export const materialReturnDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  productionBatchId: z.string(),
  itemId: z.string(),
  lotId: z.string(),
  locationId: z.string(),
  quantity: z.string(),
  reason: z.string(),
  movementId: z.string(),
  returnedBy: z.string().nullable(),
  returnedAt: z.date(),
  notes: z.string().nullable(),
});

export const productionOutputDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  productionBatchId: z.string(),
  itemId: z.string(),
  lotId: z.string(),
  locationId: z.string(),
  quantity: z.string(),
  scrapQuantity: z.string(),
  unitCost: z.string().nullable(),
  movementId: z.string(),
  recordedBy: z.string().nullable(),
  recordedAt: z.date(),
  notes: z.string().nullable(),
});
