import { sql } from 'drizzle-orm';
import { bigint, boolean, check, foreignKey, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { employees, organizations } from '../admin';
import { users } from '../auth';
import { kiosks } from './kiosk';

export const employeeCredentials = pgTable('employee_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull(),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: bigint('counter', { mode: 'number' }).notNull(),
  userHandle: text('user_handle').notNull(),
  transports: text('transports').array().notNull().default([]),
  deviceName: text('device_name').notNull(),
  deviceType: text('device_type').notNull(),
  backedUp: boolean('backed_up').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  unique('employee_credentials_tenant_unique').on(table.id, table.organizationId, table.employeeId),
  foreignKey({ name: 'employee_credentials_employee_tenant_fk', columns: [table.employeeId, table.organizationId], foreignColumns: [employees.id, employees.organizationId] }).onDelete('cascade'),
  index('employee_credentials_employee_idx').on(table.organizationId, table.employeeId),
  check('employee_credentials_counter_check', sql`${table.counter} >= 0 and ${table.counter} <= 4294967295`),
  check('employee_credentials_device_type_check', sql`${table.deviceType} in ('singleDevice', 'multiDevice')`),
]);

export const webauthnChallenges = pgTable('webauthn_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  purpose: text('purpose').notNull(),
  challenge: text('challenge').notNull(),
  employeeId: uuid('employee_id'),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'cascade' }),
  kioskId: uuid('kiosk_id'),
  sessionHash: text('session_hash'),
  deviceName: text('device_name'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  foreignKey({ name: 'webauthn_challenges_employee_tenant_fk', columns: [table.employeeId, table.organizationId], foreignColumns: [employees.id, employees.organizationId] }).onDelete('cascade'),
  foreignKey({ name: 'webauthn_challenges_kiosk_tenant_fk', columns: [table.kioskId, table.organizationId], foreignColumns: [kiosks.id, kiosks.organizationId] }).onDelete('cascade'),
  index('webauthn_challenges_expiry_idx').on(table.expiresAt),
  check('webauthn_challenges_binding_check', sql`(${table.purpose} = 'registration' and ${table.employeeId} is not null and ${table.actorId} is not null and ${table.deviceName} is not null and ${table.kioskId} is null and ${table.sessionHash} is null) or (${table.purpose} = 'authentication' and ${table.kioskId} is not null and ${table.sessionHash} is not null and ${table.actorId} is null and ${table.deviceName} is null)`),
]);

export const kioskEmployeeGrants = pgTable('kiosk_employee_grants', {
  tokenHash: text('token_hash').primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  kioskId: uuid('kiosk_id').notNull(),
  sessionHash: text('session_hash').notNull(),
  employeeId: uuid('employee_id').notNull(),
  credentialId: uuid('credential_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  foreignKey({ name: 'kiosk_employee_grants_kiosk_tenant_fk', columns: [table.kioskId, table.organizationId], foreignColumns: [kiosks.id, kiosks.organizationId] }).onDelete('cascade'),
  foreignKey({ name: 'kiosk_employee_grants_credential_tenant_fk', columns: [table.credentialId, table.organizationId, table.employeeId], foreignColumns: [employeeCredentials.id, employeeCredentials.organizationId, employeeCredentials.employeeId] }).onDelete('cascade'),
  index('kiosk_employee_grants_expiry_idx').on(table.expiresAt),
]);
