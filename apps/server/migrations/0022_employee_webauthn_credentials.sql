CREATE TABLE "employee_webauthn_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "employee_webauthn_credentials_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "employee_webauthn_credentials_organization_credential_unique" UNIQUE("organization_id","credential_id")
);
--> statement-breakpoint
ALTER TABLE "employee_webauthn_credentials" ADD CONSTRAINT "employee_webauthn_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_webauthn_credentials" ADD CONSTRAINT "employee_webauthn_credentials_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_webauthn_credentials_organization_employee_idx" ON "employee_webauthn_credentials" USING btree ("organization_id","employee_id");