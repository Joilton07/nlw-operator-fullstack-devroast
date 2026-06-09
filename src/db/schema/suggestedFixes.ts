import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { analysisIssues } from './analysisIssues';
import { diffType } from './enums';

export const suggestedFixes = pgTable('suggested_fixes', {
  id: serial().primaryKey(),
  issueId: integer()
    .notNull()
    .references(() => analysisIssues.id, { onDelete: 'cascade' }),
  diffType: diffType().notNull(),
  codeContent: text().notNull(),
  lineNumber: integer(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
