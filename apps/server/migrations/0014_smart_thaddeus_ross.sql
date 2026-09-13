CREATE TYPE "public"."ai_export_format_list" AS ENUM('pdf', 'excel', 'json');--> statement-breakpoint
CREATE TYPE "public"."ai_report_job_status_list" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ai_report_type_list" AS ENUM('attendance', 'production', 'inventory_valuation', 'finance', 'management_summary');--> statement-breakpoint
CREATE TABLE "ai_knowledge_documents" (
	"doc_id" varchar(100) PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"domain" varchar(50) NOT NULL,
	"title" varchar(250) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(80) DEFAULT 'policy' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'approved' NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_until" timestamp with time zone,
	"source_ref" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_report_jobs" (
	"report_id" varchar(80) PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"report_type" "ai_report_type_list" NOT NULL,
	"export_format" "ai_export_format_list" NOT NULL,
	"period_label" text NOT NULL,
	"payload_json" jsonb NOT NULL,
	"authorized_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "ai_report_job_status_list" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"filename" varchar(180),
	"storage_key" varchar(300),
	"byte_size" integer,
	"error_message" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "cost_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "costs" ALTER COLUMN "category" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "ai_knowledge_documents" ADD CONSTRAINT "ai_knowledge_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_report_jobs" ADD CONSTRAINT "ai_report_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_types" ADD CONSTRAINT "cost_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_knowledge_documents_organization_idx" ON "ai_knowledge_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ai_knowledge_documents_domain_idx" ON "ai_knowledge_documents" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "ai_knowledge_documents_status_idx" ON "ai_knowledge_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_report_jobs_organization_idx" ON "ai_report_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ai_report_jobs_status_next_attempt_idx" ON "ai_report_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "ai_report_jobs_organization_created_idx" ON "ai_report_jobs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "cost_types_organization_idx" ON "cost_types" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cost_types_organization_name_idx" ON "cost_types" USING btree ("organization_id","name");