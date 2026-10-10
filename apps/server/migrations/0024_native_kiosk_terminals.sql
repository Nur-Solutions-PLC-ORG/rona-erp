CREATE TYPE "public"."attendance_source_list" AS ENUM('MANUAL', 'SELF', 'KIOSK');--> statement-breakpoint
CREATE TYPE "public"."kiosk_template_kind_list" AS ENUM('FACE', 'FINGER');--> statement-breakpoint
CREATE TYPE "public"."kiosk_attestation_status_list" AS ENUM('NONE', 'UNVERIFIED', 'CHAIN_VALID');--> statement-breakpoint
CREATE TYPE "public"."kiosk_verification_policy_list" AS ENUM('FACE_ONLY', 'FACE_OR_FINGER', 'FACE_AND_FINGER', 'CARD_AND_FACE', 'CARD_AND_FINGER');--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.credential.read' BEFORE 'kiosk.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.credential.enroll' BEFORE 'kiosk.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.credential.revoke' BEFORE 'kiosk.read';--> statement-breakpoint
CREATE TABLE "employee_biometric_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"kind" "kiosk_template_kind_list" NOT NULL,
	"finger_index" integer,
	"algorithm_version" text NOT NULL,
	"template_ciphertext" text NOT NULL,
	"enrolled_by_kiosk_id" uuid,
	"enrolled_by_user_id" uuid,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "employee_biometric_templates_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "employee_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"uid_hash" text NOT NULL,
	"uid_suffix" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "employee_cards_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "source" "attendance_source_list";--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "kiosk_id" uuid;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "methods" text[];--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "match_score" real;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "client_event_id" uuid;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "device_event_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "public_key" text;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "paired_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "attestation_status" "kiosk_attestation_status_list" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "attestation_chain" jsonb;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "device_info" jsonb;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "app_version" text;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "verification_policy" "kiosk_verification_policy_list" DEFAULT 'FACE_OR_FINGER' NOT NULL;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "admin_pin_hash" text;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "last_heartbeat" jsonb;--> statement-breakpoint
ALTER TABLE "kiosks" ADD COLUMN "last_heartbeat_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employee_biometric_templates" ADD CONSTRAINT "employee_biometric_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_biometric_templates" ADD CONSTRAINT "employee_biometric_templates_enrolled_by_kiosk_id_kiosks_id_fk" FOREIGN KEY ("enrolled_by_kiosk_id") REFERENCES "public"."kiosks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_biometric_templates" ADD CONSTRAINT "employee_biometric_templates_enrolled_by_user_id_users_id_fk" FOREIGN KEY ("enrolled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_biometric_templates" ADD CONSTRAINT "employee_biometric_templates_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_cards" ADD CONSTRAINT "employee_cards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_cards" ADD CONSTRAINT "employee_cards_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_biometric_templates_organization_updated_idx" ON "employee_biometric_templates" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE INDEX "employee_biometric_templates_organization_employee_idx" ON "employee_biometric_templates" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_biometric_templates_active_unique" ON "employee_biometric_templates" USING btree ("organization_id","employee_id","kind",coalesce("finger_index", -1)) WHERE "employee_biometric_templates"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "employee_cards_organization_updated_idx" ON "employee_cards" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_cards_active_uid_unique" ON "employee_cards" USING btree ("organization_id","uid_hash") WHERE "employee_cards"."revoked_at" is null;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_kiosk_id_kiosks_id_fk" FOREIGN KEY ("kiosk_id") REFERENCES "public"."kiosks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_organization_client_event_unique" UNIQUE("organization_id","client_event_id");