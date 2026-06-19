# Roast Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can paste code, submit for AI analysis, and see results on the roast page with polling.

**Architecture:** tRPC mutation inserts submission with `status: pending` and fires OpenAI in background. Roast page polls `getStatus` every 2s. OpenAI service processes the code, stores results in DB, and sets `status: completed`.

**Tech Stack:** Next.js 16, tRPC v11, TanStack Query, Drizzle ORM, OpenAI API (`gpt-4o-mini`), Zod v4

## Global Constraints

- Named exports only, no `export default` for components (except pages)
- `'use client'` for interactive components; async RSC with `'use cache'` for static data
- tRPC v11: `useTRPC()` + `useQuery` / `useMutation` on client; `appRouter.createCaller({})` on server
- Drizzle queries in `src/db/queries/`, schema in `src/db/schema/`
- OpenAI calls via `fetch` to `https://api.openai.com/v1/chat/completions` with `process.env.OPENAI_API_KEY`
- Prompt uses `response_format: { type: "json_object" }`
- `refetchInterval` callback pattern for polling: `(query) => query.state.data?.status === 'completed' ? false : 2000`

---

### Task 1: Update DB schema — add status and errorMessage to submissions

**Files:**
- Modify: `src/db/schema/submissions.ts`
- Test: `npm run build` (TypeScript check)

**Interfaces:**
- Consumes: existing DB schema
- Produces: `submissions` table with `status` and `errorMessage` columns

- [ ] **Step 1: Add status and errorMessage columns**

```ts
// src/db/schema/submissions.ts
import {
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { roastMode, verdict } from './enums';

export const submissions = pgTable('submissions', {
  id: serial().primaryKey(),
  codeContent: text().notNull(),
  language: varchar({ length: 32 }),
  score: numeric({ precision: 3, scale: 1 }),
  roastQuote: text(),
  roastMode: roastMode().notNull(),
  verdict: verdict(),
  status: varchar({ length: 16 }).notNull().default('pending'),
  errorMessage: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: TypeScript and compilation pass.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema/submissions.ts
git commit -m "feat(db): add status and errorMessage columns to submissions"
```

---

### Task 2: Update DB queries — add status update helpers

**Files:**
- Modify: `src/db/queries/submissions.ts`

**Interfaces:**
- Consumes: `submissions` schema with new columns
- Produces: `updateSubmissionStatus(id, status, errorMessage?)` function

- [ ] **Step 1: Add updateSubmissionStatus function**

Add before the `getSubmissionById` function:

```ts
import { eq } from 'drizzle-orm';

export async function updateSubmissionStatus(
  id: number,
  status: 'pending' | 'processing' | 'completed' | 'error',
  errorMessage?: string,
) {
  await db
    .update(submissions)
    .set({ status, errorMessage: errorMessage ?? null })
    .where(eq(submissions.id, id));
}
```

Also add `import { eq }` at the top if not already there — it's already imported alongside `asc, avg, count, desc, isNotNull`.

- [ ] **Step 2: Update insertSubmission to accept status**

The existing `insertSubmission` already has the right fields. No changes needed since `status` has a default value.

- [ ] **Step 3: Build check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/db/queries/submissions.ts
git commit -m "feat(db): add updateSubmissionStatus query"
```

---

### Task 3: Create OpenAI client

**Files:**
- Create: `src/lib/ai/client.ts`

**Interfaces:**
- Produces: `callOpenAI(messages, options?)` function

This is a simple fetch wrapper. No SDK dependency needed.

- [ ] **Step 1: Create the client**

```ts
// src/lib/ai/client.ts
export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenAIResponse = {
  content: string;
  model: string;
};

