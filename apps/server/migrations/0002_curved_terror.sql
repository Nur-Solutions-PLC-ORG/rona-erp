CREATE TYPE "public"."currency_list" AS ENUM('ETB', 'USD');--> statement-breakpoint
CREATE TYPE "public"."employee_status_list" AS ENUM('active', 'suspended', 'resigned', 'on_leave', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."gender_list" AS ENUM('M', 'F');--> statement-breakpoint
CREATE TYPE "public"."organization_status_list" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."platform_config_keys" AS ENUM('maintenance_mode', 'name', 'contact_phone', 'contact_email');--> statement-breakpoint
CREATE TYPE "public"."platform_config_type_list" AS ENUM('string', 'number', 'boolean');--> statement-breakpoint
ALTER TYPE "public"."positions_list" ADD VALUE 'super_admin' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"modules" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"eid" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"gender" "gender_list" DEFAULT 'M' NOT NULL,
	"birth_date" date NOT NULL,
	"status" "employee_status_list" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"currency" "currency_list" DEFAULT 'ETB' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"country" text NOT NULL,
	"status" "organization_status_list" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "platform_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "platform_config_keys" NOT NULL,
	"value" text NOT NULL,
	"type" "platform_config_type_list" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_configs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;