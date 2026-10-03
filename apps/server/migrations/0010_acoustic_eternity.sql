ALTER TABLE "user_roles" ALTER COLUMN "module" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "module" SET DEFAULT '{}'::text;--> statement-breakpoint
DROP TYPE "public"."modules_list";--> statement-breakpoint
CREATE TYPE "public"."modules_list" AS ENUM('workforce', 'inventory', 'manufacturing', 'quality', 'traceability', 'organization');--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "module" SET DEFAULT '{}'::"public"."modules_list"[];--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "module" SET DATA TYPE "public"."modules_list"[] USING "module"::"public"."modules_list"[];