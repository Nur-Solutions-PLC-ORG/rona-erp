import {
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  KIOSK_ATTESTATION_STATUS_LIST,
  KIOSK_DEFAULT_VERIFICATION_POLICY,
  KIOSK_STATUS_LIST,
  KIOSK_VERIFICATION_POLICY_LIST,
} from '@rona/config/kiosk';
import type { KioskDeviceInfo } from '@rona/types/kiosk';
import { organizations } from '../admin';

export const kioskStatusList = pgEnum('kiosk_status_list', KIOSK_STATUS_LIST);

export const kioskVerificationPolicyList = pgEnum(
  'kiosk_verification_policy_list',
  KIOSK_VERIFICATION_POLICY_LIST,
);

export const kioskAttestationStatusList = pgEnum(
  'kiosk_attestation_status_list',
  KIOSK_ATTESTATION_STATUS_LIST,
);

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
    // Native terminal (Rona Kiosk app) pairing: Keystore EC P-256 key, SPKI DER base64.
    publicKey: text('public_key'),
    pairedAt: timestamp('paired_at', { withTimezone: true }),
    attestationStatus: kioskAttestationStatusList('attestation_status')
      .default('NONE')
      .notNull(),
    attestationChain: jsonb('attestation_chain').$type<string[]>(),
    deviceInfo: jsonb('device_info').$type<KioskDeviceInfo>(),
    appVersion: text('app_version'),
    verificationPolicy: kioskVerificationPolicyList('verification_policy')
      .default(KIOSK_DEFAULT_VERIFICATION_POLICY)
      .notNull(),
    adminPinHash: text('admin_pin_hash'),
    lastHeartbeat: jsonb('last_heartbeat').$type<Record<string, unknown>>(),
    lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
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
