CREATE TYPE "public"."bom_version_status_list" AS ENUM('DRAFT', 'APPROVED', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."production_batch_status_list" AS ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."production_order_status_list" AS ENUM('DRAFT', 'PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.bom.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.bom.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.bom.update';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.bom.approve';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.production.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.production.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.production.approve';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'manufacturing.production.execute';--> statement-breakpoint
CREATE TABLE "bom_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"bom_version_id" uuid NOT NULL,
	"component_item_id" uuid NOT NULL,
	"quantity_per_unit" numeric(18, 6) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bom_lines_version_component_unique" UNIQUE("bom_version_id","component_item_id"),
	CONSTRAINT "bom_lines_quantity_per_unit_positive_check" CHECK ("bom_lines"."quantity_per_unit" > 0)
);
--> statement-breakpoint
CREATE TABLE "bom_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"bom_id" uuid NOT NULL,
	"version" numeric(10, 0) NOT NULL,
	"status" "bom_version_status_list" DEFAULT 'DRAFT' NOT NULL,
	"is_used_in_production" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bom_versions_bom_version_unique" UNIQUE("bom_id","version"),
	CONSTRAINT "bom_versions_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "boms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"item_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boms_organization_code_unique" UNIQUE("organization_id","code"),
	CONSTRAINT "boms_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "material_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"production_batch_id" uuid NOT NULL,
	"order_material_id" uuid,
	"item_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"substituted_for_item_id" uuid,
	"movement_id" uuid,
	"quantity" numeric(18, 4) NOT NULL,
	"is_scrap" boolean DEFAULT false NOT NULL,
	"notes" text,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_consumptions_quantity_positive_check" CHECK ("material_consumptions"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "material_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"production_batch_id" uuid NOT NULL,
	"order_material_id" uuid,
	"item_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"movement_id" uuid,
	"quantity" numeric(18, 4) NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_returns_quantity_positive_check" CHECK ("material_returns"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "production_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"production_order_id" uuid NOT NULL,
	"batch_number" text NOT NULL,
	"status" "production_batch_status_list" DEFAULT 'IN_PROGRESS' NOT NULL,
	"scrap_quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"output_quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"notes" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_batches_organization_number_unique" UNIQUE("organization_id","batch_number"),
	CONSTRAINT "production_batches_quantities_non_negative_check" CHECK ("production_batches"."scrap_quantity" >= 0 and "production_batches"."output_quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "production_order_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"production_order_id" uuid NOT NULL,
	"component_item_id" uuid NOT NULL,
	"quantity_per_unit" numeric(18, 6) NOT NULL,
	"required_quantity" numeric(18, 4) NOT NULL,
	"reservation_id" uuid,
	"consumed_quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"returned_quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_order_materials_order_component_unique" UNIQUE("production_order_id","component_item_id"),
	CONSTRAINT "production_order_materials_required_positive_check" CHECK ("production_order_materials"."required_quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_number" text NOT NULL,
	"bom_id" uuid NOT NULL,
	"bom_version_id" uuid,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"status" "production_order_status_list" DEFAULT 'DRAFT' NOT NULL,
	"planned_quantity" numeric(18, 4) NOT NULL,
	"expected_yield_percent" numeric(18, 4),
	"expected_quantity" numeric(18, 4),
	"actual_quantity" numeric(18, 4),
	"actual_yield_percent" numeric(18, 4),
	"material_variance" jsonb,
	"planned_start_date" timestamp with time zone,
	"planned_end_date" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_orders_organization_number_unique" UNIQUE("organization_id","order_number"),
	CONSTRAINT "production_orders_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "production_orders_planned_quantity_positive_check" CHECK ("production_orders"."planned_quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "production_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"production_batch_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"movement_id" uuid,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_outputs_quantity_positive_check" CHECK ("production_outputs"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_component_item_id_items_id_fk" FOREIGN KEY ("component_item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_version_tenant_fk" FOREIGN KEY ("bom_version_id","organization_id") REFERENCES "public"."bom_versions"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_versions" ADD CONSTRAINT "bom_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_versions" ADD CONSTRAINT "bom_versions_bom_tenant_fk" FOREIGN KEY ("bom_id","organization_id") REFERENCES "public"."boms"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boms" ADD CONSTRAINT "boms_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boms" ADD CONSTRAINT "boms_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumptions" ADD CONSTRAINT "material_consumptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumptions" ADD CONSTRAINT "material_consumptions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumptions" ADD CONSTRAINT "material_consumptions_lot_id_batch_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."batch_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumptions" ADD CONSTRAINT "material_consumptions_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumptions" ADD CONSTRAINT "material_consumptions_batch_tenant_fk" FOREIGN KEY ("production_batch_id","organization_id") REFERENCES "public"."production_batches"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_lot_id_batch_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."batch_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_returns" ADD CONSTRAINT "material_returns_batch_tenant_fk" FOREIGN KEY ("production_batch_id","organization_id") REFERENCES "public"."production_batches"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_order_tenant_fk" FOREIGN KEY ("production_order_id","organization_id") REFERENCES "public"."production_orders"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_component_item_id_items_id_fk" FOREIGN KEY ("component_item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_reservation_id_inventory_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."inventory_reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_order_tenant_fk" FOREIGN KEY ("production_order_id","organization_id") REFERENCES "public"."production_orders"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_bom_tenant_fk" FOREIGN KEY ("bom_id","organization_id") REFERENCES "public"."boms"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_bom_version_tenant_fk" FOREIGN KEY ("bom_version_id","organization_id") REFERENCES "public"."bom_versions"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_lot_id_batch_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."batch_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_batch_tenant_fk" FOREIGN KEY ("production_batch_id","organization_id") REFERENCES "public"."production_batches"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bom_versions_bom_status_idx" ON "bom_versions" USING btree ("bom_id","status");--> statement-breakpoint
CREATE INDEX "bom_versions_organization_status_idx" ON "bom_versions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "boms_organization_item_idx" ON "boms" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "material_consumptions_organization_batch_idx" ON "material_consumptions" USING btree ("organization_id","production_batch_id");--> statement-breakpoint
CREATE INDEX "material_consumptions_organization_lot_idx" ON "material_consumptions" USING btree ("organization_id","lot_id");--> statement-breakpoint
CREATE INDEX "material_returns_organization_batch_idx" ON "material_returns" USING btree ("organization_id","production_batch_id");--> statement-breakpoint
CREATE INDEX "production_batches_organization_order_idx" ON "production_batches" USING btree ("organization_id","production_order_id");--> statement-breakpoint
CREATE INDEX "production_orders_organization_status_idx" ON "production_orders" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "production_orders_organization_item_idx" ON "production_orders" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "production_outputs_organization_batch_idx" ON "production_outputs" USING btree ("organization_id","production_batch_id");--> statement-breakpoint
CREATE INDEX "production_outputs_organization_lot_idx" ON "production_outputs" USING btree ("organization_id","lot_id");