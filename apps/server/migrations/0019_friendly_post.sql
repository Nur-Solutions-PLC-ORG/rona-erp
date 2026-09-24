CREATE TABLE "employee_faces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"facial_id" text NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "employee_faces_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "employee_faces_facial_id_unique" UNIQUE("facial_id")
);
--> statement-breakpoint
ALTER TABLE "employee_faces" ADD CONSTRAINT "employee_faces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_faces" ADD CONSTRAINT "employee_faces_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_faces_organization_employee_idx" ON "employee_faces" USING btree ("organization_id","employee_id");