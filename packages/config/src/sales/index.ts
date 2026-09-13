// Sales configuration

export const CUSTOMER_STATUS_LIST = ["ACTIVE", "INACTIVE"] as const;

export const SALES_ORDER_STATUS_LIST = [
  "DRAFT",
  "CONFIRMED",
  "FULFILLING",
  "FULFILLED",
  "CANCELLED",
] as const;

export const PAYMENT_TERMS_LIST = [
  "IMMEDIATE",
  "NET_7",
  "NET_15",
  "NET_30",
  "NET_60",
  "END_OF_MONTH",
] as const;

export const COMMISSION_STATUS_LIST = ["PENDING", "APPROVED", "PAID"] as const;

export const PAYMENT_TERMS_DUE_DAYS: Record<
  (typeof PAYMENT_TERMS_LIST)[number],
  number | null
> = {
  IMMEDIATE: 0,
  NET_7: 7,
  NET_15: 15,
  NET_30: 30,
  NET_60: 60,
  END_OF_MONTH: null,
};

export const SALES_DEFAULT_PAGE_SIZE = 25;
export const SALES_DEFAULT_PAGE = 1;

export const MONEY_PRECISION = 18;
export const MONEY_SCALE = 2;

export const DEFAULT_VAT_PERCENT = "15.00";
