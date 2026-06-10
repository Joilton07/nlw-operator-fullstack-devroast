# tRPC — Especificação de Implementação

## Resumo

Adicionar [tRPC](https://trpc.io) v11 como camada de API/typesafe bridge entre o frontend Next.js e o banco PostgreSQL (Drizzle ORM). A integração segue o padrão [Server Components + TanStack React Query](https://trpc.io/docs/client/tanstack-react-query/server-components) — procedures executadas no servidor e hidratadas no cliente sem waterfalls.

O setup usa `@trpc/tanstack-react-query` (API nova do tRPC v11, com `createTRPCOptionsProxy` + `createTRPCContext`).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Server | `@trpc/server` |
| Client | `@trpc/tanstack-react-query` + `@trpc/client` |
| Transport | `httpBatchLink` |
| Validação | `zod` (opcional, via `t.procedure.input(z.object(...))`) |
| Query cache | `@tanstack/react-query` |
| Bundle | Shad by tRPC |

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Versão tRPC | v11 (`@trpc/tanstack-react-query`) | API estável com suporte nativo a RSC |
| Provider Pattern | `createTRPCContext` + `TRPCReactProvider` | Novo padrão tRPC v11, funciona com RSC |
| Transport | `httpBatchLink` com SSR | Batch de requests, suporta cookies/headers |
| Validação input | `zod` | tRPC recomenda, integração nativa com `t.procedure.input()` |
| Data transformer | Nenhum (json nativo) | Evita complexidade desnecessária no MVP |
| File structure | `src/lib/trpc/` | Mesmo diretório que `cn.ts`, colado do db |

## Arquitetura

### Estrutura de Arquivos

```
src/lib/trpc/
  init.ts                — createTRPCContext, createTRPCRouter, baseProcedure
  query-client.ts        — makeQueryClient() factory
  server.tsx             — createTRPCOptionsProxy + HydrateClient + prefetch (RSC)
  client.tsx             — TRPCReactProvider + createTRPCClient (componentes cliente)
  routers/
    _app.ts              — appRouter raiz + type AppRouter
    submissions.ts       — router de submissões (ex: create, getLeaderboard, getById)

src/app/
  layout.tsx             — envolve children com <TRPCReactProvider>
  page.tsx               — server component: prefetch + HydrateClient
  api/
    trpc/
      [trpc]/
        route.ts         — tRPC HTTP handler (Next.js Route Handler)
```

### Fluxo de Dados

```
[Server Component]          [Client Component]
       |                           |
       | prefetch(queryOptions)    |
       |-------------------------->|
       |                    useQuery(queryOptions)
       |                           |
       |   HydrateClient           |
       |<------------------------->|
       |                           |
       |        httpBatchLink      |
       |<------------------------->|
       |     /api/trpc/*           |
       |                           |
  appRouter                       |
  -> submissions.create           |
  -> submissions.getLeaderboard   |
       |                           |
  Drizzle ORM                     |
  -> PostgreSQL                   |
```

## Implementação

### Packages

```bash
npm i @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod
```

### `src/lib/trpc/init.ts`

Procedures base, context factory e router factory:

```ts
import { initTRPC } from '@trpc/server';

export const createTRPCContext = async () => ({});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
```

### `src/lib/trpc/query-client.ts`

Factory do QueryClient (deduplicado por request via `cache()` do React):

```ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
      },
    },
  });
}
```

### `src/lib/trpc/server.tsx`

Proxy para server components — `prefetch()` + `HydrateClient`:

```tsx
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { TRPCQueryOptions } from '@trpc/tanstack-react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(queryOptions);
}
```

### `src/lib/trpc/client.tsx`

Provider para client components — singleton do tRPC client + QueryClient:

```tsx
'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;
function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  })();
  return `${base}/api/trpc`;
}

export function TRPCReactProvider(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### `src/lib/trpc/routers/_app.ts`

Router raiz + export do tipo AppRouter:

```ts
import { createTRPCRouter } from '../init';
// import { submissionsRouter } from './submissions';

export const appRouter = createTRPCRouter({
  // submissions: submissionsRouter,
});

export type AppRouter = typeof appRouter;
```

### `src/app/api/trpc/[trpc]/route.ts`

HTTP handler do tRPC (Next.js Route Handler):

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc/routers/_app';
import { createTRPCContext } from '@/lib/trpc/init';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
  });

export { handler as GET, handler as POST };
```

### `src/app/layout.tsx` — Provider

Envolver toda a aplicação com o `TRPCReactProvider`:

```tsx
import { TRPCReactProvider } from '@/lib/trpc/client';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-page">
        <TRPCReactProvider>
          <Navbar />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
```

### Uso em Server Component — prefetch + hydrate

```tsx
// src/app/page.tsx
import { HydrateClient, prefetch, trpc } from '@/lib/trpc/server';

export default async function Home() {
  prefetch(trpc.hello.queryOptions());

  return (
    <HydrateClient>
      {/* server component content */}
    </HydrateClient>
  );
}
```

### Uso em Client Component — useQuery / useMutation

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';

export function ClientGreeting() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.hello.queryOptions());

  return <div>{data?.greeting}</div>;
}
```

### Exemplo de Router com DB

```ts
// src/lib/trpc/routers/submissions.ts
import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { submissions } from '@/db/schema/submissions';
import { desc } from 'drizzle-orm';

export const submissionsRouter = createTRPCRouter({
  getLeaderboard: baseProcedure
    .input(z.object({ limit: z.number().default(3) }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(submissions)
        .orderBy(desc(submissions.score))
        .limit(input.limit);
    }),

  getById: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(submissions)
        .where(eq(submissions.id, input.id))
        .then((rows) => rows[0] ?? null);
    }),
});
```

## To-Do List

### Setup

- [ ] `npm i @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod`
- [ ] Criar `src/lib/trpc/init.ts` — context + t.init
- [ ] Criar `src/lib/trpc/query-client.ts` — makeQueryClient
- [ ] Criar `src/lib/trpc/server.tsx` — createTRPCOptionsProxy + HydrateClient + prefetch
- [ ] Criar `src/lib/trpc/client.tsx` — TRPCReactProvider + useTRPC
- [ ] Criar `src/lib/trpc/routers/_app.ts` — appRouter vazio (type export)

### HTTP Handler

- [ ] Criar `src/app/api/trpc/[trpc]/route.ts` — fetchRequestHandler

### Provider no Layout

- [ ] Envolver `RootLayout` com `<TRPCReactProvider>`

### Primeira Procedure

- [ ] Criar `src/lib/trpc/routers/health.ts` — procedure `health.check` (retorna `{ status: 'ok' }`)
- [ ] Adicionar ao `_app.ts`
- [ ] Verificar: `curl http://localhost:3000/api/trpc/health.check`

### Integração com Drizzle

- [ ] Criar `src/lib/trpc/routers/submissions.ts` — getLeaderboard, getById, create
- [ ] Adicionar ao `_app.ts`
- [ ] Testar com `useQuery` no client
- [ ] Testar com `prefetch` em server component
