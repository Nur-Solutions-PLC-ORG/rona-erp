import { pgEnum } from 'drizzle-orm/pg-core';
import {
  COMMISSION_STATUS_LIST,
  CUSTOMER_STATUS_LIST,
  PAYMENT_TERMS_LIST,
  SALES_ORDER_STATUS_LIST,
} from '@rona/config/sales';

export const customerStatusList = pgEnum(
  'customer_status_list',
  CUSTOMER_STATUS_LIST,
);

export const salesOrderStatusList = pgEnum(
  'sales_order_status_list',
  SALES_ORDER_STATUS_LIST,
);

export const paymentTermsList = pgEnum(
  'payment_terms_list',
  PAYMENT_TERMS_LIST,
);

export const commissionStatusList = pgEnum(
  'commission_status_list',
  COMMISSION_STATUS_LIST,
);
