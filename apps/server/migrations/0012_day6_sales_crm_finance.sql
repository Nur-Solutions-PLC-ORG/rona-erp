-- Day 6: CRM / Sales / Finance / Commissions / Cost Management

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TYPE "public"."customer_status_list" AS ENUM('ACTIVE', 'INACTIVE');

CREATE TABLE IF NOT EXISTS "customers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "phone" text NOT NULL,
    "email" text,
    "vat_number" text,
    "salesperson_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "status" "public"."customer_status_list" DEFAULT 'ACTIVE' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "customers_organization_idx" ON "customers"("organization_id");
CREATE INDEX IF NOT EXISTS "customers_organization_name_idx" ON "customers"("organization_id", "name");
CREATE INDEX IF NOT EXISTS "customers_organization_status_idx" ON "customers"("organization_id", "status");
CREATE INDEX IF NOT EXISTS "customers_organization_salesperson_idx" ON "customers"("organization_id", "salesperson_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_organization_name_phone_unique" ON "customers"("organization_id", "name", "phone");

CREATE TABLE IF NOT EXISTS "customer_contacts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "phone" text,
    "email" text,
    "title" text,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "customer_contacts_customer_idx" ON "customer_contacts"("customer_id");
CREATE INDEX IF NOT EXISTS "customer_contacts_organization_customer_idx" ON "customer_contacts"("organization_id", "customer_id");

CREATE TABLE IF NOT EXISTS "customer_addresses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS "customer_addresses_customer_idx" ON "customer_addresses"("customer_id");
CREATE INDEX IF NOT EXISTS "customer_addresses_organization_customer_idx" ON "customer_addresses"("organization_id", "customer_id");

-- ============================================================
-- SALES ORDERS
-- ============================================================
CREATE TYPE IF NOT EXISTS "public"."sales_order_status_list" AS ENUM('DRAFT', 'CONFIRMED', 'FULFILLING', 'FULFILLED', 'CANCELLED');
CREATE TYPE IF NOT EXISTS "public"."payment_terms_list" AS ENUM('IMMEDIATE', 'NET_7', 'NET_15', 'NET_30', 'NET_60', 'END_OF_MONTH');

CREATE TABLE IF NOT EXISTS "sales_orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "order_number" text NOT NULL,
    "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE RESTRICT,
    "customer_name" text,
    "salesperson_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "warehouse_id" uuid NOT NULL REFERENCES "warehouses"("id") ON DELETE RESTRICT,
    "status" "public"."sales_order_status_list" DEFAULT 'DRAFT' NOT NULL,
    "payment_terms" "public"."payment_terms_list",
    "reservation_id" uuid REFERENCES "inventory_reservations"("id") ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS "sales_orders_organization_idx" ON "sales_orders"("organization_id");
CREATE INDEX IF NOT EXISTS "sales_orders_organization_customer_idx" ON "sales_orders"("organization_id", "customer_id");
CREATE INDEX IF NOT EXISTS "sales_orders_organization_warehouse_idx" ON "sales_orders"("organization_id", "warehouse_id");
CREATE INDEX IF NOT EXISTS "sales_orders_organization_status_idx" ON "sales_orders"("organization_id", "status");
CREATE INDEX IF NOT EXISTS "sales_orders_order_number_idx" ON "sales_orders"("order_number");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_orders_organization_order_number_unique" ON "sales_orders"("organization_id", "order_number");

CREATE TABLE IF NOT EXISTS "sales_order_lines" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
    "item_id" uuid NOT NULL REFERENCES "items"("id") ON DELETE RESTRICT,
    "quantity" numeric(18, 4) NOT NULL,
    "unit_price" numeric(18, 2) NOT NULL,
    "discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
    "vat_percent" numeric(5, 2) DEFAULT '15.00' NOT NULL,
    "line_net" numeric(18, 2) NOT NULL,
    "line_vat" numeric(18, 2) NOT NULL,
    "line_total" numeric(18, 2) NOT NULL,
    "lot_id" uuid REFERENCES "batch_lots"("id") ON DELETE SET NULL,
    "reserved_quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "sales_order_lines_order_idx" ON "sales_order_lines"("order_id");
CREATE INDEX IF NOT EXISTS "sales_order_lines_organization_item_idx" ON "sales_order_lines"("organization_id", "item_id");
CREATE INDEX IF NOT EXISTS "sales_order_lines_lot_idx" ON "sales_order_lines"("lot_id");

-- ============================================================
-- COMMISSIONS
-- ============================================================
CREATE TYPE IF NOT EXISTS "public"."commission_status_list" AS ENUM('PENDING', 'APPROVED', 'PAID');

CREATE TABLE IF NOT EXISTS "commission_rules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "salesperson_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "commission_percent" numeric(5, 2) NOT NULL,
    "item_id" uuid REFERENCES "items"("id") ON DELETE SET NULL,
    "item_category" text,
    "minimum_margin_percent" numeric(5, 2),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "commission_rules_organization_salesperson_idx" ON "commission_rules"("organization_id", "salesperson_user_id");
CREATE INDEX IF NOT EXISTS "commission_rules_organization_active_idx" ON "commission_rules"("organization_id", "is_active");

CREATE TABLE IF NOT EXISTS "commission_records" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "rule_id" uuid NOT NULL REFERENCES "commission_rules"("id") ON DELETE RESTRICT,
    "salesperson_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "sales_order_id" uuid REFERENCES "sales_orders"("id") ON DELETE SET NULL,
    "invoice_id" uuid REFERENCES "invoices"("id") ON DELETE SET NULL,
    "status" "public"."commission_status_list" DEFAULT 'PENDING' NOT NULL,
    "commission_percent" numeric(5, 2) NOT NULL,
    "amount" numeric(18, 2) DEFAULT '0' NOT NULL,
    "approved_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "commission_records_organization_salesperson_idx" ON "commission_records"("organization_id", "salesperson_user_id");
CREATE INDEX IF NOT EXISTS "commission_records_organization_status_idx" ON "commission_records"("organization_id", "status");
CREATE INDEX IF NOT EXISTS "commission_records_sales_order_idx" ON "commission_records"("sales_order_id");
CREATE INDEX IF NOT EXISTS "commission_records_invoice_idx" ON "commission_records"("invoice_id");

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TYPE IF NOT EXISTS "public"."invoice_status_list" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID');

CREATE TABLE IF NOT EXISTS "invoices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "invoice_number" text NOT NULL,
    "company_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
    "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE RESTRICT,
    "customer_vat_number" text,
    "issue_date" timestamp with time zone NOT NULL DEFAULT now(),
    "due_date" timestamp with time zone NOT NULL,
    "subtotal" numeric(18, 2) DEFAULT '0' NOT NULL,
    "discount_total" numeric(18, 2) DEFAULT '0' NOT NULL,
    "vat_percent" numeric(5, 2) DEFAULT '15.00' NOT NULL,
    "vat_total" numeric(18, 2) DEFAULT '0' NOT NULL,
    "total" numeric(18, 2) DEFAULT '0' NOT NULL,
    "payment_terms" "public"."payment_terms_list",
    "status" "public"."invoice_status_list" DEFAULT 'DRAFT' NOT NULL,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "invoices_organization_idx" ON "invoices"("organization_id");
CREATE INDEX IF NOT EXISTS "invoices_organization_customer_idx" ON "invoices"("organization_id", "customer_id");
CREATE INDEX IF NOT EXISTS "invoices_organization_status_idx" ON "invoices"("organization_id", "status");
CREATE INDEX IF NOT EXISTS "invoices_organization_issue_date_idx" ON "invoices"("organization_id", "issue_date");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_organization_invoice_number_unique" ON "invoices"("organization_id", "invoice_number");

CREATE TABLE IF NOT EXISTS "invoice_lines" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
    "sales_order_line_id" uuid REFERENCES "sales_order_lines"("id") ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS "invoice_lines_invoice_idx" ON "invoice_lines"("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_lines_sales_order_line_idx" ON "invoice_lines"("sales_order_line_id");

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TYPE IF NOT EXISTS "public"."payment_method_list" AS ENUM('BANK', 'CASH', 'CREDIT_NOTE');

CREATE TABLE IF NOT EXISTS "payments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE RESTRICT,
    "method" "public"."payment_method_list" NOT NULL,
    "amount" numeric(18, 2) NOT NULL,
    "reference" text,
    "date" timestamp with time zone DEFAULT now() NOT NULL,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payments_organization_idx" ON "payments"("organization_id");
CREATE INDEX IF NOT EXISTS "payments_organization_invoice_idx" ON "payments"("organization_id", "invoice_id");

CREATE TABLE IF NOT EXISTS "payment_allocations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "payment_id" uuid NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
    "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE RESTRICT,
    "amount" numeric(18, 2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_allocations_payment_idx" ON "payment_allocations"("payment_id");
CREATE INDEX IF NOT EXISTS "payment_allocations_invoice_idx" ON "payment_allocations"("invoice_id");
CREATE INDEX IF NOT EXISTS "payment_allocations_organization_payment_idx" ON "payment_allocations"("organization_id", "payment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_allocations_payment_invoice_unique" ON "payment_allocations"("payment_id", "invoice_id");

-- ============================================================
-- COSTS
-- ============================================================
CREATE TYPE IF NOT EXISTS "public"."cost_type_list" AS ENUM('RAW_MATERIAL', 'ELECTRICITY', 'WATER', 'LABOR', 'PACKAGING', 'FUEL', 'MAINTENANCE', 'DEPRECIATION');

CREATE TABLE IF NOT EXISTS "cost_centers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "code" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cost_centers_organization_idx" ON "cost_centers"("organization_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cost_centers_organization_code_unique" ON "cost_centers"("organization_id", "code");

CREATE TABLE IF NOT EXISTS "costs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "cost_center_id" uuid REFERENCES "cost_centers"("id") ON DELETE SET NULL,
    "category" "public"."cost_type_list" NOT NULL,
    "amount" numeric(18, 2) NOT NULL,
    "date" timestamp with time zone NOT NULL DEFAULT now(),
    "description" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "costs_organization_idx" ON "costs"("organization_id");
CREATE INDEX IF NOT EXISTS "costs_organization_category_idx" ON "costs"("organization_id", "category");
CREATE INDEX IF NOT EXISTS "costs_organization_date_idx" ON "costs"("organization_id", "date");
CREATE INDEX IF NOT EXISTS "costs_cost_center_idx" ON "costs"("cost_center_id");
