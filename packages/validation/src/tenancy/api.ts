import { z } from "zod";
import {
  DEFAULT_ROLE_LIST,
  MEMBERSHIP_STATUS_LIST,
  PERMISSION_LIST,
} from "@rona/config/tenancy";
import { ORGANIZATION_STATUS_LIST } from "@rona/config/admin";
import { paginationSearchParamsSchema } from "../global/api.js";

export const organizationUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens",
    )
    .optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().min(1).max(50).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  status: z.enum(ORGANIZATION_STATUS_LIST).optional(),
});

export const membershipCreateSchema = z.object({
  userId: z.uuid("User ID must be a valid UUID"),
  roleKeys: z
    .array(z.enum(DEFAULT_ROLE_LIST))
    .min(1, "At least one role is required"),
});

export const memberCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters long"),
  email: z.email("Invalid email address"),
  roleKeys: z
    .array(z.enum(DEFAULT_ROLE_LIST))
    .min(1, "At least one role is required"),
});

export const membershipCandidateSearchParamsSchema =
  paginationSearchParamsSchema;

export const membershipUpdateSchema = z
  .object({
    roleKeys: z
      .array(z.enum(DEFAULT_ROLE_LIST))
      .min(1, "At least one role is required")
      .optional(),
    status: z.enum(MEMBERSHIP_STATUS_LIST).optional(),
  })
  .refine(
    (data) => data.roleKeys !== undefined || data.status !== undefined,
    { message: "At least one of roleKeys or status is required" },
  );

export const membershipStatusUpdateSchema = z.object({
  status: z.enum(MEMBERSHIP_STATUS_LIST),
});

export const membershipListSearchParamsSchema = paginationSearchParamsSchema;

export const roleListSearchParamsSchema = paginationSearchParamsSchema;

export const roleUpdateSchema = z.object({
  permissions: z
    .array(z.enum(PERMISSION_LIST))
    .min(1, "At least one permission is required"),
});

export const auditListSearchParamsSchema = paginationSearchParamsSchema.extend({
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(100).optional(),
  actorId: z.string().trim().max(100).optional(),
});
