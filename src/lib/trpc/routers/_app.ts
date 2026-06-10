import { createTRPCRouter } from '../init';
import { healthRouter } from './health';
import { metricsRouter } from './metrics';

export const appRouter = createTRPCRouter({
  health: healthRouter,
  metrics: metricsRouter,
});

export type AppRouter = typeof appRouter;