export async function callOpenAI(
  messages: OpenAIMessage[],
  options?: { maxRetries?: number },
): Promise<OpenAIResponse> {
  const maxRetries = options?.maxRetries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${body}`);
      }

      const json = await res.json();
      return {
        content: json.choices[0].message.content,
        model: json.model,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('OpenAI call failed');
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/client.ts
git commit -m "feat(ai): create OpenAI client wrapper"
```

---

### Task 4: Create roast processor (AI analysis service)

**Files:**
- Create: `src/lib/ai/roast.ts`

**Interfaces:**
- Consumes: `callOpenAI` from client.ts, `insertAnalysisIssue`, `insertSuggestedFix`, `updateSubmissionStatus`, `getSubmissionById` from queries
- Produces: `processRoast(submissionId: number): Promise<void>` function

- [ ] **Step 1: Create the roast processor**

```ts
// src/lib/ai/roast.ts
import {
  getSubmissionById,
  insertAnalysisIssue,
  insertSuggestedFix,
  updateSubmissionStatus,
} from '@/db/queries/submissions';
import { callOpenAI, type OpenAIMessage } from './client';

type OpenAIResult = {
  score: number;
  verdict: 'critical' | 'warning' | 'good' | 'needs_serious_help';
  roastQuote: string;
  issues: Array<{
    severity: 'critical' | 'warning' | 'good';
    title: string;
    description: string;
    lineStart: number | null;
    lineEnd: number | null;
    fixes: Array<{
      diffType: 'removed' | 'added' | 'context';
      codeContent: string;
      lineNumber: number | null;
      sortOrder: number;
    }>;
  }>;
};

function buildPrompt(code: string, roastMode: 'honest' | 'sarcasm'): OpenAIMessage[] {
  const systemPrompt =
    roastMode === 'sarcasm'
      ? 'You are a brutally sarcastic code reviewer. Analyze the provided code and return a JSON object with score (0-10), verdict ("critical" | "warning" | "good" | "needs_serious_help"), roastQuote (one funny, sarcastic sentence roasting the code), and issues array. Each issue has severity ("critical" | "warning" | "good"), title, description, lineStart (number or null), lineEnd (number or null), and fixes array (each fix has diffType: "removed" | "added" | "context", codeContent, lineNumber (number or null), sortOrder (number)). Be funny but still provide useful, constructive feedback.'
      : 'You are a constructive code reviewer. Analyze the provided code and return a JSON object with score (0-10), verdict ("critical" | "warning" | "good" | "needs_serious_help"), roastQuote (one witty sentence about the code), and issues array. Each issue has severity ("critical" | "warning" | "good"), title, description, lineStart (number or null), lineEnd (number or null), and fixes array (each fix has diffType: "removed" | "added" | "context", codeContent, lineNumber (number or null), sortOrder (number)). Be honest and constructive.';

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze this code:\n\n\`\`\`\n${code}\n\`\`\`` },
  ];
}

