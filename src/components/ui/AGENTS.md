# UI Component Patterns

## File Location

All UI components go in `src/components/ui/`.

## Naming

- Named exports only — **never** `export default`
- Export both the component and its `*Variants` object (for reuse in other components)

## Conventions

### tailwind-variants for variants

Use `tv()` from `tailwind-variants` for all variant-based styling.

```tsx
import { tv, type VariantProps } from 'tailwind-variants';

export const alertVariants = tv({
  base: 'rounded-lg p-4',
  variants: {
    variant: {
      info: 'bg-blue-50 text-blue-800',
      error: 'bg-red-50 text-red-800',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={alertVariants({ variant, className })}
        {...props}
      />
    );
  },
);

Alert.displayName = 'Alert';
```

### Do NOT use `cn()` when using `tv()`

`tailwind-variants` already merges `className` internally — pass it directly:

```tsx
// ✅ Correct
className={tvVariants({ variant, size, className })}
```

```tsx
// ❌ Wrong — unnecessary, tv() already handles merging
className={cn(tvVariants({ variant, size }), className)}
```

Keep `cn()` for ad-hoc class merging outside of `tv()`.

### Always extend native HTML attributes

Type the props to extend the native element's attributes:

- `<button>` → `ButtonHTMLAttributes<HTMLButtonElement>`
- `<div>` → `HTMLAttributes<HTMLDivElement>`
- `<input>` → `InputHTMLAttributes<HTMLInputElement>`

### Always use `forwardRef` and `displayName`

Every interactive component should forward refs for accessibility and form libraries.

### Use Tailwind's built-in utilities over CSS variable references

Biome's `suggestCanonicalClasses` rule flags cases where a utility already exists for a value. Prefer the built-in utility:

```tsx
// ✅ Correct — uses native Tailwind utility
className="text-white"

// ❌ Biome will warn — text-(--color-white) is equivalent to text-white
className="text-(--color-white)"

// ✅ Correct for custom theme variables (no built-in utility)
className="text-(--color-text-primary)"
```

If Tailwind already has a utility like `text-white`, `bg-neutral-100`, `p-4`, use it directly. CSS variable references are only needed for truly custom theme tokens.

## Fonts

- **Sans-serif**: system font stack (`font-sans`) — no external fonts loaded
- **Monospace**: JetBrains Mono with system fallback (`font-mono`)

Configured in `globals.css` via `@theme`:

```css
@theme {
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, "Liberation Mono", "Courier New", monospace;
}
```

Use `font-sans` and `font-mono` classes — do **not** create custom font utilities like `font-primary` or `font-secondary`.

## Imports order

1. React / framework
2. Libraries (tailwind-variants, etc.)
3. Internal utils (`@/lib/cn`)
4. Internal components (`@/components/ui/*`)
5. Relative imports
