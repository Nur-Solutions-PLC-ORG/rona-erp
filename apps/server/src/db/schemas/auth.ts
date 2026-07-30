import {
  boolean,
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

// ENUMS
export const modulesList = pgEnum('modules_list', MODULE_LIST);
export const positionsList = pgEnum('positions_list', POSITIONS_LIST);
export const statusesList = pgEnum('statuses_list', USER_STATUS_LIST);

// TABLES
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

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

 // Password reset tokens table — stores one-time tokens for forgot-password flow
 export const passwordResetTokens = pgTable('password_reset_tokens', {
   id: uuid('id').primaryKey().defaultRandom(),
   userId: uuid('user_id')
     .references(() => users.id, { onDelete: 'cascade' })
     .notNull(),

   token: text('token').notNull().unique(),
   used: boolean('used').default(false).notNull(),
   expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

   createdAt: timestamp('created_at', { withTimezone: true })
     .defaultNow()
     .notNull(),
 });
