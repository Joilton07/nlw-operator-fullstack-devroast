# Full Leaderboard Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded data on `/leaderboard` with a live tRPC-backed page showing the 20 worst submissions.

**Architecture:** Three changes: (1) add `limit` input param to existing `leaderboard.getWorst` procedure, (2) create `CodeBlockClient` (client-side Shiki code block with 13px/leading-none styling), (3) rewrite `/leaderboard/page.tsx` as a `'use client'` component using `useTRPC()` + `useQuery` with loading/empty/error states and collapsible cards.

**Tech Stack:** Next.js 16, tRPC v11 + TanStack React Query, Zod v4, Shiki v4 (client-side via singleton highlighter), CollapsibleCode.

## Global Constraints

- Named exports only, no `export default` for new components (page uses `export default` for route convention — keep as-is)
- `'use client'` for interactive components
- `useTRPC()` + `useQuery(procedure.queryOptions(input))` for client queries
- `cn()` from `@/lib/cn` for ad-hoc class merging
- `lucide-react` for icons (ChevronDown)
- Zod v4 import: `import { z } from 'zod'`
- 1-based rank (`i + 1`)
- `scoreColor`: red for < 3, amber for 3-6, green for >= 6
- `language` fallback: `'—'` when null
- Card styling: `bg-input` for code area, `bg-surface` for line numbers column and header
- Code font: 13px (`text-[13px]`), no line gap (`leading-none`)
- Homepage unchanged — `.default(3)` handles backward compatibility

---

### Task 1: Add limit input param to leaderboard.getWorst

**Files:**
- Modify: `src/lib/trpc/routers/leaderboard.ts`

**Interfaces:**
- Consumes: `getWorstSubmissions(limit: number)`, `getLeaderboardStats()`
- Produces: `leaderboard.getWorst` procedure with `input: { limit: number }` (default 3, max 50)

- [ ] **Step 1: Add input validation**

Replace the file with:

```ts
import {
  getLeaderboardStats,
  getWorstSubmissions,
} from '@/db/queries/submissions';
import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';

export const leaderboardRouter = createTRPCRouter({
  getWorst: baseProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(3) }))
    .query(async ({ input }) => {
      const [entries, stats] = await Promise.all([
        getWorstSubmissions(input.limit),
        getLeaderboardStats(),
      ]);
      return { entries, totalCount: stats.totalSubmissions };
    }),
});
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/trpc/routers/leaderboard.ts
git commit -m "feat: add limit input to leaderboard.getWorst procedure"
```

---

### Task 2: Create CodeBlockClient (client-side code highlighter)

**Files:**
- Create: `src/components/ui/CodeBlockClient.tsx`

**Interfaces:**
- Consumes: `code: string`, `language: string` — React props
- Produces: Client component that renders syntax-highlighted code with line numbers, using the singleton Shiki highlighter.

**Why:** `CodeBlock` is an async RSC (`codeToHtml`). The leaderboard page is a client component (client-side tRPC). We need a client-side equivalent with the same visual style (13px/leading-none, line numbers, `bg-input` background).

