import { Request } from "@/api";
import {
  API_SALES_COMMISSION_APPROVE_URL,
  API_SALES_COMMISSION_MARK_PAID_URL,
  API_SALES_COMMISSION_RECORDS_URL,
  API_SALES_COMMISSION_RULES_URL,
  API_SALES_COMMISSION_RULE_DETAILS_URL,
  API_SALES_CUSTOMERS_URL,
  API_SALES_ORDERS_URL,
} from "@rona/routes/workspace";
import type {
  CommissionRecordDto,
  CommissionRuleCreateSchema,
  CommissionRuleDto,
  CommissionRuleUpdateSchema,
  CustomerDto,
  SalesOrderDto,
} from "@rona/types/sales";

export const ApiGetCustomers = Request<CustomerDto[]>("get", API_SALES_CUSTOMERS_URL);

export const ApiGetSalesOrders = Request<SalesOrderDto[]>("get", API_SALES_ORDERS_URL);

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
