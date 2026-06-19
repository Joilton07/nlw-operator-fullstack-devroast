import {
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { roastMode, verdict } from './enums';

export const submissions = pgTable('submissions', {
  id: serial().primaryKey(),
  codeContent: text().notNull(),
  language: varchar({ length: 32 }),
  score: numeric({ precision: 3, scale: 1 }),
  roastQuote: text(),
  roastMode: roastMode().notNull(),
  verdict: verdict(),
  status: varchar({ length: 16 }).notNull().default('pending'),
  errorMessage: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
