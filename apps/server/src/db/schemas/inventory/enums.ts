import { pgEnum } from 'drizzle-orm/pg-core';
import {
  ALLOCATION_STRATEGY_LIST,
  ITEM_TYPE_LIST,
  MOVEMENT_TYPE_LIST,
  QUALITY_STATUS_LIST,
  RESERVATION_STATUS_LIST,
} from '@rona/config/inventory';

export const itemTypeList = pgEnum('item_type_list', ITEM_TYPE_LIST);
export const qualityStatusList = pgEnum(
  'quality_status_list',
  QUALITY_STATUS_LIST,
);
export const movementTypeList = pgEnum(
  'movement_type_list',
  MOVEMENT_TYPE_LIST,
);
export const reservationStatusList = pgEnum(
  'reservation_status_list',
  RESERVATION_STATUS_LIST,
);
export const allocationStrategyList = pgEnum(
  'allocation_strategy_list',
  ALLOCATION_STRATEGY_LIST,
);
