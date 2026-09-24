// Inventory configuration

export const ITEM_TYPE_LIST = [
  "RAW_MATERIAL",
  "PACKAGING",
  "CONSUMABLE",
  "SEMI_FINISHED",
  "FINISHED_GOOD",
] as const;

export const QUALITY_STATUS_LIST = [
  "QUARANTINED",
  "APPROVED",
  "REJECTED",
  "RELEASED",
  "EXPIRED",
] as const;

export const NON_ALLOCATABLE_QUALITY_STATUSES = [
  "QUARANTINED",
  "REJECTED",
  "EXPIRED",
] as const;

export const MOVEMENT_TYPE_LIST = [
  "RECEIPT",
  "ISSUE",
  "TRANSFER",
  "RETURN",
  "ADJUSTMENT",
] as const;

export const RESERVATION_STATUS_LIST = [
  "ACTIVE",
  "CONSUMED",
  "RELEASED",
  "EXPIRED",
] as const;

export const ALLOCATION_STRATEGY_LIST = ["FIFO", "FEFO"] as const;

export const DEFAULT_ALLOCATION_STRATEGY = "FIFO" as const;

export const QUANTITY_PRECISION = 18;
export const QUANTITY_SCALE = 4;

export const ALLOCATION_MAX_LOTS = 100;

export const INVENTORY_DEFAULT_PAGE_SIZE = 25;
export const INVENTORY_DEFAULT_PAGE = 1;
