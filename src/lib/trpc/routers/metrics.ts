import { getLeaderboardStats } from '@/db/queries/submissions';
import { baseProcedure, createTRPCRouter } from '../init';

export const metricsRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    const stats = await getLeaderboardStats();
    return {
      totalRoasted: stats.totalSubmissions,
      averageScore: stats.averageScore,
    };
  }),
});
