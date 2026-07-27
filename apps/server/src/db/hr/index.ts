import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "../organizations";

export const workforcePlaceholder = pgTable("workforce_placeholder", {
  id: uuid("id").primaryKey(),
  tenant_id: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
});
