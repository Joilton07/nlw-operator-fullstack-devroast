import { z } from 'zod';
import {
  getLeaderboardStats,
  getWorstSubmissions,
} from '@/db/queries/submissions';
import { baseProcedure, createTRPCRouter } from '../init';

export const leaderboardRouter = createTRPCRouter({
  getWorst: baseProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(3) }))
    .query(async ({ input }) => {
      const [entries, stats] = await Promise.all([
        getWorstSubmissions(input.limit),
        getLeaderboardStats(),
      ]);
      return { entries, totalCount: stats.totalSubmissions };
    }),
});
