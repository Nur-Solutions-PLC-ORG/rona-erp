import { z } from "zod";
import {
  COMMISSION_STATUS_LIST,
  CUSTOMER_STATUS_LIST,
  PAYMENT_TERMS_LIST,
  SALES_ORDER_STATUS_LIST,
} from "@rona/config/sales";
import { paginationSearchParamsSchema } from "../global/api.js";

export const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a non-negative decimal (max 2 dp)");

export const percentSchema = z
  .string()
  .regex(
    /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/,
    "Percentage must be between 0 and 100",
  );

export const salesQuantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, "Quantity must be a positive decimal (max 4 dp)");

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required").max(200),
  phone: z.string().trim().min(7, "Phone is required").max(30),
  email: z.email("Invalid email address").optional().or(z.literal("")),
  vatNumber: z.string().trim().max(50).optional(),
  salespersonUserId: z.string().uuid().optional(),
  status: z.enum(CUSTOMER_STATUS_LIST).optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export const customerContactCreateSchema = z.object({
  name: z.string().trim().min(2, "Contact name is required").max(200),
  phone: z.string().trim().min(7, "Phone is required").max(30),
  email: z.email("Invalid email address").optional().or(z.literal("")),
  title: z.string().trim().max(100).optional(),
  isPrimary: z.boolean().optional(),
});

export const customerContactUpdateSchema =
  customerContactCreateSchema.partial();

export const customerAddressCreateSchema = z.object({
  label: z.string().trim().max(100).optional(),
  line1: z.string().trim().min(1, "Address line 1 is required").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
  isDefault: z.boolean().optional(),
});

export const customerAddressUpdateSchema =
  customerAddressCreateSchema.partial();

export const customerListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(CUSTOMER_STATUS_LIST).optional(),
    salespersonUserId: z.string().uuid().optional(),
  });

export const salesOrderLineSchema = z.object({
  itemId: z.string().uuid("Item is required"),
  quantity: salesQuantitySchema,
  unitPrice: moneySchema,
  discountPercent: percentSchema.optional(),
  vatPercent: percentSchema.optional(),
});

export const salesOrderCreateSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  warehouseId: z.string().uuid("Warehouse is required"),
  salespersonUserId: z.string().uuid().optional(),
  paymentTerms: z.enum(PAYMENT_TERMS_LIST).optional(),
  orderDate: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
  lines: z.array(salesOrderLineSchema).min(1, "At least one line is required"),
});

export const salesOrderListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(SALES_ORDER_STATUS_LIST).optional(),
    customerId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    salespersonUserId: z.string().uuid().optional(),
  });

export const stockAvailabilityParamsSchema = z.object({
  itemId: z.string().uuid("Item is required"),
  warehouseId: z.string().uuid("Warehouse is required"),
});

export const commissionRuleCreateSchema = z.object({
  name: z.string().trim().min(2, "Rule name is required").max(200),
  salespersonUserId: z.string().uuid("Salesperson is required"),
  commissionPercent: percentSchema,
  itemId: z.string().uuid().optional(),
  itemCategory: z
    .enum(["RAW_MATERIAL", "PACKAGING", "CONSUMABLE", "SEMI_FINISHED", "FINISHED_GOOD"])
    .optional(),
  minimumMarginPercent: percentSchema.optional(),
  isActive: z.boolean().optional(),
});

export const commissionRuleUpdateSchema = commissionRuleCreateSchema.partial();

export const commissionRuleListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    salespersonUserId: z.string().uuid().optional(),
    active: z.enum(["true", "false"]).optional(),
  });

export const commissionRecordListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(COMMISSION_STATUS_LIST).optional(),
    salespersonUserId: z.string().uuid().optional(),
  });
