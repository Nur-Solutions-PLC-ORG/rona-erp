import z from "zod";
import {
  ALLOCATION_STRATEGY_LIST,
  ITEM_TYPE_LIST,
  MOVEMENT_TYPE_LIST,
  QUALITY_STATUS_LIST,
  RESERVATION_STATUS_LIST,
} from "@rona/config/inventory";

export const unitOfMeasureDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const itemDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(ITEM_TYPE_LIST),
  unitOfMeasureId: z.string(),
  reorderPoint: z.string().nullable(),
  reorderQuantity: z.string().nullable(),
  barcode: z.string().nullable(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const warehouseDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const warehouseLocationDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  warehouseId: z.string(),
  code: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const lotDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  itemId: z.string(),
  itemName: z.string().nullable().optional(),
  lotNumber: z.string(),
  supplier: z.string().nullable(),
  receiptDate: z.date().nullable(),
  manufactureDate: z.date().nullable(),
  expiryDate: z.date().nullable(),
  qualityStatus: z.enum(QUALITY_STATUS_LIST),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const movementDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: z.enum(MOVEMENT_TYPE_LIST),
  itemId: z.string(),
  lotId: z.string().nullable(),
  fromLocationId: z.string().nullable(),
  toLocationId: z.string().nullable(),
  quantity: z.string(),
  unitCost: z.string().nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  performedBy: z.string().nullable(),
  createdAt: z.date(),
  itemName: z.string().optional(),
  lotNumber: z.string().nullable().optional(),
  fromLocationName: z.string().nullable().optional(),
  toLocationName: z.string().nullable().optional(),
});

export const stockBalanceDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  itemId: z.string(),
  lotId: z.string(),
  locationId: z.string(),
  lotNumber: z.string(),
  locationName: z.string().nullable().optional(),
  warehouseName: z.string().optional(),
  quantity: z.string(),
  reservedQuantity: z.string(),
  updatedAt: z.date(),
  itemName: z.string().optional(),
  lotQualityStatus: z.string().optional(),
  lotExpiryDate: z.date().nullable().optional(),
});

export const reservationDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  itemId: z.string(),
  warehouseId: z.string(),
  status: z.enum(RESERVATION_STATUS_LIST),
  quantity: z.string(),
  allocatedLots: z
    .array(
      z.object({
        lotId: z.string(),
        quantity: z.string(),
      }),
    )
    .nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().nullable(),
  itemName: z.string().optional(),
  warehouseName: z.string().optional(),
});

export const lotAllocationDto = z.object({
  lotId: z.string(),
  locationId: z.string(),
  quantity: z.string(),
});

export const allocationStrategyDto = z.enum(ALLOCATION_STRATEGY_LIST);
