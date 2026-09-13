import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  MODULE_LIST,
  POSITIONS_LIST,
  USER_STATUS_LIST,
} from '@rona/config/auth';
import { organizations } from './admin';
import { relations } from 'drizzle-orm';

export const modulesList = pgEnum('modules_list', MODULE_LIST);
export const positionsList = pgEnum('positions_list', POSITIONS_LIST);
export const statusesList = pgEnum('statuses_list', USER_STATUS_LIST);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),

  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  tfaEnabled: boolean('tfa_enabled').default(false).notNull(),

  mustChangePassword: boolean('must_change_password').default(false).notNull(),

  status: statusesList('status').default('active').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const userRoles = pgTable(
  'user_roles',
  {
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
  },
  (table) => [
    index('user_roles_user_id_idx').on(table.userId),
  ],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));
