import { z } from "zod";
import {
  ALLOCATION_STRATEGY_LIST,
  ITEM_TYPE_LIST,
  MOVEMENT_TYPE_LIST,
  NON_ALLOCATABLE_QUALITY_STATUSES,
  QUALITY_STATUS_LIST,
  RESERVATION_STATUS_LIST,
} from "@rona/config/inventory";
import { paginationSearchParamsSchema } from "../global/api.js";

export const quantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, "Quantity must be a positive decimal (max 4 dp)");

export const signedQuantitySchema = z
  .string()
  .regex(
    /^-?\d+(\.\d{1,4})?$/,
    "Quantity must be a decimal (max 4 dp), optionally negative",
  );

export const itemCreateSchema = z.object({
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
  description: z.string().trim().max(2000).optional(),
  type: z.enum(ITEM_TYPE_LIST),
  unitOfMeasureId: z.string().min(1, "Unit of measure is required"),
  reorderPoint: quantitySchema.optional(),
  reorderQuantity: quantitySchema.optional(),
  barcode: z.string().trim().max(100).optional(),
  isArchived: z.boolean().optional(),
});

export const itemUpdateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Code must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    )
    .optional(),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(ITEM_TYPE_LIST).optional(),
  unitOfMeasureId: z.string().min(1).optional(),
  reorderPoint: quantitySchema.optional(),
  reorderQuantity: quantitySchema.optional(),
  barcode: z.string().trim().max(100).optional(),
  isArchived: z.boolean().optional(),
});

export const itemListSearchParamsSchema = paginationSearchParamsSchema.extend({
  type: z.enum(ITEM_TYPE_LIST).optional(),
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const unitOfMeasureCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(20)
    .regex(/^[A-Za-z0-9]+$/, "Code must be alphanumeric"),
  name: z.string().trim().min(1, "Name is required").max(100),
});

export const warehouseCreateSchema = z.object({
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
  address: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const warehouseUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  address: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const warehouseLocationCreateSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
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
  isActive: z.boolean().optional(),
});

export const warehouseListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    includeInactive: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
  });

export const lotCreateSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  lotNumber: z
    .string()
    .trim()
    .min(1, "Lot number is required")
    .max(100),
  supplier: z.string().trim().max(200).optional(),
  receiptDate: z.coerce.date().optional(),
  manufactureDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  qualityStatus: z.enum(QUALITY_STATUS_LIST).optional(),
});

export const lotQualityStatusUpdateSchema = z.object({
  qualityStatus: z.enum(QUALITY_STATUS_LIST),
});

export const lotListSearchParamsSchema = paginationSearchParamsSchema.extend({
  itemId: z.string().optional(),
  qualityStatus: z.enum(QUALITY_STATUS_LIST).optional(),
  excludeExpired: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const receiveStockSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  locationId: z.string().min(1, "Location is required"),
  quantity: quantitySchema,
  unitCost: quantitySchema.optional(),
  lotNumber: z.string().trim().min(1, "Lot number is required").max(100),
  supplier: z.string().trim().max(200).optional(),
  manufactureDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const issueStockSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: quantitySchema,
  strategy: z.enum(ALLOCATION_STRATEGY_LIST).optional(),
  locationId: z.string().optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const transferStockSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  fromWarehouseId: z.string().min(1, "Source warehouse is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  quantity: quantitySchema,
  strategy: z.enum(ALLOCATION_STRATEGY_LIST).optional(),
  toLocationId: z.string().min(1, "Destination location is required"),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const adjustStockSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  locationId: z.string().min(1, "Location is required"),
  lotId: z.string().min(1, "Lot is required"),
  quantityDelta: signedQuantitySchema,
  reason: z.string().trim().min(1, "Reason is required").max(200),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const returnStockSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  locationId: z.string().min(1, "Location is required"),
  lotId: z.string().min(1, "Lot is required"),
  quantity: quantitySchema,
  reason: z.string().trim().min(1, "Reason is required").max(200),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const stockQueryParamsSchema = paginationSearchParamsSchema.extend({
  itemId: z.string().optional(),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  lotId: z.string().optional(),
});

export const movementListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    itemId: z.string().optional(),
    warehouseId: z.string().optional(),
    locationId: z.string().optional(),
    lotId: z.string().optional(),
    type: z.enum(MOVEMENT_TYPE_LIST).optional(),
  });

export const reservationCreateSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: quantitySchema,
  strategy: z.enum(ALLOCATION_STRATEGY_LIST).optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const reservationListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    itemId: z.string().optional(),
    warehouseId: z.string().optional(),
    status: z.enum(RESERVATION_STATUS_LIST).optional(),
  });

export { NON_ALLOCATABLE_QUALITY_STATUSES };
