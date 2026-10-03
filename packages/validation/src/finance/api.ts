import { z } from "zod";
import { INVOICE_STATUS_LIST, PAYMENT_METHOD_LIST } from "@rona/config/finance";
import { PAYMENT_TERMS_LIST } from "@rona/config/sales";
import { moneySchema } from "../sales/api.js";
import { paginationSearchParamsSchema } from "../global/api.js";

export const invoiceCreateSchema = z.object({
  salesOrderId: z.string().uuid("Sales order is required"),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  paymentTerms: z.enum(PAYMENT_TERMS_LIST).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const invoiceListSearchParamsSchema = paginationSearchParamsSchema.extend(
  {
    status: z.enum(INVOICE_STATUS_LIST).optional(),
    customerId: z.string().uuid().optional(),
  },
);

export const paymentAllocationSchema = z.object({
  invoiceId: z.string().uuid("Invoice is required"),
  amount: moneySchema,
});

export const paymentCreateSchema = z.object({
  method: z.enum(PAYMENT_METHOD_LIST),
  reference: z
    .string()
    .trim()
    .min(3, "Transaction reference is required")
    .max(100),
  paidAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
  allocations: z
    .array(paymentAllocationSchema)
    .min(1, "At least one invoice allocation is required"),
});

export const paymentUpdateSchema = z.object({
  method: z.enum(PAYMENT_METHOD_LIST).optional(),
  reference: z.string().trim().min(3).max(100).optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const paymentListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    method: z.enum(PAYMENT_METHOD_LIST).optional(),
    invoiceId: z.string().uuid().optional(),
  });

export const costCenterCreateSchema = z.object({
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
  isActive: z.boolean().optional(),
});

export const costCenterUpdateSchema = costCenterCreateSchema.partial();

export const costCreateSchema = z.object({
  type: z.string().trim().min(1, "Type is required").max(80),
  description: z.string().trim().min(1, "Description is required").max(2000),
  amount: moneySchema,
  costDate: z.coerce.date(),
  costCenterId: z.string().uuid().optional(),
});

export const costUpdateSchema = costCreateSchema.partial();

export const costTypeCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
});

export const costListSearchParamsSchema = paginationSearchParamsSchema.extend({
  type: z.string().trim().max(80).optional(),
  costCenterId: z.string().uuid().optional(),
});
