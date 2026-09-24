// Finance configuration

export const INVOICE_STATUS_LIST = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "VOID",
] as const;

export const PAYMENT_METHOD_LIST = ["BANK", "CASH", "CREDIT_NOTE"] as const;

export const COST_TYPE_LIST = [
  "RAW_MATERIAL",
  "ELECTRICITY",
  "WATER",
  "LABOR",
  "PACKAGING",
  "FUEL",
  "MAINTENANCE",
  "DEPRECIATION",
] as const;

export const DOCUMENT_TYPE_LIST = ["SALES_ORDER", "INVOICE"] as const;

export const FINANCE_DEFAULT_PAGE_SIZE = 25;
export const FINANCE_DEFAULT_PAGE = 1;
