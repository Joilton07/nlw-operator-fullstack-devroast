# Full Leaderboard Page Design

## Goal
Replace hardcoded data on `/leaderboard` with a live tRPC-backed page showing the 20 worst code submissions, reusing the CollapsibleCode + CodeBlock pattern from the homepage shame leaderboard.

## Back-end (tRPC)

### `leaderboard.getWorst` — add input param

```ts
// src/lib/trpc/routers/leaderboard.ts
import { z } from 'zod';

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

- Homepage (RSC) calls `caller.leaderboard.getWorst({ limit: 3 })` — same as today
- Leaderboard page (client) calls `trpc.leaderboard.getWorst.queryOptions({ limit: 20 })`
- `getWorstSubmissions(limit)` already supports dynamic limit
- `getLeaderboardStats()` already returns `totalSubmissions` + `averageScore`

## Front-end (`/leaderboard/page.tsx`)

### Component architecture
- `'use client'` — uses `useTRPC()` + `useQuery`
- Renders inline (no separate wrapper component needed for now)

### States
| State | Behavior |
|-------|----------|
| **Loading** | 20 skeleton cards (same pattern as `LeaderboardSkeleton` from homepage) |
| **Empty** | `data.entries.length === 0` → "no code has been roasted yet. be the first." |
| **Error** | `isError` → "failed to load leaderboard. try again." |
| **Success** | Render 20 collapsible cards |

### Card layout (matches homepage `LeaderboardSection`)
```
┌─────────────────────────────────────────┐
│ #1  score: 1.2         javascript       │  ← 48px header, bg-surface
├─────────────────────────────────────────┤
│ [CollapsibleCode with maxHeight={89}]    │  ← 5-line preview
│ ...                                      │
│ [show more ▼]                           │  ← border-t, bg-surface
└─────────────────────────────────────────┘
```

- `scoreColor` — red (< 3), amber (3-6), green (>= 6) — same logic as homepage
- `language` — falls back to `'—'` when null
- `CollapsibleCode` wraps `CodeBlock` — same 89px preview height
- Rank is `i + 1` (1-based)

### Page header
```
> shame_leaderboard
// the most roasted code on the internet
2,847 submissions · avg score: 4.2/10
```
- `>` icon in `text-accent-green`, title in `text-text-primary`
- Stats: `totalCount.toLocaleString()` + `averageScore` from `data.totalCount` and computed average

### Reused components
- `CollapsibleCode` — unchanged, `maxHeight={89}`
- `CodeBlock` — unchanged
- Skeleton pattern from `LeaderboardSection` — adapted for 20 cards

## Dependencies Affected
| File | Change |
|------|--------|
| `src/lib/trpc/routers/leaderboard.ts` | Add `input(z.object({ limit }))` to `getWorst` |
| `src/components/ui/LeaderboardSection.tsx` | Update RSC call to pass `{ limit: 3 }` |
| `src/app/leaderboard/page.tsx` | Replace hardcoded data with client-side tRPC, collapsible cards, loading/empty/error states |
| `src/app/page.tsx` | No change |

## Out of Scope
- Pagination / infinite scroll (user explicitly said no pagination)
- Search or filtering
- Sorting options (only worst-first, ascending score)
