CREATE TYPE "public"."allocation_strategy_list" AS ENUM('FIFO', 'FEFO');--> statement-breakpoint
CREATE TYPE "public"."item_type_list" AS ENUM('RAW_MATERIAL', 'PACKAGING', 'CONSUMABLE', 'SEMI_FINISHED', 'FINISHED_GOOD');--> statement-breakpoint
CREATE TYPE "public"."movement_type_list" AS ENUM('RECEIPT', 'ISSUE', 'TRANSFER', 'RETURN', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."quality_status_list" AS ENUM('QUARANTINED', 'APPROVED', 'REJECTED', 'RELEASED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."reservation_status_list" AS ENUM('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.item.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.item.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.item.update';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.item.archive';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.warehouse.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.warehouse.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.warehouse.update';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.lot.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.lot.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.lot.update';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.stock.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.stock.receive';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.stock.issue';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.stock.transfer';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.stock.adjust';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.stock.return';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.movement.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.reservation.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.reservation.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.reservation.release';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'inventory.reservation.consume';--> statement-breakpoint
CREATE TABLE "batch_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"lot_number" text NOT NULL,
	"supplier" text,
	"receipt_date" timestamp with time zone,
	"manufacture_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"quality_status" "quality_status_list" DEFAULT 'QUARANTINED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_lots_item_lot_unique" UNIQUE("organization_id","item_id","lot_number")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "item_type_list" NOT NULL,
	"unit_of_measure_id" uuid NOT NULL,
	"reorder_point" numeric(18, 4),
	"reorder_quantity" numeric(18, 4),
	"barcode" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_organization_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "units_of_measure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "units_of_measure_organization_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "warehouse_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_locations_warehouse_code_unique" UNIQUE("warehouse_id","code")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_organization_code_unique" UNIQUE("organization_id","code"),
	CONSTRAINT "warehouses_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" "movement_type_list" NOT NULL,
	"item_id" uuid NOT NULL,
	"lot_id" uuid,
	"from_location_id" uuid,
	"to_location_id" uuid,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4),
	"reference" text,
	"notes" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movements_quantity_positive_check" CHECK ("inventory_movements"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"status" "reservation_status_list" DEFAULT 'ACTIVE' NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"allocated_lots" jsonb,
	"reference" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "inventory_reservations_quantity_positive_check" CHECK ("inventory_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "stock_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_balances_item_lot_location_unique" UNIQUE("item_id","lot_id","location_id"),
	CONSTRAINT "stock_balances_quantity_non_negative_check" CHECK ("stock_balances"."quantity" >= 0),
	CONSTRAINT "stock_balances_reserved_within_quantity_check" CHECK ("stock_balances"."reserved_quantity" >= 0 and "stock_balances"."reserved_quantity" <= "stock_balances"."quantity")
);
--> statement-breakpoint
ALTER TABLE "batch_lots" ADD CONSTRAINT "batch_lots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_lots" ADD CONSTRAINT "batch_lots_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_unit_of_measure_id_units_of_measure_id_fk" FOREIGN KEY ("unit_of_measure_id") REFERENCES "public"."units_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouse_tenant_fk" FOREIGN KEY ("warehouse_id","organization_id") REFERENCES "public"."warehouses"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_lot_id_batch_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."batch_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_from_location_id_warehouse_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_to_location_id_warehouse_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_lot_id_batch_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."batch_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_lots_organization_item_idx" ON "batch_lots" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "batch_lots_organization_quality_idx" ON "batch_lots" USING btree ("organization_id","quality_status");--> statement-breakpoint
CREATE INDEX "batch_lots_organization_expiry_idx" ON "batch_lots" USING btree ("organization_id","expiry_date");--> statement-breakpoint
CREATE INDEX "items_organization_type_idx" ON "items" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "items_organization_archived_idx" ON "items" USING btree ("organization_id","is_archived");--> statement-breakpoint
CREATE INDEX "warehouse_locations_organization_idx" ON "warehouse_locations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "warehouses_organization_active_idx" ON "warehouses" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "inventory_movements_organization_created_idx" ON "inventory_movements" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_organization_item_idx" ON "inventory_movements" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_organization_lot_idx" ON "inventory_movements" USING btree ("organization_id","lot_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_organization_location_idx" ON "inventory_movements" USING btree ("organization_id","from_location_id","to_location_id");--> statement-breakpoint
CREATE INDEX "inventory_reservations_organization_status_idx" ON "inventory_reservations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "inventory_reservations_organization_item_idx" ON "inventory_reservations" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "inventory_reservations_organization_warehouse_idx" ON "inventory_reservations" USING btree ("organization_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_balances_organization_item_idx" ON "stock_balances" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "stock_balances_organization_location_idx" ON "stock_balances" USING btree ("organization_id","location_id");--> statement-breakpoint
CREATE INDEX "stock_balances_organization_lot_idx" ON "stock_balances" USING btree ("organization_id","lot_id");