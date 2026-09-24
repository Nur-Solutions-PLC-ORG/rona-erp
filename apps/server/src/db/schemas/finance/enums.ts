import { pgEnum } from 'drizzle-orm/pg-core';
import {
  INVOICE_STATUS_LIST,
  PAYMENT_METHOD_LIST,
  COST_TYPE_LIST,
} from '@rona/config/finance';

export const invoiceStatusList = pgEnum(
  'invoice_status_list',
  INVOICE_STATUS_LIST,
);
export const paymentMethodList = pgEnum(
  'payment_method_list',
  PAYMENT_METHOD_LIST,
);
export const costTypeList = pgEnum('cost_type_list', COST_TYPE_LIST);
