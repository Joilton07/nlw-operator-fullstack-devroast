import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getSubmissionById, insertSubmission } from '@/db/queries/submissions';
import { processRoast } from '@/lib/ai/roast';
import { baseProcedure, createTRPCRouter } from '../init';

export const roastRouter = createTRPCRouter({
  submit: baseProcedure
    .input(
      z.object({
        codeContent: z.string().min(1).max(2000),
        language: z.string().optional(),
        roastMode: z.enum(['honest', 'sarcasm']),
      }),
    )
    .mutation(async ({ input }) => {
      const submission = await insertSubmission({
        codeContent: input.codeContent,
        language: input.language,
        roastMode: input.roastMode,
      });

      processRoast(submission.id);

      return { id: submission.id };
    }),

  getStatus: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const sub = await getSubmissionById(input.id);
      if (!sub) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission not found',
        });
      }

      if (sub.status !== 'completed') {
        const status = sub.status as 'pending' | 'processing' | 'error';
        return {
          status,
          errorMessage: status === 'error' ? sub.errorMessage : null,
          submission: {
            id: sub.id,
            codeContent: sub.codeContent,
            language: sub.language,
            roastMode: sub.roastMode,
            createdAt: sub.createdAt,
          },
          issues: null,
        };
      }

      return {
        status: 'completed',
        errorMessage: null,
        submission: {
          id: sub.id,
          codeContent: sub.codeContent,
          language: sub.language,
          score: sub.score,
          roastQuote: sub.roastQuote,
          roastMode: sub.roastMode,
          verdict: sub.verdict,
          createdAt: sub.createdAt,
        },
        issues: sub.issues,
      };
    }),
});
