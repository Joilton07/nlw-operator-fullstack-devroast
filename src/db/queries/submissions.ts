import type { InferSelectModel } from 'drizzle-orm';
import { asc, avg, count, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { analysisIssues, submissions, suggestedFixes } from '@/db/schema';

export type Submission = InferSelectModel<typeof submissions>;
export type AnalysisIssue = InferSelectModel<typeof analysisIssues>;
export type SuggestedFix = InferSelectModel<typeof suggestedFixes>;

export type SubmissionWithIssues = Submission & {
  issues: (AnalysisIssue & {
    fixes: SuggestedFix[];
  })[];
};

export type LeaderboardEntry = Submission;

export type LeaderboardStats = {
  totalSubmissions: number;
  averageScore: string | null;
};

export async function insertSubmission(data: {
  codeContent: string;
  language?: string;
  score?: string;
  roastQuote?: string;
  roastMode: 'honest' | 'sarcasm';
  verdict?: 'critical' | 'warning' | 'good' | 'needs_serious_help';
}) {
  const [submission] = await db.insert(submissions).values(data).returning();

  return submission;
}

export async function insertAnalysisIssue(data: {
  submissionId: number;
  severity: 'critical' | 'warning' | 'good';
  title: string;
  description?: string;
  lineStart?: number;
  lineEnd?: number;
}) {
  const [issue] = await db.insert(analysisIssues).values(data).returning();

  return issue;
}

export async function insertSuggestedFix(data: {
  issueId: number;
  diffType: 'removed' | 'added' | 'context';
  codeContent: string;
  lineNumber?: number;
  sortOrder?: number;
}) {
  const [fix] = await db
    .insert(suggestedFixes)
    .values({
      ...data,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  return fix;
}

export async function updateSubmissionStatus(
  id: number,
  status: 'pending' | 'processing' | 'completed' | 'error',
  errorMessage?: string,
) {
  await db
    .update(submissions)
    .set({ status, errorMessage: errorMessage ?? null })
    .where(eq(submissions.id, id));
}

export async function getSubmissionById(
  id: number,
): Promise<SubmissionWithIssues | null> {
  const submission = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!submission) return null;

  const issues = await db
    .select()
    .from(analysisIssues)
    .where(eq(analysisIssues.submissionId, id))
    .orderBy(asc(analysisIssues.id));

  const issuesWithFixes = await Promise.all(
    issues.map(async (issue) => {
      const fixes = await db
        .select()
        .from(suggestedFixes)
        .where(eq(suggestedFixes.issueId, issue.id))
        .orderBy(asc(suggestedFixes.sortOrder));

      return { ...issue, fixes };
    }),
  );

  return { ...submission, issues: issuesWithFixes };
}

export async function getLeaderboard(
  limit = 50,
  offset = 0,
): Promise<LeaderboardEntry[]> {
  return db
    .select()
    .from(submissions)
    .where(isNotNull(submissions.score))
    .orderBy(desc(submissions.score))
    .limit(limit)
    .offset(offset);
}

export async function getLeaderboardStats(): Promise<LeaderboardStats> {
  const [result] = await db
    .select({
      totalSubmissions: count(),
      averageScore: avg(submissions.score),
    })
    .from(submissions)
    .where(isNotNull(submissions.score));

  return {
    totalSubmissions: Number(result.totalSubmissions),
    averageScore: result.averageScore,
  };
}

export async function getTopSubmissions(
  limit = 3,
): Promise<LeaderboardEntry[]> {
  return getLeaderboard(limit, 0);
}

export async function getWorstSubmissions(
  limit = 3,
): Promise<LeaderboardEntry[]> {
  return db
    .select()
    .from(submissions)
    .where(isNotNull(submissions.score))
    .orderBy(asc(submissions.score))
    .limit(limit);
}
