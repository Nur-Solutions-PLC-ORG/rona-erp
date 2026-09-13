import { relations } from 'drizzle-orm';
import { organizations } from '../admin';
import { kiosks } from './kiosk';

export const kiosksRelations = relations(kiosks, ({ one }) => ({
  organization: one(organizations, {
    fields: [kiosks.organizationId],
    references: [organizations.id],
  }),
}));
