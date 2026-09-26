import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { KIOSK_STATUS_LIST } from '@rona/config/kiosk';
import { organizations } from '../admin';

export const kioskStatusList = pgEnum('kiosk_status_list', KIOSK_STATUS_LIST);

export const kiosks = pgTable(
  'kiosks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    deviceId: text('device_id').notNull(),
    name: text('name').notNull(),
    status: kioskStatusList('status').default('ACTIVE').notNull(),
    tokenHash: text('token_hash').notNull(),
    registeredAt: timestamp('registered_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('kiosks_id_organization_unique').on(table.id, table.organizationId),
    unique('kiosks_organization_device_unique').on(
      table.organizationId,
      table.deviceId,
    ),
    index('kiosks_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    check(
      'kiosks_device_id_length_check',
      sql`length(${table.deviceId}) >= 6 and length(${table.deviceId}) <= 64`,
    ),
  ],
);
