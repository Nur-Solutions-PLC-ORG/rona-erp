import { z } from "zod";
import {
  BOM_VERSION_STATUS_LIST,
  PRODUCTION_BATCH_STATUS_LIST,
  PRODUCTION_ORDER_STATUS_LIST,
} from "@rona/config/manufacturing";
import { paginationSearchParamsSchema } from "../global/api.js";
import { quantitySchema } from "../inventory/api.js";

export const perUnitQuantitySchema = z
  .string()
  .regex(
    /^\d+(\.\d{1,6})?$/,
    "Quantity per unit must be a positive decimal (max 6 dp)",
  );

export const bomLineInputSchema = z.object({
  componentItemId: z.string().min(1, "Component item is required"),
  quantityPerUnit: perUnitQuantitySchema,
  notes: z.string().trim().max(2000).optional(),
});

export const bomCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Code must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    ),
  name: z.string().trim().min(1, "Name is required").max(200),
  itemId: z.string().min(1, "Finished good item is required"),
  description: z.string().trim().max(2000).optional(),
  lines: z.array(bomLineInputSchema).min(1, "At least one BOM line is required"),
});

export const bomUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
});

export const bomVersionCreateSchema = z.object({
  lines: z
    .array(bomLineInputSchema)
    .min(1, "At least one BOM line is required"),
});

export const bomVersionLinesUpdateSchema = z.object({
  lines: z
    .array(bomLineInputSchema)
    .min(1, "At least one BOM line is required"),
});

export const bomListSearchParamsSchema = paginationSearchParamsSchema.extend({
  itemId: z.string().optional(),
  searchQuery: z.string().trim().max(200).optional(),
});

export const bomVersionListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(BOM_VERSION_STATUS_LIST).optional(),
  });

export const productionOrderCreateSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Order number must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    )
    .optional(),
  bomId: z.string().min(1, "BOM is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  plannedQuantity: quantitySchema,
  expectedYieldPercent: quantitySchema.optional(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const productionOrderListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(PRODUCTION_ORDER_STATUS_LIST).optional(),
    itemId: z.string().optional(),
    warehouseId: z.string().optional(),
    searchQuery: z.string().trim().max(200).optional(),
  });

export const batchCreateSchema = z.object({
  batchNumber: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Batch number must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    )
    .optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const batchListSearchParamsSchema = paginationSearchParamsSchema.extend({
  productionOrderId: z.string().optional(),
  status: z.enum(PRODUCTION_BATCH_STATUS_LIST).optional(),
});

export const materialConsumptionSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  lotId: z.string().min(1, "Lot is required"),
  locationId: z.string().min(1, "Location is required"),
  quantity: quantitySchema,
  isScrap: z.boolean().optional(),
  substitutedForItemId: z.string().min(1).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const materialReturnSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  lotId: z.string().min(1, "Lot is required"),
  locationId: z.string().min(1, "Location is required"),
  quantity: quantitySchema,
  reason: z.string().trim().min(1, "Reason is required").max(200),
  notes: z.string().trim().max(2000).optional(),
});

export const productionOutputSchema = z.object({
  lotNumber: z
    .string()
    .trim()
    .min(1, "Lot number is required")
    .max(100),
  locationId: z.string().min(1, "Location is required"),
  quantity: quantitySchema,
  scrapQuantity: quantitySchema.optional(),
  unitCost: quantitySchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});