**Steps:**

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { createCssVariablesTheme, createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const cssVarsTheme = createCssVariablesTheme({
  name: 'css-variables',
});

// biome-ignore lint/suspicious/noExplicitAny: Shiki language import types
const languageLoaders: Record<string, () => Promise<any>> = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  python: () => import('@shikijs/langs/python'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  java: () => import('@shikijs/langs/java'),
  ruby: () => import('@shikijs/langs/ruby'),
  php: () => import('@shikijs/langs/php'),
  sql: () => import('@shikijs/langs/sql'),
  shellscript: () => import('@shikijs/langs/shellscript'),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [cssVarsTheme],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

type CodeBlockClientProps = {
  code: string;
  language: string;
};

export function CodeBlockClient({ code, language }: CodeBlockClientProps) {
  const [html, setHtml] = useState<string | null>(null);
  const lines = code.split('\n');

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      const hl = await getHighlighter();
      if (cancelled) return;

      const loadedLangs = hl.getLoadedLanguages() as string[];
      const lang = language === 'auto' ? 'text' : language;

      if (lang !== 'text' && !loadedLangs.includes(lang)) {
        const loader = languageLoaders[lang];
        if (loader) {
          try {
            const mod = await loader();
            if (cancelled) return;
            await hl.loadLanguage(mod.default ?? mod);
          } catch {
            if (!cancelled) setHtml(null);
            return;
          }
        }
      }

      if (cancelled) return;
      try {
        const result = hl.codeToHtml(code, { lang, theme: 'css-variables' });
        setHtml(result);
      } catch {
        if (!cancelled) setHtml(null);
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <div className="flex bg-input">
      <div className="flex w-10 shrink-0 flex-col items-end border-r border-border bg-surface px-[10px] py-3">
        {lines.map((_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: static line numbers
            key={i}
            className="font-mono text-[13px] leading-none text-text-tertiary"
          >
            {i + 1}
          </span>
        ))}
      </div>
      {html ? (
        <div
          className="overflow-x-auto p-3 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!text-[13px] [&_pre]:!leading-none [&_code]:!font-mono [&_code]:!text-[13px] [&_code]:!leading-none"
          style={
            {
              '--shiki-foreground': 'var(--color-text-primary)',
              '--shiki-background': 'transparent',
              '--shiki-token-keyword': 'var(--color-syn-keyword)',
              '--shiki-token-string': 'var(--color-syn-string)',
              '--shiki-token-string-expression': 'var(--color-syn-string)',
              '--shiki-token-comment': 'var(--color-text-tertiary)',
              '--shiki-token-constant': 'var(--color-syn-number)',
              '--shiki-token-function': 'var(--color-syn-function)',
              '--shiki-token-parameter': 'var(--color-syn-variable)',
              '--shiki-token-punctuation': 'var(--color-syn-operator)',
              '--shiki-token-link': 'var(--color-syn-function)',
            } as React.CSSProperties
          }
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates safe HTML
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 !m-0 !bg-transparent font-mono text-[13px] leading-none text-text-primary">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/CodeBlockClient.tsx
git commit -m "feat: add CodeBlockClient for client-side code highlighting"
```

---

### Task 3: Rewrite /leaderboard page with tRPC + collapsible cards

**Files:**
- Rewrite: `src/app/leaderboard/page.tsx`

**Interfaces:**
- Consumes: `trpc.leaderboard.getWorst.queryOptions({ limit: 20 })` — returns `{ entries: LeaderboardEntry[], totalCount: number }`
- Consumes: `CollapsibleCode` (with `maxHeight={89}`), `CodeBlockClient` (with `code` + `language`)

- [ ] **Step 1: Write the full page**

Replace the entire file:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';
import { CollapsibleCode } from '@/components/CollapsibleCode';
import { CodeBlockClient } from '@/components/ui/CodeBlockClient';

export default function Leaderboard() {
  const trpc = useTRPC();
  const { data, isPending, isError } = useQuery(
    trpc.leaderboard.getWorst.queryOptions({ limit: 20 }),
  );

  const scoreColor = (score: number) => {
    if (score < 3) return 'text-accent-red';
    if (score < 6) return 'text-accent-amber';
    return 'text-accent-green';
  };

  return (
    <div className="mx-auto max-w-3xl px-20 py-10">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[32px] font-bold text-accent-green">
              {'>'}
            </span>
            <h1 className="font-mono text-[28px] font-bold text-text-primary">
              shame_leaderboard
            </h1>
          </div>
          <p className="font-mono text-sm text-text-secondary">
            {'// the most roasted code on the internet'}
          </p>
          {data && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-tertiary">
                {data.totalCount.toLocaleString()} submissions
              </span>
            </div>
          )}
        </div>

        {isPending && <LeaderboardSkeleton />}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-20">
            <span className="font-mono text-sm text-accent-red">
              {'// failed to load leaderboard'}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {'try again later'}
            </span>
          </div>
        )}

        {data && data.entries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-20">
            <span className="font-mono text-sm text-text-secondary">
              {'// no code has been roasted yet'}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {'be the first.'}
            </span>
          </div>
        )}

        {data && data.entries.length > 0 && (
          <div className="flex flex-col gap-5">
            {data.entries.map((entry, i) => {
              const score = Number(entry.score);
              return (
                <div
                  key={entry.id}
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[13px] text-text-tertiary">
                          #
                        </span>
                        <span className="font-mono text-[13px] font-bold text-accent-amber">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-text-tertiary">
                          score:
                        </span>
                        <span
                          className={`font-mono text-[13px] font-bold ${scoreColor(score)}`}
                        >
                          {score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-text-secondary">
                        {entry.language ?? '—'}
                      </span>
                    </div>
                  </div>
                  <CollapsibleCode maxHeight={89}>
                    <CodeBlockClient
                      code={entry.codeContent}
                      language={entry.language ?? 'typescript'}
                    />
                  </CollapsibleCode>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  const lineNumbers = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 3 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <div key={i} className="overflow-hidden rounded-lg border border-border">
          <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-5">
            <div className="flex items-center gap-4">
              <div className="h-4 w-12 animate-pulse rounded-sm bg-surface-alt" />
              <div className="h-4 w-20 animate-pulse rounded-sm bg-surface-alt" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded-sm bg-surface-alt" />
          </div>
          <div className="p-3">
            <div className="flex gap-3">
              <div className="flex flex-col gap-[6px]">
                {lineNumbers.map((n) => (
                  <div
                    key={n}
                    className="h-3 w-6 animate-pulse rounded-sm bg-surface-alt"
                  />
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-[6px]">
                {lineNumbers.map((n) => (
                  <div
                    key={n}
                    className="h-3 animate-pulse rounded-sm bg-surface-alt"
                    style={{
                      width:
                        n === 1
                          ? '75%'
                          : n === 2
                            ? '60%'
                            : n === 3
                              ? '85%'
                              : n === 4
                                ? '55%'
                                : '70%',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Visual check**

Run `npm run dev` then navigate to `/leaderboard`.

Expected:
- Shows skeleton while loading
- On data load: 20 cards with 5-line collapsible preview
- "show more" expands code with syntax highlighting
- Empty DB: "no code has been roasted yet" message
- Error state: "failed to load leaderboard" message

- [ ] **Step 4: Commit**

```bash
git add src/app/leaderboard/page.tsx
git commit -m "feat: implement live leaderboard page with tRPC"
```

---

## Self-Review Checklist

- **Spec coverage:** Backend input param (Task 1) ✅, CodeBlockClient for client-side rendering (Task 2) ✅, Client-side tRPC page with loading/empty/error/collapsible states (Task 3) ✅, 20 results no pagination ✅, Homepage unchanged (`.default(3)`) ✅
- **Placeholder scan:** All code is complete — no TODOs, TBDs, or "implement later"
- **Type consistency:** `leaderboard.getWorst` returns `{ entries, totalCount }` — unchanged return type. `getWorstSubmissions(limit)` already exists. `useTRPC().leaderboard.getWorst.queryOptions({ limit: 20 })` matches new input signature.
