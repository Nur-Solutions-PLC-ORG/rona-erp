ALTER TABLE "employee_faces" DROP CONSTRAINT IF EXISTS "employee_faces_facial_id_unique";
ALTER TABLE "employee_faces" DROP COLUMN IF EXISTS "facial_id";
--> statement-breakpoint
ALTER TABLE "employee_faces" ADD COLUMN "descriptor" text NOT NULL;