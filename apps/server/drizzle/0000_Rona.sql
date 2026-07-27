CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

CREATE TYPE "public"."modules_enum" AS ENUM('HR', 'Inventory', 'Finance');
CREATE TYPE "public"."positions_enum" AS ENUM('admin', 'owner', 'managers', 'staff');
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended', 'pending_onboarding');

CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"eid" text,
	"is_email_verified" boolean DEFAULT false,
	"mfa_enabled" boolean DEFAULT false,
	"mfa_secret_encrypted" text,
	"status" "user_status" DEFAULT 'pending_onboarding',
	"tenant_id" uuid NOT NULL REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "tenant_members" (
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "tenant_members_user_id_tenant_id_pk" PRIMARY KEY("user_id","tenant_id")
);

CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"position" "positions_enum" NOT NULL,
	"module" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);

CREATE TABLE "blacklisted_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "blacklisted_tokens_token_hash_unique" UNIQUE("token_hash")
);

CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"platform" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);

CREATE TABLE "workforce_placeholder" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "inventory_placeholder" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "finance_placeholder" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action
);

ALTER TABLE "blacklisted_tokens" ADD CONSTRAINT "blacklisted_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "platforms" ADD CONSTRAINT "platforms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "idx_users_tenant_id" ON "users" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_tenant_members_tenant_id" ON "tenant_members" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tenant_members_user_id" ON "tenant_members" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_blacklisted_tokens_user_id" ON "blacklisted_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_platforms_user_id" ON "platforms" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_verification_codes_email" ON "verification_codes" ("email");

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blacklisted_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platforms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workforce_placeholder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_placeholder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "finance_placeholder" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_users" ON "users"
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_tenant_members" ON "tenant_members"
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_user_roles" ON "user_roles"
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY "tenant_isolation_refresh_tokens" ON "refresh_tokens"
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY "tenant_isolation_blacklisted_tokens" ON "blacklisted_tokens"
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY "tenant_isolation_platforms" ON "platforms"
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY "tenant_isolation_workforce" ON "workforce_placeholder"
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_inventory" ON "inventory_placeholder"
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_finance" ON "finance_placeholder"
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
ALTER TABLE "tenant_members" FORCE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" FORCE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" FORCE ROW LEVEL SECURITY;
ALTER TABLE "blacklisted_tokens" FORCE ROW LEVEL SECURITY;
ALTER TABLE "platforms" FORCE ROW LEVEL SECURITY;
ALTER TABLE "workforce_placeholder" FORCE ROW LEVEL SECURITY;
ALTER TABLE "inventory_placeholder" FORCE ROW LEVEL SECURITY;
ALTER TABLE "finance_placeholder" FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_users" BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER "audit_user_roles" BEFORE UPDATE ON "user_roles" FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER "audit_platforms" BEFORE UPDATE ON "platforms" FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER "audit_platform_settings" BEFORE UPDATE ON "platform_settings" FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER "audit_verification_codes" BEFORE UPDATE ON "verification_codes" FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE OR REPLACE FUNCTION validate_password_strength(password text)
RETURNS boolean AS $$
BEGIN
  RETURN length(password) >= 8 
    AND password ~ '[A-Z]' 
    AND password ~ '[a-z]' 
    AND password ~ '[0-9]';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

INSERT INTO "platform_settings" ("key", "value") VALUES
  ('platform_name', 'Rona ERP'),
  ('maintenance_mode', 'false'),
  ('max_login_attempts', '5'),
  ('lockout_duration_minutes', '15'),
  ('mfa_required', 'false')
ON CONFLICT ("key") DO NOTHING;
