import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { issueSeverity } from './enums';
import { submissions } from './submissions';

export const analysisIssues = pgTable('analysis_issues', {
  id: serial().primaryKey(),
  submissionId: integer()
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  severity: issueSeverity().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  lineStart: integer(),
  lineEnd: integer(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
