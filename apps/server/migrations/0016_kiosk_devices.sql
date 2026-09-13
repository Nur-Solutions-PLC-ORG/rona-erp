CREATE TYPE "public"."kiosk_status_list" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
ALTER TYPE "public"."ai_report_type_list" ADD VALUE 'quality' BEFORE 'finance';--> statement-breakpoint
ALTER TYPE "public"."ai_report_type_list" ADD VALUE 'sales' BEFORE 'finance';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'kiosk.read' BEFORE 'sales.customer.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'kiosk.create' BEFORE 'sales.customer.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'kiosk.activate' BEFORE 'sales.customer.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'kiosk.deactivate' BEFORE 'sales.customer.read';--> statement-breakpoint
CREATE TABLE "kiosks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "kiosk_status_list" DEFAULT 'ACTIVE' NOT NULL,
	"token_hash" text NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kiosks_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "kiosks_organization_device_unique" UNIQUE("organization_id","device_id"),
	CONSTRAINT "kiosks_device_id_length_check" CHECK (length("kiosks"."device_id") >= 6 and length("kiosks"."device_id") <= 64)
);
--> statement-breakpoint
ALTER TABLE "kiosks" ADD CONSTRAINT "kiosks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kiosks_organization_status_idx" ON "kiosks" USING btree ("organization_id","status");