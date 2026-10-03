import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { employees, organizations } from '../admin';

export const employeeWebAuthnCredentials = pgTable(
  'employee_webauthn_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    employeeId: uuid('employee_id').notNull(),
    credentialId: text('credential_id').notNull(),
    publicKey: text('public_key').notNull(),
    counter: integer('counter').notNull().default(0),
    deviceType: text('device_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    unique('employee_webauthn_credentials_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    unique('employee_webauthn_credentials_organization_credential_unique').on(
      table.organizationId,
      table.credentialId,
    ),
    index('employee_webauthn_credentials_organization_employee_idx').on(
      table.organizationId,
      table.employeeId,
    ),
    foreignKey({
      name: 'employee_webauthn_credentials_employee_tenant_fk',
      columns: [table.employeeId, table.organizationId],
      foreignColumns: [employees.id, employees.organizationId],
    }),
  ],
);
