CREATE TYPE "public"."cost_type_list" AS ENUM('RAW_MATERIAL', 'ELECTRICITY', 'WATER', 'LABOR', 'PACKAGING', 'FUEL', 'MAINTENANCE', 'DEPRECIATION');--> statement-breakpoint
CREATE TYPE "public"."invoice_status_list" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."payment_method_list" AS ENUM('BANK', 'CASH', 'CREDIT_NOTE');--> statement-breakpoint
CREATE TYPE "public"."commission_status_list" AS ENUM('PENDING', 'APPROVED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."customer_status_list" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."payment_terms_list" AS ENUM('IMMEDIATE', 'NET_7', 'NET_15', 'NET_30', 'NET_60', 'END_OF_MONTH');--> statement-breakpoint
CREATE TYPE "public"."sales_order_status_list" AS ENUM('DRAFT', 'CONFIRMED', 'FULFILLING', 'FULFILLED', 'CANCELLED');--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.customer.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.customer.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.customer.update';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.order.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.order.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.order.confirm';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.order.cancel';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.commission.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'sales.commission.approve';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.invoice.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.invoice.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.invoice.issue';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.invoice.void';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.payment.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.payment.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.cost.read';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.cost.create';--> statement-breakpoint
ALTER TYPE "public"."permission_list" ADD VALUE 'finance.cost.update';--> statement-breakpoint
ALTER TYPE "public"."role_key_list" ADD VALUE 'SALES_MANAGER' BEFORE 'EMPLOYEE';--> statement-breakpoint
ALTER TYPE "public"."role_key_list" ADD VALUE 'SALES_OFFICER' BEFORE 'EMPLOYEE';--> statement-breakpoint
ALTER TYPE "public"."role_key_list" ADD VALUE 'FINANCE_MANAGER' BEFORE 'EMPLOYEE';--> statement-breakpoint
ALTER TYPE "public"."role_key_list" ADD VALUE 'FINANCE_OFFICER' BEFORE 'EMPLOYEE';--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"cost_center_id" uuid,
	"category" "cost_type_list" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"sales_order_line_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"vat_percent" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"line_net" numeric(18, 2) NOT NULL,
	"line_vat" numeric(18, 2) NOT NULL,
	"line_total" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_vat_number" text,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"subtotal" numeric(18, 2) DEFAULT '0' NOT NULL,
	"discount_total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"vat_percent" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"vat_total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"payment_terms" text,
	"status" "invoice_status_list" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"method" "payment_method_list" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"reference" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"salesperson_user_id" uuid NOT NULL,
	"sales_order_id" uuid,
	"invoice_id" uuid,
	"status" "commission_status_list" DEFAULT 'PENDING' NOT NULL,
	"commission_percent" numeric(5, 2) NOT NULL,
	"amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"approved_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"salesperson_user_id" uuid NOT NULL,
	"commission_percent" numeric(5, 2) NOT NULL,
	"item_id" uuid,
	"item_category" text,
	"minimum_margin_percent" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"label" text,
	"line1" text NOT NULL,
	"line2" text,
	"city" text,
	"region" text,
	"postal_code" text,
	"country" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"title" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"vat_number" text,
	"salesperson_user_id" uuid,
	"status" "customer_status_list" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"vat_percent" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"line_net" numeric(18, 2) NOT NULL,
	"line_vat" numeric(18, 2) NOT NULL,
	"line_total" numeric(18, 2) NOT NULL,
	"lot_id" uuid,
	"reserved_quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_name" text,
	"salesperson_user_id" uuid,
	"warehouse_id" uuid NOT NULL,
	"status" "sales_order_status_list" DEFAULT 'DRAFT' NOT NULL,
	"payment_terms" "payment_terms_list",
	"reservation_id" uuid,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"subtotal" numeric(18, 2) DEFAULT '0' NOT NULL,
	"discount_total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"vat_total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total" numeric(18, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"confirmed_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "costs" ADD CONSTRAINT "costs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "costs" ADD CONSTRAINT "costs_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_organizations_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_rule_id_commission_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."commission_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_salesperson_user_id_users_id_fk" FOREIGN KEY ("salesperson_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_salesperson_user_id_users_id_fk" FOREIGN KEY ("salesperson_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_salesperson_user_id_users_id_fk" FOREIGN KEY ("salesperson_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_order_id_sales_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_lot_id_batch_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."batch_lots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_salesperson_user_id_users_id_fk" FOREIGN KEY ("salesperson_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_reservation_id_inventory_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."inventory_reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cost_centers_organization_idx" ON "cost_centers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "costs_organization_idx" ON "costs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "costs_organization_category_idx" ON "costs" USING btree ("organization_id","category");--> statement-breakpoint
CREATE INDEX "costs_organization_date_idx" ON "costs" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "costs_cost_center_idx" ON "costs" USING btree ("cost_center_id");--> statement-breakpoint
CREATE INDEX "invoice_lines_invoice_idx" ON "invoice_lines" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_lines_sales_order_line_idx" ON "invoice_lines" USING btree ("sales_order_line_id");--> statement-breakpoint
CREATE INDEX "invoices_organization_idx" ON "invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoices_organization_customer_idx" ON "invoices" USING btree ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX "invoices_organization_status_idx" ON "invoices" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "invoices_organization_issue_date_idx" ON "invoices" USING btree ("organization_id","issue_date");--> statement-breakpoint
CREATE INDEX "payment_allocations_payment_idx" ON "payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_invoice_idx" ON "payment_allocations" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_organization_payment_idx" ON "payment_allocations" USING btree ("organization_id","payment_id");--> statement-breakpoint
CREATE INDEX "payments_organization_idx" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payments_organization_invoice_idx" ON "payments" USING btree ("organization_id","invoice_id");--> statement-breakpoint
CREATE INDEX "commission_records_organization_salesperson_idx" ON "commission_records" USING btree ("organization_id","salesperson_user_id");--> statement-breakpoint
CREATE INDEX "commission_records_organization_status_idx" ON "commission_records" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "commission_records_sales_order_idx" ON "commission_records" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "commission_records_invoice_idx" ON "commission_records" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "commission_rules_organization_salesperson_idx" ON "commission_rules" USING btree ("organization_id","salesperson_user_id");--> statement-breakpoint
CREATE INDEX "commission_rules_organization_active_idx" ON "commission_rules" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "customer_addresses_customer_idx" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_addresses_organization_customer_idx" ON "customer_addresses" USING btree ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX "customer_contacts_customer_idx" ON "customer_contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_contacts_organization_customer_idx" ON "customer_contacts" USING btree ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX "customers_organization_idx" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customers_organization_name_idx" ON "customers" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "customers_organization_status_idx" ON "customers" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "customers_organization_salesperson_idx" ON "customers" USING btree ("organization_id","salesperson_user_id");--> statement-breakpoint
CREATE INDEX "sales_order_lines_order_idx" ON "sales_order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "sales_order_lines_organization_item_idx" ON "sales_order_lines" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE INDEX "sales_order_lines_lot_idx" ON "sales_order_lines" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "sales_orders_organization_idx" ON "sales_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sales_orders_organization_customer_idx" ON "sales_orders" USING btree ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX "sales_orders_organization_warehouse_idx" ON "sales_orders" USING btree ("organization_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "sales_orders_organization_status_idx" ON "sales_orders" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sales_orders_order_number_idx" ON "sales_orders" USING btree ("order_number");