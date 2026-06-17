# tRPC Patterns

## Setup Structure
```
src/lib/trpc/
├── init.ts              — createTRPCContext, createTRPCRouter, baseProcedure
├── query-client.ts      — TanStack QueryClient factory
├── server.tsx           — RSC helpers (createTRPCOptionsProxy, prefetch, HydrateClient)
├── client.tsx           — Client provider (TRPCReactProvider, useTRPC)
└── routers/
    ├── _app.ts          — Root router, register all routers here
    ├── health.ts        — health.check procedure
    ├── leaderboard.ts   — leaderboard.getWorst procedure
    └── metrics.ts       — metrics.getStats procedure
```

## API Route
```
src/app/api/trpc/[trpc]/route.ts  — fetchRequestHandler (GET + POST)
```

## Creating a New Procedure

### 1. Create router file
```ts
// src/lib/trpc/routers/myFeature.ts
import { createTRPCRouter, baseProcedure } from '../init';

export const myFeatureRouter = createTRPCRouter({
  list: baseProcedure.query(async () => {
    // return data directly
    return { items: [] };
  }),
});
```

### 2. Register in root router
```ts
// src/lib/trpc/routers/_app.ts
import { myFeatureRouter } from './myFeature';

export const appRouter = createTRPCRouter({
  myFeature: myFeatureRouter,
});
```

## Querying from Client Components

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';

function MyComponent() {
  const trpc = useTRPC();

  // Without input:
  const { data } = useQuery(trpc.myFeature.list.queryOptions(undefined));

  // With input:
  const { data } = useQuery(trpc.myFeature.byId.queryOptions({ id: 1 }));
}
```

- `useTRPC()` must be called inside `<TRPCReactProvider>` (it wraps the layout)
- `queryOptions(input)` returns options for `useQuery`
- Data is initially `undefined` — use `??` for fallback values

## Querying from Server Components (RSC)

For static data sections, use an async RSC with Suspense:

```tsx
import { Suspense } from 'react';
import { appRouter } from '@/lib/trpc/routers/_app';

export function MySection() {
  return (
    <Suspense fallback={<Skeleton />}>
      <MySectionContent />
    </Suspense>
  );
}

async function MySectionContent() {
  const caller = appRouter.createCaller({});
  const data = await caller.myFeature.list();
  return <div>{/* render data */}</div>;
}
```

- The tRPC caller runs server-side, bypassing HTTP
- `createCaller({})` creates a fresh caller per render (lightweight)

## Patterns

### Metrics with NumberFlow
- Start with `totalRoasted: 0, averageScore: null` (via `data?.totalRoasted ?? 0`)
- NumberFlow animates from 0 → real value when data arrives
- No Suspense or skeletons needed for these counters

### Procedure with DB
```ts
import { getLeaderboardStats } from '@/db/queries/submissions';

export const metricsRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    const stats = await getLeaderboardStats();
    return {
      totalRoasted: stats.totalSubmissions,
      averageScore: stats.averageScore,
    };
  }),
});
```

For DB queries, import from `@/db/queries/` — not from `@/db/schema` directly (use the query helpers).

### Parallel DB queries with `Promise.all`

When a procedure needs multiple DB queries, execute them in parallel:

```ts
import { getLeaderboardStats, getWorstSubmissions } from '@/db/queries/submissions';

export const leaderboardRouter = createTRPCRouter({
  getWorst: baseProcedure.query(async () => {
    const [entries, stats] = await Promise.all([
      getWorstSubmissions(3),
      getLeaderboardStats(),
    ]);
    return { entries, totalCount: stats.totalSubmissions };
  }),
});
```

This avoids sequential waterfall — both queries run concurrently against the database.