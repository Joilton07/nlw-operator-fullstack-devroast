# DevRoast

Built with Next.js 16 + Tailwind v4 + TypeScript. Light/dark theme via `@variant dark`.

## Scripts
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — Biome check
- `npm run format` — Biome auto-fix

## Conventions
- Named exports only, no `default`
- Components in `src/components/ui/`, client-only in `src/components/`
- Composition over props — split into sub-components (`TableRowRank`, `TableRowScore`, etc.)
- `tv()` from tailwind-variants for variants; pass `className` directly (no `cn()` wrapper)
- `cn()` for ad-hoc class merging only
- Biome: 2-space indent, single quotes, trailing commas, `tailwindDirectives: true` in CSS parser
- Fonts: system sans-serif stack (`font-sans`), JetBrains Mono + ui-monospace fallback (`font-mono`)
- Use Tailwind utilities directly (`bg-accent-green`) — no CSS `var()` in components
- Disabled buttons: `enabled:hover:`/`enabled:active:` to prevent hover on disabled state
- `dangerouslySetInnerHTML` — allow only in server-only components (shiki)

## Theme tokens
Defined in `src/app/globals.css` via `@theme`:
- `page`, `surface`, `input`, `elevated`, `border`, `border-focus`
- `text-primary`, `text-secondary`, `text-tertiary`, `text-muted`
- `accent-green`, `accent-red`, `accent-amber`, `accent-cyan`
- `syn-*` (syntax highlighting), `diff-*` (diff colors)
