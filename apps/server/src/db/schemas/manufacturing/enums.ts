import { pgEnum } from 'drizzle-orm/pg-core';
import {
  BOM_VERSION_STATUS_LIST,
  PRODUCTION_BATCH_STATUS_LIST,
  PRODUCTION_ORDER_STATUS_LIST,
} from '@rona/config/manufacturing';

export const bomVersionStatusList = pgEnum(
  'bom_version_status_list',
  BOM_VERSION_STATUS_LIST,
);

export const productionOrderStatusList = pgEnum(
  'production_order_status_list',
  PRODUCTION_ORDER_STATUS_LIST,
);

export const productionBatchStatusList = pgEnum(
  'production_batch_status_list',
  PRODUCTION_BATCH_STATUS_LIST,
);
