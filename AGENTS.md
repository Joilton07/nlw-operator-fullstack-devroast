# DevRoast

Built with Next.js 16 + Tailwind v4 + TypeScript.

## Scripts
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — Biome check
- `npm run format` — Biome auto-fix

## Conventions
- Named exports only, no `default`
- Components in `src/components/ui/`, client-only in `src/components/`
- Composition over props — split into sub-components
- `tv()` from tailwind-variants for variants; pass `className` directly
- `cn()` for ad-hoc class merging only
- Biome: 2-space indent, single quotes, trailing commas
- Fonts: system sans-serif (`font-sans`), JetBrains Mono (`font-mono`)
- Use Tailwind utilities directly, no CSS `var()` in components
- Disabled buttons: `enabled:hover:`/`enabled:active:` to prevent hover
- `dangerouslySetInnerHTML` — server-only components only (shiki)
- Dark/light theme via `@variant dark` overrides in `globals.css`

## Key Libraries

### tRPC v11 + TanStack React Query
- Server setup in `src/lib/trpc/` — `init.ts`, `server.tsx`, `client.tsx`, `routers/`
- Client component query: `useTRPC()` + `useQuery(procedure.queryOptions(input))`
- No RSC data fetching — all data fetching is client-side via TanStack Query
- New procedure: create file in `routers/`, register in `_app.ts`

### NumberFlow (`@number-flow/react`)
- Animated number counters from 0 → target value on mount
- No Suspense/skeleton needed — start with `0` and animate to API data
- Use `format={{ minimumFractionDigits: N, maximumFractionDigits: N }}` for decimals
- Requires `'use client'`

### Shiki v4 (code highlighting)
- `createHighlighterCore` + `createJavaScriptRegexEngine` — no WASM
- `css-variables` theme maps to `--color-syn-*` tokens (light/dark)
- Singleton highlighter (module-level `let` + promise)
- Fallback: render raw code while Shiki processes (no blank screen)

### Styling
- `tailwind-variants` (`tv()`) for component variants
- `tailwind-merge` (`twMerge`) + `clsx` via `cn()` for ad-hoc merging
- Custom theme colors: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-surface`, `--color-surface-alt`, `--color-bg-page`, `--color-border`, `--color-border-focus`, `--color-accent-green`, `--color-accent-cyan`
- Syntax highlight tokens: `--color-syn-keyword`, `--color-syn-string`, `--color-syn-number`, `--color-syn-function`, `--color-syn-comment`, `--color-syn-operator`, `--color-syn-type`, `--color-syn-constant`
- Scrollbar: `scrollbar-width:thin`, `scrollbar-color`, `[&::-webkit-scrollbar]:w-1.5`, rounded thumb with `--color-text-muted`/`--color-text-tertiary`

### UI primitives
- `lucide-react` for icons (ChevronDown, etc.)
- `@base-ui/react` for headless primitives (popover, select, etc.)
- `zod` v4 available for input validation