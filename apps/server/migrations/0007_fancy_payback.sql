CREATE TYPE "public"."inspection_status_list" AS ENUM('IN_PROGRESS', 'COMPLETED', 'REVIEWED');--> statement-breakpoint
CREATE TYPE "public"."inspection_type_list" AS ENUM('INCOMING', 'IN_PROCESS', 'FINISHED_GOOD');--> statement-breakpoint
CREATE TYPE "public"."qa_decision_list" AS ENUM('RELEASE', 'REJECT');--> statement-breakpoint
CREATE TYPE "public"."test_result_list" AS ENUM('PASS', 'FAIL');--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'quality.inspection.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'quality.inspection.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'quality.inspection.review';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'quality.inventory.release';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'quality.inventory.reject';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'traceability.read';--> statement-breakpoint
ALTER TYPE "public"."role_key_list" ADD VALUE 'QUALITY_OFFICER' BEFORE 'EMPLOYEE';--> statement-breakpoint
CREATE TABLE "inspection_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"inspection_id" uuid NOT NULL,
	"name" text NOT NULL,
	"specification" text,
	"method" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_tests_inspection_name_unique" UNIQUE("inspection_id","name")
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"inspection_number" text NOT NULL,
	"type" "inspection_type_list" NOT NULL,
	"lot_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"status" "inspection_status_list" DEFAULT 'IN_PROGRESS' NOT NULL,
	"performed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "inspections_organization_number_unique" UNIQUE("organization_id","inspection_number"),
	CONSTRAINT "inspections_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "inspections_completed_at_set_check" CHECK ("inspections"."status" = 'IN_PROGRESS' or "inspections"."completed_at" is not null),
	CONSTRAINT "inspections_reviewed_at_set_check" CHECK ("inspections"."status" <> 'REVIEWED' or "inspections"."reviewed_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "test_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"inspection_id" uuid NOT NULL,
	"result" "test_result_list" NOT NULL,
	"measured_value" numeric(18, 4),
	"notes" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_results_test_unique" UNIQUE("test_id"),
	CONSTRAINT "test_results_measured_value_check" CHECK ("test_results"."measured_value" is null or "test_results"."measured_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "qa_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"inspection_id" uuid NOT NULL,
	"decision" "qa_decision_list" NOT NULL,
	"notes" text,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qa_reviews_inspection_unique" UNIQUE("inspection_id")
);
--> statement-breakpoint
CREATE TABLE "release_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"inspection_id" uuid NOT NULL,
	"decision" "qa_decision_list" NOT NULL,
	"decided_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inspection_tests" ADD CONSTRAINT "inspection_tests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_tests" ADD CONSTRAINT "inspection_tests_inspection_tenant_fk" FOREIGN KEY ("inspection_id","organization_id") REFERENCES "public"."inspections"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_lot_tenant_fk" FOREIGN KEY ("lot_id","organization_id") REFERENCES "public"."batch_lots"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_item_tenant_fk" FOREIGN KEY ("item_id","organization_id") REFERENCES "public"."items"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_tenant_fk" FOREIGN KEY ("test_id","organization_id") REFERENCES "public"."inspection_tests"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_inspection_tenant_fk" FOREIGN KEY ("inspection_id","organization_id") REFERENCES "public"."inspections"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_inspection_tenant_fk" FOREIGN KEY ("inspection_id","organization_id") REFERENCES "public"."inspections"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_decisions" ADD CONSTRAINT "release_decisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_decisions" ADD CONSTRAINT "release_decisions_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_decisions" ADD CONSTRAINT "release_decisions_lot_tenant_fk" FOREIGN KEY ("lot_id","organization_id") REFERENCES "public"."batch_lots"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_decisions" ADD CONSTRAINT "release_decisions_inspection_tenant_fk" FOREIGN KEY ("inspection_id","organization_id") REFERENCES "public"."inspections"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspection_tests_organization_inspection_idx" ON "inspection_tests" USING btree ("organization_id","inspection_id");--> statement-breakpoint
CREATE INDEX "inspections_organization_status_idx" ON "inspections" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "inspections_organization_lot_idx" ON "inspections" USING btree ("organization_id","lot_id");--> statement-breakpoint
CREATE INDEX "inspections_organization_item_idx" ON "inspections" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "test_results_organization_inspection_idx" ON "test_results" USING btree ("organization_id","inspection_id");--> statement-breakpoint
CREATE INDEX "qa_reviews_organization_inspection_idx" ON "qa_reviews" USING btree ("organization_id","inspection_id");--> statement-breakpoint
CREATE INDEX "release_decisions_organization_lot_idx" ON "release_decisions" USING btree ("organization_id","lot_id");--> statement-breakpoint
CREATE INDEX "release_decisions_organization_inspection_idx" ON "release_decisions" USING btree ("organization_id","inspection_id");