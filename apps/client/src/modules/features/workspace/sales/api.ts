import { Request } from "@/api";
import {
  API_SALES_COMMISSION_APPROVE_URL,
  API_SALES_COMMISSION_MARK_PAID_URL,
  API_SALES_COMMISSION_RECORDS_URL,
  API_SALES_COMMISSION_RULES_URL,
  API_SALES_COMMISSION_RULE_DETAILS_URL,
  API_SALES_CUSTOMERS_URL,
  API_SALES_ORDER_AVAILABILITY_URL,
  API_SALES_ORDER_CANCEL_URL,
  API_SALES_ORDER_CONFIRM_URL,
  API_SALES_ORDER_FULFILL_URL,
  API_SALES_ORDERS_URL,
} from "@rona/routes/workspace";
import type {
  CommissionRecordDto,
  CommissionRuleCreateSchema,
  CommissionRuleDto,
  CommissionRuleUpdateSchema,
  CustomerCreateSchema,
  CustomerDto,
  SalesOrderCreateSchema,
  SalesOrderDto,
  StockAvailabilityDto,
} from "@rona/types/sales";

export const ApiGetCustomers = Request<CustomerDto[]>("get", API_SALES_CUSTOMERS_URL);

export const ApiPostCustomer = Request<CustomerDto, CustomerCreateSchema>(
  "post",
  API_SALES_CUSTOMERS_URL,
);

export const ApiGetSalesOrders = Request<SalesOrderDto[]>("get", API_SALES_ORDERS_URL);

export const ApiPostSalesOrder = Request<SalesOrderDto, SalesOrderCreateSchema>(
  "post",
  API_SALES_ORDERS_URL,
);

export const ApiConfirmSalesOrder = Request<SalesOrderDto>(
  "post",
  API_SALES_ORDER_CONFIRM_URL,
);

export const ApiFulfillSalesOrder = Request<SalesOrderDto>(
  "post",
  API_SALES_ORDER_FULFILL_URL,
);

export const ApiCancelSalesOrder = Request<SalesOrderDto>(
  "post",
  API_SALES_ORDER_CANCEL_URL,
);

export const ApiGetSalesOrderAvailability = Request<StockAvailabilityDto>(
  "get",
  API_SALES_ORDER_AVAILABILITY_URL,
);

export const ApiGetCommissionRules = Request<CommissionRuleDto[]>(
  "get",
  API_SALES_COMMISSION_RULES_URL,
);

export const ApiPostCommissionRule = Request<
  CommissionRuleDto,
  CommissionRuleCreateSchema
>("post", API_SALES_COMMISSION_RULES_URL);

export const ApiPatchCommissionRule = Request<
  CommissionRuleDto,
  CommissionRuleUpdateSchema
>("patch", API_SALES_COMMISSION_RULE_DETAILS_URL);

export const ApiGetCommissionRecords = Request<CommissionRecordDto[]>(
  "get",
  API_SALES_COMMISSION_RECORDS_URL,
);

export const ApiApproveCommission = Request<CommissionRecordDto>(
  "post",
  API_SALES_COMMISSION_APPROVE_URL,
);

export const ApiMarkCommissionPaid = Request<CommissionRecordDto>(
  "post",
  API_SALES_COMMISSION_MARK_PAID_URL,
);
