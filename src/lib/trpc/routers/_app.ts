import { createTRPCRouter } from '../init';
import { healthRouter } from './health';
import { leaderboardRouter } from './leaderboard';
import { metricsRouter } from './metrics';

export const appRouter = createTRPCRouter({
  health: healthRouter,
  leaderboard: leaderboardRouter,
  metrics: metricsRouter,
});

export type AppRouter = typeof appRouter;
