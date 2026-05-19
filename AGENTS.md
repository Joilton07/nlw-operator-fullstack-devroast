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
