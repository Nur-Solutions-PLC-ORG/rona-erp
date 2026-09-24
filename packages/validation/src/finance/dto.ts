import z from "zod";
import { INVOICE_STATUS_LIST, PAYMENT_METHOD_LIST } from "@rona/config/finance";
import { PAYMENT_TERMS_LIST } from "@rona/config/sales";

export const invoiceLineDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceId: z.string(),
  description: z.string(),
  itemId: z.string().nullable(),
  quantity: z.string(),
  unitPrice: z.string(),
  discountPercent: z.string(),
  vatPercent: z.string(),
  lineNet: z.string(),
  lineVat: z.string(),
  lineTotal: z.string(),
});

export const invoiceDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceNumber: z.string().nullable(),
  customerId: z.string(),
  customerName: z.string().nullable(),
  customerVatNumber: z.string().nullable(),
  salesOrderId: z.string().nullable(),
  orderNumber: z.string().nullable(),
  salespersonUserId: z.string().nullable(),
  status: z.enum(INVOICE_STATUS_LIST),
  issueDate: z.date().nullable(),
  dueDate: z.date().nullable(),
  paymentTerms: z.enum(PAYMENT_TERMS_LIST).nullable(),
  subtotal: z.string(),
  discountTotal: z.string(),
  vatTotal: z.string(),
  total: z.string(),
  paidTotal: z.string(),
  remainingBalance: z.string(),
  notes: z.string().nullable(),
  issuedAt: z.date().nullable(),
  voidedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const invoiceDetailDto = invoiceDto.extend({
  lines: z.array(invoiceLineDto),
});

export const paymentDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  method: z.enum(PAYMENT_METHOD_LIST),
  amount: z.string(),
  reference: z.string(),
  paidAt: z.date(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

export const paymentAllocationDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  paymentId: z.string(),
  paymentMethod: z.enum(PAYMENT_METHOD_LIST).nullable(),
  paymentReference: z.string().nullable(),
  paymentPaidAt: z.date().nullable(),
  invoiceId: z.string(),
  amount: z.string(),
});

export const invoicePaymentDto = paymentDto.extend({
  allocations: z.array(paymentAllocationDto),
});

export const costCenterDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const costDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: z.string(),
  description: z.string(),
  amount: z.string(),
  costDate: z.date(),
  costCenterId: z.string().nullable(),
  costCenterName: z.string().nullable(),
  costCenterCode: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const costTypeDto = z.object({
  name: z.string(),
  isCustom: z.boolean(),
});
