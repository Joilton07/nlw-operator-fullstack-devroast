# Roast Creation Flow

## Overview

Users paste code, select roast mode (honest/sarcasm), and submit for AI-powered analysis. The submission is stored immediately with a `pending` status, OpenAI processes it in background, and the roast page polls for completion.

## Status Flow

```
submit → pending → [OpenAI starts] → processing → [OpenAI done] → completed
                                                  → error (if failed)
```

## 1. Database

### Schema change

Add to `submissions` table:

```diff
+ status: varchar({ length: 16 }).notNull().default('pending'),
+ errorMessage: text(),
```

Existing tables `analysis_issues` and `suggested_fixes` remain unchanged.

## 2. tRPC API

### `roast.submit` — mutation

```
input:  { codeContent: string, language?: string, roastMode: 'honest' | 'sarcasm' }
output: { id: number }
```

- Inserts submission with `status: 'pending'`
- Fires `processRoast(submissionId)` in background (no await)
- Returns `{ id }` immediately

### `roast.getStatus` — query

```
input:  { id: number }
output: { status, errorMessage?, submission?, issues? }
```

- If `status: 'completed'`: returns full submission + issues with fixes
- If `pending`/`processing`: returns basic submission data + status
- If `error`: returns status + errorMessage

### Procedure structure

```ts
// src/lib/trpc/routers/roast.ts
export const roastRouter = createTRPCRouter({
  submit: baseProcedure
    .input(z.object({ codeContent: z.string().min(1).max(2000), language: z.string().optional(), roastMode: z.enum(['honest', 'sarcasm']) }))
    .mutation(async ({ input }) => {
      const sub = await insertSubmission({ ...input, status: 'pending' });
      processRoast(sub.id); // fire-and-forget
      return { id: sub.id };
    }),

  getStatus: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const sub = await getSubmissionById(input.id);
      if (!sub) throw new TRPCError({ code: 'NOT_FOUND' });
      if (sub.status !== 'completed') return { status: sub.status };
      return { status: 'completed', submission: sub, issues: sub.issues };
    }),
});
```

### Register in `_app.ts`

```ts
export const appRouter = createTRPCRouter({
  health: healthRouter,
  leaderboard: leaderboardRouter,
  metrics: metricsRouter,
  roast: roastRouter,
});
```

## 3. AI Service

### `src/lib/ai/roast.ts`

```
processRoast(submissionId: number): Promise<void>
```

1. Reads submission from DB
2. Updates `status → 'processing'` in DB
3. Calls OpenAI `/v1/chat/completions` with:
   - Model: `gpt-4o-mini`
   - `response_format: { type: "json_object" }`
   - System prompt defining the roast personality (honest vs sarcasm)
   - User prompt with the code content
4. Parses JSON response
5. Writes results in a single DB transaction:
   - Submissions: score, roastQuote, verdict, status → 'completed'
   - analysisIssues: one row per issue
   - suggestedFixes: rows per issue fix
6. On error: sets `status → 'error'` + errorMessage

### Prompt design

**System prompt (honest mode):**
> You are a code reviewer. Analyze the provided code and return a JSON object with score (0-10), verdict (critical|warning|good|needs_serious_help), roastQuote (one witty sentence about the code), and issues array. Each issue has severity (critical|warning|good), title, description, lineStart, lineEnd, and fixes array (each fix has diffType: removed|added|context, codeContent, lineNumber, sortOrder). Be constructive but honest.

**System prompt (sarcasm mode):**
> Same but add a sarcastic/roasting tone to the roastQuote. Be funny but still provide useful feedback.

### OpenAI client

```
src/lib/ai/client.ts — reusable OpenAI client wrapper
```

Uses `process.env.OPENAI_API_KEY`. Simple fetch wrapper with retry logic.

## 4. UI Changes

### `EditorSection.tsx`

- Add `useMutation` from `@tanstack/react-query` via tRPC (`trpc.roast.submit`)
- Button `$ roast_my_code` calls `mutate({ codeContent: code, language, roastMode })`
- On mutation success: `router.push(/roast/${id})`
- On mutation error: show inline error message
- Button gets loading state while mutation is pending

### `/roast/[id]/page.tsx`

Convert to `'use client'`:

```tsx
'use client';

export default function RoastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();

  const { data, isPending } = useQuery({
    ...trpc.roast.getStatus.queryOptions({ id: Number(id) }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'error') return false;
      return 2000;
    },
  });

  // Render based on data.status:
  // - pending/processing: show code + skeleton sections
  // - completed: full roast page
  // - error: error message
}
```

### Status-based rendering

| Status | Hero | Code | Issues | Fixes |
|--------|------|------|--------|-------|
| `pending` / `processing` | "roasting..." + language | CodeBlock (immediate) | 3 skeleton cards | skeleton diff |
| `completed` | ScoreRing + quote + verdict | CodeBlock | real issue cards | real diff blocks |
| `error` | error message | CodeBlock | hidden | hidden |

### Component changes

- Keep `ScoreRing`, `Badge`, `Card`, `DiffLine`, `CodeBlock` — already exist
- `EditorSection`: add tRPC mutation + redirect + loading state on button; keep `Toggle` value in state to pass as `roastMode` to mutation
- Remove `Button share_roast` from roast page (deferred)

### Polling behavior

- `refetchInterval: 2000` while `status !== 'completed'`
- Stops polling when completed or error (return `false`)
- Loading skeleton for issues/fixes sections

## 5. Error Handling

- **OpenAI failure**: `status → 'error'`, `errorMessage` stores the error text. UI shows "something went wrong" with the message
- **Invalid JSON from OpenAI**: caught in parsing, same error path
- **DB failure during transaction**: entire transaction rolls back, status set to error
- **Network error on mutation**: standard TanStack Query error handling, show toast/inline error

## 6. Security

- `codeContent` max 2000 chars (already enforced in editor)
- No HTML escaping needed — Shiki + CodeBlock handle rendering safely
- Rate limiting: consider basic rate limiting per-IP (not in scope for this phase)

## 7. Files Created/Modified

| File | Action |
|------|--------|
| `src/lib/trpc/routers/roast.ts` | Create |
| `src/lib/trpc/routers/_app.ts` | Modify (register router) |
| `src/lib/ai/client.ts` | Create |
| `src/lib/ai/roast.ts` | Create |
| `src/db/schema/submissions.ts` | Modify (add status, errorMessage) |
| `src/db/queries/submissions.ts` | Modify (update insertSubmission) |
| `src/components/EditorSection.tsx` | Modify (add mutation + redirect) |
| `src/app/roast/[id]/page.tsx` | Rewrite (client component with polling) |
| `.env` | Create (OPENAI_API_KEY) |

## 8. Non-goals

- Share roast button (deferred)
- Rate limiting (deferred)
- Streaming response from OpenAI (polling is sufficient)
- Persistent queue (serverless fire-and-forget is fine for gpt-4o-mini speed)
- User authentication (no auth for now)
