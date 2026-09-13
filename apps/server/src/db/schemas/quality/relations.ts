import { relations } from 'drizzle-orm';
import { batchLots, items } from '../inventory/master-data';
import { organizations } from '../admin';
import { users } from '../auth';
import { inspections, inspectionTests, testResults } from './inspections';
import { qaReviews, releaseDecisions } from './reviews';

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inspections.organizationId],
    references: [organizations.id],
  }),
  lot: one(batchLots, {
    fields: [inspections.lotId],
    references: [batchLots.id],
  }),
  item: one(items, {
    fields: [inspections.itemId],
    references: [items.id],
  }),
  performedByUser: one(users, {
    fields: [inspections.performedBy],
    references: [users.id],
  }),
  tests: many(inspectionTests),
  results: many(testResults),
  review: one(qaReviews, {
    fields: [inspections.id],
    references: [qaReviews.inspectionId],
  }),
  releaseDecisions: many(releaseDecisions),
}));

export const inspectionTestsRelations = relations(
  inspectionTests,
  ({ one }) => ({
    inspection: one(inspections, {
      fields: [inspectionTests.inspectionId],
      references: [inspections.id],
    }),
    result: one(testResults, {
      fields: [inspectionTests.id],
      references: [testResults.testId],
    }),
  }),
);

export const testResultsRelations = relations(testResults, ({ one }) => ({
  test: one(inspectionTests, {
    fields: [testResults.testId],
    references: [inspectionTests.id],
  }),
  inspection: one(inspections, {
    fields: [testResults.inspectionId],
    references: [inspections.id],
  }),
  performedByUser: one(users, {
    fields: [testResults.performedBy],
    references: [users.id],
  }),
}));

export const qaReviewsRelations = relations(qaReviews, ({ one }) => ({
  inspection: one(inspections, {
    fields: [qaReviews.inspectionId],
    references: [inspections.id],
  }),
  reviewedByUser: one(users, {
    fields: [qaReviews.reviewedBy],
    references: [users.id],
  }),
}));

export const releaseDecisionsRelations = relations(
  releaseDecisions,
  ({ one }) => ({
    lot: one(batchLots, {
      fields: [releaseDecisions.lotId],
      references: [batchLots.id],
    }),
    inspection: one(inspections, {
      fields: [releaseDecisions.inspectionId],
      references: [inspections.id],
    }),
    decidedByUser: one(users, {
      fields: [releaseDecisions.decidedBy],
      references: [users.id],
    }),
  }),
);
