import { db } from '@/db';
import { submissions } from '@/db/schema';
import {
  getSubmissionById,
  insertAnalysisIssue,
  insertSuggestedFix,
  updateSubmissionStatus,
} from '@/db/queries/submissions';
import { eq } from 'drizzle-orm';
import { callOpenAI, type OpenAIMessage } from './client';

type OpenAIResult = {
  score: number;
  verdict: 'critical' | 'warning' | 'good' | 'needs_serious_help';
  roastQuote: string;
  issues: Array<{
    severity: 'critical' | 'warning' | 'good';
    title: string;
    description: string;
    lineStart: number | null;
    lineEnd: number | null;
    fixes: Array<{
      diffType: 'removed' | 'added' | 'context';
      codeContent: string;
      lineNumber: number | null;
      sortOrder: number;
    }>;
  }>;
};

function buildPrompt(code: string, roastMode: 'honest' | 'sarcasm'): OpenAIMessage[] {
  const systemPrompt =
    roastMode === 'sarcasm'
      ? 'You are a brutally sarcastic code reviewer. Analyze the provided code and return a JSON object with score (0-10), verdict ("critical" | "warning" | "good" | "needs_serious_help"), roastQuote (one funny, sarcastic sentence roasting the code), and issues array. Each issue has severity ("critical" | "warning" | "good"), title, description, lineStart (number or null), lineEnd (number or null), and fixes array (each fix has diffType: "removed" | "added" | "context", codeContent, lineNumber (number or null), sortOrder (number)). Be funny but still provide useful, constructive feedback.'
      : 'You are a constructive code reviewer. Analyze the provided code and return a JSON object with score (0-10), verdict ("critical" | "warning" | "good" | "needs_serious_help"), roastQuote (one witty sentence about the code), and issues array. Each issue has severity ("critical" | "warning" | "good"), title, description, lineStart (number or null), lineEnd (number or null), and fixes array (each fix has diffType: "removed" | "added" | "context", codeContent, lineNumber (number or null), sortOrder (number)). Be honest and constructive.';

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze this code:\n\n\`\`\`\n${code}\n\`\`\`` },
  ];
}

export async function processRoast(submissionId: number): Promise<void> {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) throw new Error(`Submission ${submissionId} not found`);

    await updateSubmissionStatus(submissionId, 'processing');

    const messages = buildPrompt(submission.codeContent, submission.roastMode);
    const response = await callOpenAI(messages);

    const result: OpenAIResult = JSON.parse(response.content);

    if (typeof result.score !== 'number' || !Array.isArray(result.issues)) {
      throw new Error('Invalid AI response structure');
    }

    await db
      .update(submissions)
      .set({
        score: result.score.toString(),
        roastQuote: result.roastQuote,
        verdict: result.verdict,
        status: 'completed',
      })
      .where(eq(submissions.id, submissionId));

    for (const issue of result.issues) {
      const createdIssue = await insertAnalysisIssue({
        submissionId,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        lineStart: issue.lineStart ?? undefined,
        lineEnd: issue.lineEnd ?? undefined,
      });

      for (const fix of issue.fixes) {
        await insertSuggestedFix({
          issueId: createdIssue.id,
          diffType: fix.diffType,
          codeContent: fix.codeContent,
          lineNumber: fix.lineNumber ?? undefined,
          sortOrder: fix.sortOrder,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await updateSubmissionStatus(submissionId, 'error', message);
  }
}
