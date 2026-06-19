import { createTRPCRouter } from '../init';
import { healthRouter } from './health';
import { leaderboardRouter } from './leaderboard';
import { metricsRouter } from './metrics';
import { roastRouter } from './roast';

export const appRouter = createTRPCRouter({
  health: healthRouter,
  leaderboard: leaderboardRouter,
  metrics: metricsRouter,
  roast: roastRouter,
});

export type AppRouter = typeof appRouter;
