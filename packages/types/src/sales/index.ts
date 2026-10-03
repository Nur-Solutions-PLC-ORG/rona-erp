import z from "zod";
import {
  COMMISSION_STATUS_LIST,
  CUSTOMER_STATUS_LIST,
  PAYMENT_TERMS_LIST,
  SALES_ORDER_STATUS_LIST,
} from "@rona/config/sales";
import {
  commissionRecordDto,
  commissionRuleCreateSchema,
  commissionRuleDto,
  commissionRuleListSearchParamsSchema,
  commissionRecordListSearchParamsSchema,
  commissionRuleUpdateSchema,
  customerAddressCreateSchema,
  customerAddressDto,
  customerAddressUpdateSchema,
  customerContactCreateSchema,
  customerContactDto,
  customerContactUpdateSchema,
  customerCreateSchema,
  customerDetailDto,
  customerDto,
  customerListSearchParamsSchema,
  customerUpdateSchema,
  salesOrderCreateSchema,
  salesOrderDetailDto,
  salesOrderDto,
  salesOrderLineDto,
  salesOrderListSearchParamsSchema,
  sellableLotDto,
  stockAvailabilityDto,
  stockAvailabilityParamsSchema,
} from "@rona/validation/sales";

export type CustomerStatus = (typeof CUSTOMER_STATUS_LIST)[number];
export type SalesOrderStatus = (typeof SALES_ORDER_STATUS_LIST)[number];
export type PaymentTerms = (typeof PAYMENT_TERMS_LIST)[number];
export type CommissionStatus = (typeof COMMISSION_STATUS_LIST)[number];

export type CustomerCreateSchema = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateSchema = z.infer<typeof customerUpdateSchema>;
export type CustomerContactCreateSchema = z.infer<
  typeof customerContactCreateSchema
>;
export type CustomerContactUpdateSchema = z.infer<
  typeof customerContactUpdateSchema
>;
export type CustomerAddressCreateSchema = z.infer<
  typeof customerAddressCreateSchema
>;
export type CustomerAddressUpdateSchema = z.infer<
  typeof customerAddressUpdateSchema
>;
export type CustomerListSearchParamsSchema = z.infer<
  typeof customerListSearchParamsSchema
>;
export type SalesOrderCreateSchema = z.infer<typeof salesOrderCreateSchema>;
export type SalesOrderListSearchParamsSchema = z.infer<
  typeof salesOrderListSearchParamsSchema
>;
export type StockAvailabilityParams = z.infer<
  typeof stockAvailabilityParamsSchema
>;
export type CommissionRuleCreateSchema = z.infer<
  typeof commissionRuleCreateSchema
>;
export type CommissionRuleUpdateSchema = z.infer<
  typeof commissionRuleUpdateSchema
>;
export type CommissionRuleListSearchParamsSchema = z.infer<
  typeof commissionRuleListSearchParamsSchema
>;
export type CommissionRecordListSearchParamsSchema = z.infer<
  typeof commissionRecordListSearchParamsSchema
>;

export type CustomerDto = z.infer<typeof customerDto>;
export type CustomerContactDto = z.infer<typeof customerContactDto>;
export type CustomerAddressDto = z.infer<typeof customerAddressDto>;
export type CustomerDetailDto = z.infer<typeof customerDetailDto>;
export type SalesOrderDto = z.infer<typeof salesOrderDto>;
export type SalesOrderLineDto = z.infer<typeof salesOrderLineDto>;
export type SalesOrderDetailDto = z.infer<typeof salesOrderDetailDto>;
export type SellableLotDto = z.infer<typeof sellableLotDto>;
export type StockAvailabilityDto = z.infer<typeof stockAvailabilityDto>;
export type CommissionRuleDto = z.infer<typeof commissionRuleDto>;
export type CommissionRecordDto = z.infer<typeof commissionRecordDto>;

export type CustomerCreateInput = CustomerCreateSchema;
export type CustomerUpdateInput = CustomerUpdateSchema;
export type CustomerContactCreateInput = CustomerContactCreateSchema;
export type CustomerContactUpdateInput = CustomerContactUpdateSchema;
export type CustomerAddressCreateInput = CustomerAddressCreateSchema;
export type CustomerAddressUpdateInput = CustomerAddressUpdateSchema;
export type SalesOrderCreateInput = SalesOrderCreateSchema;
export type CommissionRuleCreateInput = CommissionRuleCreateSchema;
export type CommissionRuleUpdateInput = CommissionRuleUpdateSchema;

export interface Paginated {
  page: number;
  limit: number;
}

export type CustomerListParams = CustomerListSearchParamsSchema & Paginated;
export type SalesOrderListParams = SalesOrderListSearchParamsSchema & Paginated;
export type CommissionRuleListParams =
  CommissionRuleListSearchParamsSchema & Paginated;
export type CommissionRecordListParams =
  CommissionRecordListSearchParamsSchema & Paginated;

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
