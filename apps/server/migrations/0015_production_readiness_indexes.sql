-- Performance and scalability indexes identified during the production
-- readiness audit. All are CREATE IF NOT EXISTS so this migration is
-- safe to re-run and safe on databases where some indexes were added
-- manually.

-- user_roles.user_id: queried on EVERY authenticated request (role
-- lookup in auth.service getRoles). Without it, Postgres sequential
-- scans the whole user_roles table per request.
CREATE INDEX IF NOT EXISTS "user_roles_user_id_idx" ON "user_roles" ("user_id");

-- audit_logs (organization_id, actor_id): supports filtering the audit
-- list by actor within a tenant (audit.repository count/list).
CREATE INDEX IF NOT EXISTS "audit_logs_organization_actor_idx" ON "audit_logs" ("organization_id", "actor_id");

-- inventory_reservations.reference: supports releasing order
-- reservations on sales-order cancel (findActiveByReference).
CREATE INDEX IF NOT EXISTS "inventory_reservations_reference_idx" ON "inventory_reservations" ("reference");

-- ai_report_jobs (status, created_at): supports the retention sweep
-- (deleteExpired) without scanning all historical jobs.
CREATE INDEX IF NOT EXISTS "ai_report_jobs_status_created_idx" ON "ai_report_jobs" ("status", "created_at");
