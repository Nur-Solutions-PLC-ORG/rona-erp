import { Request } from "@/api";
import {
  API_FINANCE_COSTS_URL,
  API_FINANCE_INVOICES_URL,
  API_FINANCE_INVOICE_ISSUE_URL,
  API_FINANCE_INVOICE_VOID_URL,
  API_FINANCE_PAYMENTS_URL,
} from "@rona/routes/workspace";
import type {
  CostCreateInput,
  CostDto,
  InvoiceCreateInput,
  InvoiceDto,
  PaymentCreateInput,
  PaymentDto,
} from "@rona/types/finance";

export const ApiGetInvoices = Request<InvoiceDto[]>("get", API_FINANCE_INVOICES_URL);

export const ApiPostInvoice = Request<InvoiceDto, InvoiceCreateInput>(
  "post",
  API_FINANCE_INVOICES_URL,
);

export const ApiIssueInvoice = Request<InvoiceDto>(
  "post",
  API_FINANCE_INVOICE_ISSUE_URL,
);

export const ApiVoidInvoice = Request<InvoiceDto>(
  "post",
  API_FINANCE_INVOICE_VOID_URL,
);

export const ApiGetPayments = Request<PaymentDto[]>("get", API_FINANCE_PAYMENTS_URL);

export const ApiPostPayment = Request<PaymentDto, PaymentCreateInput>(
  "post",
  API_FINANCE_PAYMENTS_URL,
);

export const ApiGetCosts = Request<CostDto[]>("get", API_FINANCE_COSTS_URL);

export const ApiPostCost = Request<CostDto, CostCreateInput>(
  "post",
  API_FINANCE_COSTS_URL,
);
