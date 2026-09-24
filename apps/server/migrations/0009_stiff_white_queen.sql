ALTER TABLE "batch_lots" ADD CONSTRAINT "batch_lots_id_organization_unique" UNIQUE("id","organization_id");--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_id_organization_unique" UNIQUE("id","organization_id");--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_id_organization_unique" UNIQUE("id","organization_id");--> statement-breakpoint
ALTER TABLE "inspection_tests" ADD CONSTRAINT "inspection_tests_id_organization_unique" UNIQUE("id","organization_id");