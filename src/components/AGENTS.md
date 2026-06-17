# Component Patterns

## File Location
- **UI primitives** (Button, Badge, TableRow, etc.) → `src/components/ui/`
- **Composite components** (CodeEditor, EditorSection, etc.) → `src/components/` (directly)
- Client-only components need `'use client'` directive

## Code Editor (Overlay Pattern)

The code editor uses a transparent textarea overlaid on a Shiki syntax-highlighted `<div>`:

```
Stack order (back → front):
1. Highlighted code div (Shiki HTML, pointer-events-none)
2. Transparent textarea (editable, caret visible)
3. Char counter (absolute bottom-right, z-10, pointer-events-none)
```

### Key constants
```ts
const MAX_HEIGHT = 480;        // max editor height in px
const CHAR_LIMIT = 2000;       // max characters
const LINE_HEIGHT = 24;        // leading-6
```

### Scroll sync
- Textarea `onScroll` handler syncs `highlightRef.scrollTop/scrollLeft` and line-numbers container via `translateY`
- Hidden highlight scrollbars: `[&::-webkit-scrollbar]:hidden`

### Line numbers
- Container with `overflow-hidden` clips `translateY`-transformed inner span
- Each line is a `<span>` with `leading-6` (24px)
- Number of lines = `code.split('\n').length`

### Placeholder
- Absolute `<div>` when `value === ''`, same position as textarea

## Tab Key
- Intercept `onKeyDown`, `e.preventDefault()`, insert 2 spaces at cursor position
- Use `setRangeText('  ', ...)` + `setSelectionRange`

## Language Detection (Auto-detect)
```ts
function detectLanguage(code: string): string
```
Heuristic order:
1. Shebang lines (`#!/usr/bin/env node` → `javascript`, `#!/usr/bin/python` → `python`)
2. SQL keywords (`SELECT`, `FROM`, `WHERE`)
3. HTML/JSX patterns (`<!DOCTYPE`, `<div`, `</`)
4. CSS patterns (`{` after selector, `@media`)
5. Rust (`fn main`)
6. Python (`def `, `import `)
7. TypeScript-specific (`interface `, `type `, `as `)
8. JSON (`{` at line start with `:`)
9. Fallback: `javascript`

## Client vs Server Component Boundaries
- Pages should be Server Components when possible
- Extract interactive state (`useState`, `useEffect`, `useQuery`) into Client Components
- Two patterns for data fetching:

### Pattern A: Client-side (TanStack Query + tRPC)
- Use `useTRPC()` + `useQuery` for animated/interactive data (e.g. metrics with NumberFlow)
- Data starts as `undefined` → use `??` for initial values (e.g. `?? 0`)

### Pattern B: Server Component + Suspense
- Use for static data sections that don't need animation (e.g. leaderboard table)
- Fetch via `appRouter.createCaller({})` directly inside an async RSC
- Wrap in `<Suspense fallback={<Skeleton />}>` for loading state
- Skeleton shows pulsing placeholders that match content layout