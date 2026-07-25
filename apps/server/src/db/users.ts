import { pgTable, uuid, text, boolean, integer, timestamp, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organizations } from "./organizations";

export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended", "pending_onboarding"]);
export const positionsEnum = pgEnum("positions_enum", ["admin", "owner", "managers", "staff"]);
export const modulesEnum = pgEnum("modules_enum", [
  "HR",
  "Inventory",
  "Finance"
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash"),
  eid: text("eid"),
  is_email_verified: boolean("is_email_verified").default(false),
  mfa_enabled: boolean("mfa_enabled").default(false),
  mfa_secret_encrypted: text("mfa_secret_encrypted"),
  status: userStatusEnum("status").default("pending_onboarding"),
  tenant_id: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  failed_login_attempts: integer("failed_login_attempts").default(0),
  locked_until: timestamp("locked_until", { withTimezone: true }),
  last_login_at: timestamp("last_login_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  position: positionsEnum("position").notNull(),
  module: text("module").array(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  code_hash: text("code_hash").notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const tenantMembers = pgTable("tenant_members", {
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenant_id: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.user_id, table.tenant_id] })
  };
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertTenantMemberSchema = createInsertSchema(tenantMembers);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertVerificationCodeSchema = createInsertSchema(verificationCodes);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const blacklistedTokens = pgTable("blacklisted_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  token_hash: text("token_hash").notNull().unique(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  token_hash: text("token_hash").notNull().unique(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  session_id: text("session_id").notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  revoked_at: timestamp("revoked_at", { withTimezone: true }),
});

export const platforms = pgTable("platforms", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  session_id: text("session_id").notNull(),
  platform: text("platform").notNull(),
  user_agent: text("user_agent"),
  ip_address: text("ip_address"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions);
export const insertBlacklistedTokenSchema = createInsertSchema(blacklistedTokens);
export const insertRefreshTokenSchema = createInsertSchema(refreshTokens);
export const insertPlatformSchema = createInsertSchema(platforms);
export const insertPlatformSettingSchema = createInsertSchema(platformSettings);
