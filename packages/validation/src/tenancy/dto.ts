import z from "zod";
import {
  DEFAULT_ROLE_LIST,
  MEMBERSHIP_STATUS_LIST,
  PERMISSION_LIST,
} from "@rona/config/tenancy";

export const membershipDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  status: z.enum(MEMBERSHIP_STATUS_LIST),
  roles: z.array(z.enum(DEFAULT_ROLE_LIST)),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const membershipWithUserDto = membershipDto.extend({
  user: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
  }),
  organization: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      logoUrl: z.string().nullable().optional(),
    })
    .optional(),
  permissions: z.array(z.enum(PERMISSION_LIST)).optional(),
});

export const roleDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  key: z.enum(DEFAULT_ROLE_LIST),
  name: z.string(),
  permissions: z.array(z.enum(PERMISSION_LIST)),
  isSystem: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const auditLogDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  actorId: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  requestId: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
});
