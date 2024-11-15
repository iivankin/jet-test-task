import { pgTable } from 'drizzle-orm/pg-core';
import * as t from 'drizzle-orm/pg-core';

export const faqsTable = pgTable('faqs', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  question: t.text().notNull(),
  answer: t.text().notNull(),
  created_at: t.timestamp().defaultNow(),
  updated_at: t.timestamp().defaultNow(),
});

export const reviewsTable = pgTable(
  'reviews',
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    faq_id: t
      .integer('faq_id')
      .references(() => faqsTable.id)
      .notNull(),
    ip_address: t.inet().notNull(),
    is_like: t.integer().notNull(),
    created_at: t.timestamp().defaultNow(),
  },
  (table) => [
    t.uniqueIndex('review_faq_idx').on(table.ip_address, table.faq_id),
  ],
);

export const commentsTable = pgTable('comments', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  review_id: t
    .integer()
    .references(() => reviewsTable.id)
    .notNull(),
  comment: t.text().notNull(),
  created_at: t.timestamp().defaultNow(),
});