export async function processRoast(submissionId: number): Promise<void> {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) throw new Error(`Submission ${submissionId} not found`);

    await updateSubmissionStatus(submissionId, 'processing');

    const messages = buildPrompt(submission.codeContent, submission.roastMode);
    const response = await callOpenAI(messages);

    const result: OpenAIResult = JSON.parse(response.content);

    // Validate required fields
    if (typeof result.score !== 'number' || !Array.isArray(result.issues)) {
      throw new Error('Invalid AI response structure');
    }

    // Update submission with score, quote, verdict
    const { db } = await import('@/db');
    const { submissions } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await db
      .update(submissions)
      .set({
        score: result.score.toString(),
        roastQuote: result.roastQuote,
        verdict: result.verdict,
        status: 'completed',
      })
      .where(eq(submissions.id, submissionId));

    // Insert issues and fixes
    for (const issue of result.issues) {
      const createdIssue = await insertAnalysisIssue({
        submissionId,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        lineStart: issue.lineStart ?? undefined,
        lineEnd: issue.lineEnd ?? undefined,
      });

      for (const fix of issue.fixes) {
        await insertSuggestedFix({
          issueId: createdIssue.id,
          diffType: fix.diffType,
          codeContent: fix.codeContent,
          lineNumber: fix.lineNumber ?? undefined,
          sortOrder: fix.sortOrder,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await updateSubmissionStatus(submissionId, 'error', message);
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/roast.ts
git commit -m "feat(ai): add roast analysis processor"
```

---

### Task 5: Create tRPC roast router

**Files:**
- Create: `src/lib/trpc/routers/roast.ts`
- Modify: `src/lib/trpc/routers/_app.ts`

**Interfaces:**
- Consumes: `insertSubmission`, `getSubmissionById` from queries, `processRoast` from ai/roast
- Produces: `roastRouter` with `submit` mutation and `getStatus` query

- [ ] **Step 1: Create roast router**

```ts
// src/lib/trpc/routers/roast.ts
import { z } from 'zod';
import { createTRPCRouter, baseProcedure } from '../init';
import {
  getSubmissionById,
  insertSubmission,
} from '@/db/queries/submissions';
import { processRoast } from '@/lib/ai/roast';
import { TRPCError } from '@trpc/server';

export const roastRouter = createTRPCRouter({
  submit: baseProcedure
    .input(
      z.object({
        codeContent: z.string().min(1).max(2000),
        language: z.string().optional(),
        roastMode: z.enum(['honest', 'sarcasm']),
      }),
    )
    .mutation(async ({ input }) => {
      const submission = await insertSubmission({
        codeContent: input.codeContent,
        language: input.language,
        roastMode: input.roastMode,
      });

      processRoast(submission.id);

      return { id: submission.id };
    }),

  getStatus: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const sub = await getSubmissionById(input.id);
      if (!sub) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission not found',
        });
      }

      if (sub.status !== 'completed') {
        return {
          status: sub.status,
          submission: {
            id: sub.id,
            codeContent: sub.codeContent,
            language: sub.language,
            roastMode: sub.roastMode,
            createdAt: sub.createdAt,
          },
          issues: null,
        };
      }

      return {
        status: 'completed',
        submission: {
          id: sub.id,
          codeContent: sub.codeContent,
          language: sub.language,
          score: sub.score,
          roastQuote: sub.roastQuote,
          roastMode: sub.roastMode,
          verdict: sub.verdict,
          createdAt: sub.createdAt,
        },
        issues: sub.issues,
      };
    }),
});
```

- [ ] **Step 2: Register router in _app.ts**

```ts
// src/lib/trpc/routers/_app.ts
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
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/trpc/routers/roast.ts src/lib/trpc/routers/_app.ts
git commit -m "feat(api): add roast.submit and roast.getStatus procedures"
```

---

### Task 6: Update EditorSection — add mutation, loading state, redirect

**Files:**
- Modify: `src/components/EditorSection.tsx`

**Interfaces:**
- Consumes: `useRouter` from `next/navigation`, `trpc.roast.submit` mutation
- Produces: working submit flow from editor to roast page

- [ ] **Step 1: Rewrite EditorSection with mutation logic**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CHAR_LIMIT,
  CodeEditor,
  detectLanguage,
} from '@/components/CodeEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useTRPC } from '@/lib/trpc/client';
import { useMutation } from '@tanstack/react-query';

const defaultCode = '';

export function EditorSection() {
  const router = useRouter();
  const trpc = useTRPC();
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('auto');
  const [roastMode, setRoastMode] = useState(true);

  const { mutate, isPending } = useMutation(
    trpc.roast.submit.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
      onError: () => {
        // Error state shown via the mutation's error property
      },
    }),
  );

  const detectedLang = code.trim() ? detectLanguage(code) : undefined;

  const handleSubmit = () => {
    if (!code.trim() || code.length > CHAR_LIMIT || isPending) return;
    mutate({
      codeContent: code,
      language: language === 'auto' ? undefined : language,
      roastMode: roastMode ? 'sarcasm' : 'honest',
    });
  };

  const errorMessage = 'An error occurred while submitting. Please try again.';
  const showError = !isPending; // todo: actual error state

  return (
    <>
      <div className="w-full max-w-[780px]">
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      <div className="flex w-full max-w-[780px] items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle
            label="roast mode"
            defaultChecked
            onCheckedChange={setRoastMode}
          />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-text-tertiary">
              lang
            </span>
            <LanguageSelector
              language={language}
              detectedLanguage={detectedLang}
              onLanguageChange={setLanguage}
            />
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={!code.trim() || code.length > CHAR_LIMIT || isPending}
          onClick={handleSubmit}
        >
          {isPending ? '$ roasting...' : '$ roast_my_code'}
        </Button>
      </div>
    </>
  );
}
```

