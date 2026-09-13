import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  DEFAULT_ROLE_LIST,
  MEMBERSHIP_STATUS_LIST,
  PERMISSION_LIST,
} from '@rona/config/tenancy';
import { relations } from 'drizzle-orm';
import { organizations } from './admin';
import { users } from './auth';

export const membershipStatusList = pgEnum(
  'membership_status_list',
  MEMBERSHIP_STATUS_LIST,
);
export const roleKeyList = pgEnum('role_key_list', DEFAULT_ROLE_LIST);
export const permissionList = pgEnum('permission_list', PERMISSION_LIST);

export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: membershipStatusList('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('organization_memberships_organization_user_unique').on(
      table.organizationId,
      table.userId,
    ),
    index('organization_memberships_user_idx').on(table.userId),
  ],
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    key: roleKeyList('key').notNull(),
    name: text('name').notNull(),
    isSystem: boolean('is_system').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('roles_organization_key_unique').on(table.organizationId, table.key),
  ],
);

export const permissions = pgTable('permissions', {
  key: permissionList('key').primaryKey(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permissionKey: permissionList('permission_key')
      .references(() => permissions.key, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionKey] })],
);

export const membershipRoles = pgTable(
  'membership_roles',
  {
    membershipId: uuid('membership_id')
      .references(() => organizationMemberships.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: uuid('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.membershipId, table.roleId] })],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    requestId: text('request_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('audit_logs_organization_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
    index('audit_logs_entity_idx').on(
      table.organizationId,
      table.entityType,
      table.entityId,
    ),
    index('audit_logs_organization_actor_idx').on(
      table.organizationId,
      table.actorId,
    ),
  ],
);

export const organizationMembershipsRelations = relations(
  organizationMemberships,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [organizationMemberships.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMemberships.userId],
      references: [users.id],
    }),
    membershipRoles: many(membershipRoles),
  }),
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  rolePermissions: many(rolePermissions),
  membershipRoles: many(membershipRoles),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionKey],
      references: [permissions.key],
    }),
  }),
);

export const membershipRolesRelations = relations(
  membershipRoles,
  ({ one }) => ({
    membership: one(organizationMemberships, {
      fields: [membershipRoles.membershipId],
      references: [organizationMemberships.id],
    }),
    role: one(roles, {
      fields: [membershipRoles.roleId],
      references: [roles.id],
    }),
  }),
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));
