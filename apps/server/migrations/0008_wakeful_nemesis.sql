CREATE TYPE "public"."attendance_event_type_list" AS ENUM('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END');--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.employee.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.employee.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.employee.update';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.employee.archive';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.attendance.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.attendance.clock';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.attendance.manage';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.schedule.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.schedule.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'hr.schedule.update';--> statement-breakpoint
ALTER TYPE "public"."role_key_list" ADD VALUE 'HR_MANAGER' BEFORE 'EMPLOYEE';--> statement-breakpoint
ALTER TYPE "public"."role_key_list" ADD VALUE 'HR_OFFICER' BEFORE 'EMPLOYEE';--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"department_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positions_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "positions_organization_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "attendance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"event_type" "attendance_event_type_list" NOT NULL,
	"event_at" timestamp with time zone NOT NULL,
	"recorded_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_events_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "attendance_events_event_at_not_future_check" CHECK ("attendance_events"."event_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "employee_emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_emergency_contacts_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "employee_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_shifts_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "employee_shifts_organization_employee_from_unique" UNIQUE("organization_id","employee_id","effective_from"),
	CONSTRAINT "employee_shifts_effective_range_check" CHECK ("employee_shifts"."effective_to" is null or "employee_shifts"."effective_to" >= "employee_shifts"."effective_from")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "shifts_organization_code_unique" UNIQUE("organization_id","code"),
	CONSTRAINT "shifts_break_minutes_check" CHECK ("shifts"."break_minutes" >= 0 and "shifts"."break_minutes" <= 1440)
);
--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "position_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "hire_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_tenant_fk" FOREIGN KEY ("department_id","organization_id") REFERENCES "public"."departments"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_emergency_contacts" ADD CONSTRAINT "employee_emergency_contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_emergency_contacts" ADD CONSTRAINT "employee_emergency_contacts_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_shift_tenant_fk" FOREIGN KEY ("shift_id","organization_id") REFERENCES "public"."shifts"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "positions_organization_department_idx" ON "positions" USING btree ("organization_id","department_id");--> statement-breakpoint
CREATE INDEX "attendance_events_organization_employee_idx" ON "attendance_events" USING btree ("organization_id","employee_id","event_at");--> statement-breakpoint
CREATE INDEX "attendance_events_organization_type_idx" ON "attendance_events" USING btree ("organization_id","event_type","event_at");--> statement-breakpoint
CREATE INDEX "employee_emergency_contacts_organization_employee_idx" ON "employee_emergency_contacts" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_shifts_active_unique" ON "employee_shifts" USING btree ("organization_id","employee_id") WHERE "employee_shifts"."effective_to" is null;--> statement-breakpoint
CREATE INDEX "employee_shifts_organization_employee_idx" ON "employee_shifts" USING btree ("organization_id","employee_id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_tenant_fk" FOREIGN KEY ("department_id","organization_id") REFERENCES "public"."departments"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_tenant_fk" FOREIGN KEY ("position_id","organization_id") REFERENCES "public"."positions"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "departments_organization_idx" ON "departments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "employees_organization_status_idx" ON "employees" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "employees_organization_department_idx" ON "employees" USING btree ("organization_id","department_id");--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_id_organization_unique" UNIQUE("id","organization_id");--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_code_unique" UNIQUE("organization_id","code");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_id_organization_unique" UNIQUE("id","organization_id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_eid_unique" UNIQUE("organization_id","eid");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_user_unique" UNIQUE("organization_id","user_id");