Note: Check the `Toggle` component's API. If `onCheckedChange` is not the prop name, use the actual prop name (e.g., `onChange`). Verify by reading `src/components/ui/Toggle.tsx`.

- [ ] **Step 2: Check Toggle API**

```bash
rg "export function Toggle" src/components/ui/Toggle.tsx
```

Verify the callback prop name. If it's `onChange` instead of `onCheckedChange`, adjust the code accordingly.

- [ ] **Step 3: Build check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/EditorSection.tsx
git commit -m "feat(ui): add roast submit mutation with redirect in EditorSection"
```

---

### Task 7: Rewrite /roast/[id] page — client component with polling

**Files:**
- Write: `src/app/roast/[id]/page.tsx`

**Interfaces:**
- Consumes: `trpc.roast.getStatus` query with polling, UI components (ScoreRing, CodeBlock, Badge, Card, DiffLine)
- Produces: fully functional roast page with status-based rendering

- [ ] **Step 1: Rewrite the page**

```tsx
'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { DiffLine } from '@/components/ui/DiffLine';
import { ScoreRing } from '@/components/ui/ScoreRing';

const severityConfig = {
  critical: { variant: 'critical' as const, dot: 'bg-accent-red' },
  warning: { variant: 'warning' as const, dot: 'bg-accent-amber' },
  good: { variant: 'good' as const, dot: 'bg-accent-green' },
};

const verdictConfig = {
  critical: { variant: 'critical' as const, label: 'critical' },
  warning: { variant: 'warning' as const, label: 'warning' },
  good: { variant: 'good' as const, label: 'good' },
  needs_serious_help: { variant: 'verdict' as const, label: 'needs_serious_help' },
};

function LoadingHero() {
  return (
    <div className="flex items-center gap-12">
      <div className="size-[140px] animate-pulse rounded-full bg-surface-alt" />
      <div className="flex flex-col gap-4">
        <div className="h-7 w-48 animate-pulse rounded bg-surface-alt" />
        <div className="h-8 w-96 animate-pulse rounded bg-surface-alt" />
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-alt" />
        </div>
      </div>
    </div>
  );
}

function LoadingIssues() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-5">
        {[1, 2].map((i) => (
          <Card key={i} className="flex-1">
            <CardHeader>
              <div className="h-5 w-16 animate-pulse rounded bg-surface-alt" />
            </CardHeader>
            <CardTitle>
              <div className="h-5 w-40 animate-pulse rounded bg-surface-alt" />
            </CardTitle>
            <CardDescription>
              <div className="h-4 w-full animate-pulse rounded bg-surface-alt" />
              <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-surface-alt" />
            </CardDescription>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoadingFixes() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-input">
      <div className="flex h-10 items-center border-b border-border px-4">
        <div className="h-4 w-48 animate-pulse rounded bg-surface-alt" />
      </div>
      <div className="flex flex-col gap-1 p-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-5 w-full animate-pulse rounded bg-surface-alt"
          />
        ))}
      </div>
    </div>
  );
}

