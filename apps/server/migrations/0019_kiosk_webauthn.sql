CREATE TABLE "employee_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint NOT NULL,
	"user_handle" text NOT NULL,
	"transports" text[] DEFAULT '{}' NOT NULL,
	"device_name" text NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "employee_credentials_credential_id_unique" UNIQUE("credential_id"),
	CONSTRAINT "employee_credentials_tenant_unique" UNIQUE("id","organization_id","employee_id"),
	CONSTRAINT "employee_credentials_counter_check" CHECK ("employee_credentials"."counter" >= 0 and "employee_credentials"."counter" <= 4294967295),
	CONSTRAINT "employee_credentials_device_type_check" CHECK ("employee_credentials"."device_type" in ('singleDevice', 'multiDevice'))
);
--> statement-breakpoint
CREATE TABLE "kiosk_employee_grants" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"kiosk_id" uuid NOT NULL,
	"session_hash" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"credential_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webauthn_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"challenge" text NOT NULL,
	"employee_id" uuid,
	"actor_id" uuid,
	"kiosk_id" uuid,
	"session_hash" text,
	"device_name" text,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "webauthn_challenges_binding_check" CHECK (("webauthn_challenges"."purpose" = 'registration' and "webauthn_challenges"."employee_id" is not null and "webauthn_challenges"."actor_id" is not null and "webauthn_challenges"."device_name" is not null and "webauthn_challenges"."kiosk_id" is null and "webauthn_challenges"."session_hash" is null) or ("webauthn_challenges"."purpose" = 'authentication' and "webauthn_challenges"."kiosk_id" is not null and "webauthn_challenges"."session_hash" is not null and "webauthn_challenges"."actor_id" is null and "webauthn_challenges"."device_name" is null))
);
--> statement-breakpoint
ALTER TABLE "employee_credentials" ADD CONSTRAINT "employee_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_credentials" ADD CONSTRAINT "employee_credentials_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_employee_grants" ADD CONSTRAINT "kiosk_employee_grants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_employee_grants" ADD CONSTRAINT "kiosk_employee_grants_kiosk_tenant_fk" FOREIGN KEY ("kiosk_id","organization_id") REFERENCES "public"."kiosks"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_employee_grants" ADD CONSTRAINT "kiosk_employee_grants_credential_tenant_fk" FOREIGN KEY ("credential_id","organization_id","employee_id") REFERENCES "public"."employee_credentials"("id","organization_id","employee_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_employee_tenant_fk" FOREIGN KEY ("employee_id","organization_id") REFERENCES "public"."employees"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_kiosk_tenant_fk" FOREIGN KEY ("kiosk_id","organization_id") REFERENCES "public"."kiosks"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_credentials_employee_idx" ON "employee_credentials" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE INDEX "kiosk_employee_grants_expiry_idx" ON "kiosk_employee_grants" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "webauthn_challenges_expiry_idx" ON "webauthn_challenges" USING btree ("expires_at");