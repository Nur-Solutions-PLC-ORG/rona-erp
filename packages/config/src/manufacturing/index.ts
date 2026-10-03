// Manufacturing configuration

export const BOM_VERSION_STATUS_LIST = [
  "DRAFT",
  "APPROVED",
  "RETIRED",
] as const;

export const PRODUCTION_ORDER_STATUS_LIST = [
  "DRAFT",
  "PLANNED",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const PRODUCTION_BATCH_STATUS_LIST = [
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const APPROVABLE_PRODUCTION_ORDER_STATUSES = [
  "DRAFT",
  "PLANNED",
] as const;

export const CANCELLABLE_PRODUCTION_ORDER_STATUSES = [
  "DRAFT",
  "PLANNED",
  "APPROVED",
] as const;

export const BOM_QUANTITY_SCALE = 6;

export const MANUFACTURING_DEFAULT_PAGE_SIZE = 25;
export const MANUFACTURING_DEFAULT_PAGE = 1;

export const PRODUCTION_ORDER_CODE_PREFIX = "PO";
