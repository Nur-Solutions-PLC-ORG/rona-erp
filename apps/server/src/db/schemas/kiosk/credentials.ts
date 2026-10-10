import {
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { KIOSK_TEMPLATE_KIND_LIST } from '@rona/config/kiosk';
import { employees, organizations } from '../admin';
import { users } from '../auth';
import { kiosks } from './kiosk';

export const kioskTemplateKindList = pgEnum(
  'kiosk_template_kind_list',
  KIOSK_TEMPLATE_KIND_LIST,
);

// Biometric templates produced and matched on the terminal (ZKTeco SDK).
// The server never interprets them; they are stored encrypted (AES-256-GCM)
// so every terminal of the organization can sync them.
export const employeeBiometricTemplates = pgTable(
  'employee_biometric_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    employeeId: uuid('employee_id').notNull(),
    kind: kioskTemplateKindList('kind').notNull(),
    fingerIndex: integer('finger_index'),
    algorithmVersion: text('algorithm_version').notNull(),
    templateCiphertext: text('template_ciphertext').notNull(),
    enrolledByKioskId: uuid('enrolled_by_kiosk_id').references(
      () => kiosks.id,
      { onDelete: 'set null' },
    ),
    enrolledByUserId: uuid('enrolled_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    unique('employee_biometric_templates_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'employee_biometric_templates_employee_tenant_fk',
      columns: [table.employeeId, table.organizationId],
      foreignColumns: [employees.id, employees.organizationId],
    }),
    index('employee_biometric_templates_organization_updated_idx').on(
      table.organizationId,
      table.updatedAt,
    ),
    index('employee_biometric_templates_organization_employee_idx').on(
      table.organizationId,
      table.employeeId,
    ),
    uniqueIndex('employee_biometric_templates_active_unique')
      .on(
        table.organizationId,
        table.employeeId,
        table.kind,
        sql`coalesce(${table.fingerIndex}, -1)`,
      )
      .where(sql`${table.revokedAt} is null`),
  ],
);

// RFID / NFC cards. Only a hash of the UID is stored:
// sha256 hex of `${organizationId}:${UID_UPPERCASE_HEX}`.
export const employeeCards = pgTable(
  'employee_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    employeeId: uuid('employee_id').notNull(),
    uidHash: text('uid_hash').notNull(),
    uidSuffix: text('uid_suffix').notNull(),
    label: text('label'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    unique('employee_cards_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'employee_cards_employee_tenant_fk',
      columns: [table.employeeId, table.organizationId],
      foreignColumns: [employees.id, employees.organizationId],
    }),
    index('employee_cards_organization_updated_idx').on(
      table.organizationId,
      table.updatedAt,
    ),
    uniqueIndex('employee_cards_active_uid_unique')
      .on(table.organizationId, table.uidHash)
      .where(sql`${table.revokedAt} is null`),
  ],
);
