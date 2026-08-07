import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ENUMS - Using hardcoded values to avoid package dependency
export const modulesList = pgEnum('modules_list', [
  'workforce',
  'payroll',
  'inventory',
  'production',
  'sales',
  'accounting',
]);
export const positionsList = pgEnum('positions_list', [
  'super_admin',
  'admin',
  'owner',
  'manager',
  'staff',
]);
export const statusesList = pgEnum('statuses_list', [
  'active',
  'inactive',
  'suspended',
  'pending_onboarding',
]);

// TABLES
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),

  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  tfaEnabled: boolean('tfa_enabled').default(false).notNull(),

  status: statusesList('status').default('active').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  position: positionsList('position').notNull(),
  module: modulesList('module').array().notNull().default([]),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
