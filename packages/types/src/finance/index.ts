import z from "zod";
import { COST_TYPE_LIST, INVOICE_STATUS_LIST, PAYMENT_METHOD_LIST } from "@rona/config/finance";
import {
  costCenterCreateSchema,
  costCenterDto,
  costCenterUpdateSchema,
  costCreateSchema,
  costDto,
  costListSearchParamsSchema,
  costTypeCreateSchema,
  costTypeDto,
  costUpdateSchema,
  invoiceCreateSchema,
  invoiceDetailDto,
  invoiceDto,
  invoiceLineDto,
  invoiceListSearchParamsSchema,
  invoicePaymentDto,
  paymentAllocationDto,
  paymentCreateSchema,
  paymentDto,
  paymentListSearchParamsSchema,
  paymentUpdateSchema,
} from "@rona/validation/finance";

export type InvoiceStatus = (typeof INVOICE_STATUS_LIST)[number];
export type PaymentMethod = (typeof PAYMENT_METHOD_LIST)[number];
export type CostType = (typeof COST_TYPE_LIST)[number];

export type InvoiceCreateSchema = z.infer<typeof invoiceCreateSchema>;
export type InvoiceListSearchParamsSchema = z.infer<
  typeof invoiceListSearchParamsSchema
>;
export type PaymentCreateSchema = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateSchema = z.infer<typeof paymentUpdateSchema>;
export type PaymentListSearchParamsSchema = z.infer<
  typeof paymentListSearchParamsSchema
>;
export type CostCenterCreateSchema = z.infer<typeof costCenterCreateSchema>;
export type CostCenterUpdateSchema = z.infer<typeof costCenterUpdateSchema>;
export type CostCreateSchema = z.infer<typeof costCreateSchema>;
export type CostUpdateSchema = z.infer<typeof costUpdateSchema>;
export type CostListSearchParamsSchema = z.infer<
  typeof costListSearchParamsSchema
>;

export type InvoiceDto = z.infer<typeof invoiceDto>;
export type InvoiceLineDto = z.infer<typeof invoiceLineDto>;
export type InvoiceDetailDto = z.infer<typeof invoiceDetailDto>;
export type PaymentDto = z.infer<typeof paymentDto>;
export type PaymentAllocationDto = z.infer<typeof paymentAllocationDto>;
export type InvoicePaymentDto = z.infer<typeof invoicePaymentDto>;
export type CostCenterDto = z.infer<typeof costCenterDto>;
export type CostDto = z.infer<typeof costDto>;

export type InvoiceCreateInput = InvoiceCreateSchema;
export type PaymentCreateInput = PaymentCreateSchema;
export type PaymentUpdateInput = PaymentUpdateSchema;
export type CostCenterCreateInput = CostCenterCreateSchema;
export type CostCenterUpdateInput = CostCenterUpdateSchema;
export type CostCreateInput = CostCreateSchema;
export type CostUpdateInput = CostUpdateSchema;

export interface Paginated {
  page: number;
  limit: number;
}

export type InvoiceListParams = InvoiceListSearchParamsSchema & Paginated;
export type PaymentListParams = PaymentListSearchParamsSchema & Paginated;
export type CostListParams = CostListSearchParamsSchema & Paginated;

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}