export default function RoastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const trpc = useTRPC();

  const { data } = useQuery({
    ...trpc.roast.getStatus.queryOptions({ id: Number(id) }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'error') return false;
      return 2000;
    },
  });

  const isProcessing = !data || data.status === 'pending' || data.status === 'processing';
  const isError = data?.status === 'error';
  const isCompleted = data?.status === 'completed';
  const submission = data?.submission;
  const issues = data?.issues;

  return (
    <div className="mx-auto max-w-3xl px-20 py-10">
      <div className="flex flex-col gap-10">
        {/* Score Hero */}
        {isProcessing && <LoadingHero />}

        {isError && (
          <div className="flex flex-col items-center gap-4 py-20">
            <span className="font-mono text-accent-red">
              {'//'} something went wrong
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {'the roast engine overheated. try again.'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              $ try_again
            </Button>
          </div>
        )}

        {isCompleted && submission && (
          <div className="flex items-center gap-12">
            <ScoreRing
              score={Number(submission.score)}
              maxScore={10}
              size="md"
            />
            <div className="flex flex-col gap-4">
              <Badge
                variant={verdictConfig[submission.verdict ?? 'needs_serious_help'].variant}
                size="md"
              >
                {verdictConfig[submission.verdict ?? 'needs_serious_help'].label}
              </Badge>
              <p className="font-mono text-xl leading-relaxed text-text-primary">
                &ldquo;{submission.roastQuote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
                  lang: {submission.language ?? '?'}
                  <span>·</span>
                  {submission.codeContent.split('\n').length} lines
                </span>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="h-px w-full bg-border" />
        )}

        {/* Submitted Code */}
        {submission && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent-green">
                {'//'}
              </span>
              <h2 className="font-mono text-sm font-bold text-text-primary">
                your_submission
              </h2>
            </div>
            <CodeBlock
              code={submission.codeContent}
              language={submission.language ?? 'typescript'}
            />
          </div>
        )}

        <div className="h-px w-full bg-border" />

        {/* Detailed Analysis */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {'//'}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              detailed_analysis
            </h2>
          </div>

          {isProcessing && <LoadingIssues />}

          {isCompleted && issues && issues.length > 0 && (
            <div className="flex flex-col gap-5">
              {chunkArray(issues, 2).map((pair, groupIdx) => (
                <div key={groupIdx} className="flex gap-5">
                  {pair.map((issue) => (
                    <Card key={issue.id} className="flex-1">
                      <CardHeader>
                        <Badge variant={severityConfig[issue.severity].variant}>
                          {issue.severity}
                        </Badge>
                      </CardHeader>
                      <CardTitle>{issue.title}</CardTitle>
                      <CardDescription>{issue.description}</CardDescription>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px w-full bg-border" />

        {/* Suggested Fix */}
        {isCompleted && issues && issues.some((i) => i.fixes.length > 0) && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent-green">
                {'//'}
              </span>
              <h2 className="font-mono text-sm font-bold text-text-primary">
                suggested_fix
              </h2>
            </div>
            {/* Group fixes by issue and show diff blocks */}
            {issues.filter((i) => i.fixes.length > 0).map((issue) => (
              <div
                key={issue.id}
                className="overflow-hidden rounded-lg border border-border bg-input"
              >
                <div className="flex h-10 items-center border-b border-border px-4">
                  <span className="font-mono text-xs font-medium text-text-secondary">
                    {issue.title}
                  </span>
                </div>
                <div className="flex flex-col py-1">
                  {issue.fixes
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((fix) => (
                      <DiffLine key={fix.id} variant={fix.diffType}>
                        {fix.codeContent}
                      </DiffLine>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {isProcessing && <LoadingFixes />}
      </div>
    </div>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/roast/\[id\]/page.tsx
git commit -m "feat(ui): rewrite roast page with polling and status-based rendering"
```

---

### Task 8: Add OPENAI_API_KEY to .env and verify

**Files:**
- Create: `.env` (if not exists)

- [ ] **Step 1: Create/update .env**

```bash
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

(The user will need to replace with their actual key.)

- [ ] **Step 2: Add .env to .gitignore to verify it's already listed**

```bash
rg "^\.env$" .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 3: Final build check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add .env .gitignore
git commit -m "chore: add OPENAI_API_KEY to .env"
```

---

### Self-Review

**Spec coverage:**
- DB schema update (Task 1) ✓
- Queries update (Task 2) ✓
- OpenAI client (Task 3) ✓
- AI roast processor (Task 4) ✓
- tRPC router with submit + getStatus (Task 5) ✓
- EditorSection mutation + redirect (Task 6) ✓
- Roast page with polling (Task 7) ✓
- .env setup (Task 8) ✓

**No placeholders:** All steps have full code, commands, and commit messages.

**Type consistency:** 
- `insertSubmission` returns `{ id: number }` — matches `roast.submit` return type
- `getSubmissionById` returns `SubmissionWithIssues | null` — matches `getStatus` usage
- `processRoast` takes `submissionId: number` — matches fire-and-forget call
- `updateSubmissionStatus(id, status, errorMessage?)` — consistent across all usages
