import {
  getLeaderboardStats,
  getWorstSubmissions,
} from '@/db/queries/submissions';
import { baseProcedure, createTRPCRouter } from '../init';

export const leaderboardRouter = createTRPCRouter({
  getWorst: baseProcedure.query(async () => {
    const [entries, stats] = await Promise.all([
      getWorstSubmissions(3),
      getLeaderboardStats(),
    ]);
    return { entries, totalCount: stats.totalSubmissions };
  }),
});
