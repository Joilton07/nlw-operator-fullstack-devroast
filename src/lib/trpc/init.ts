import { initTRPC } from '@trpc/server';

export const createTRPCContext = async () => ({});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
