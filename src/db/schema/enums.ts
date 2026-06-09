import { pgEnum } from 'drizzle-orm/pg-core';

export const roastMode = pgEnum('roast_mode', ['honest', 'sarcasm']);

export const verdict = pgEnum('verdict', [
  'critical',
  'warning',
  'good',
  'needs_serious_help',
]);

export const issueSeverity = pgEnum('issue_severity', [
  'critical',
  'warning',
  'good',
]);

export const diffType = pgEnum('diff_type', ['removed', 'added', 'context']);
