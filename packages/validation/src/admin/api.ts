import { POSITIONS_LIST, USER_STATUS_LIST } from "@rona/config/auth";
import { paginationSearchParamsSchema } from "../global/api.js";
import z from "zod";
import {
  EMPLOYEE_STATUS_LIST,
  ORGANIZATION_STATUS_LIST,
} from "@rona/config/admin";

export const userListSearchParamsSchema = paginationSearchParamsSchema.extend({
  status: z.enum(USER_STATUS_LIST).optional(),
  position: z.enum(POSITIONS_LIST).optional(),
  orgId: z.string().min(1).optional(),
});

export const organizationListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(ORGANIZATION_STATUS_LIST).optional(),
  });

export const employeeListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(EMPLOYEE_STATUS_LIST).optional(),
    orgId: z.string().min(1).optional(),
  });

export const departmentListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    orgId: z.string().min(1).optional(),
  });
export const branchListSearchParamsSchema = paginationSearchParamsSchema.extend({
  orgId: z.string().min(1).optional(),
});
export const configsListSearchParamsSchema = paginationSearchParamsSchema;
export const organizationSettingsListSearchParamsSchema =
  paginationSearchParamsSchema;
