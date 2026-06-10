import { baseProcedure, createTRPCRouter } from '../init';

export const healthRouter = createTRPCRouter({
  check: baseProcedure.query(() => ({ status: 'ok' })),
});
