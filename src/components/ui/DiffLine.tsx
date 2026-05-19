import { forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const diffLineVariants = tv({
  base: 'flex w-full items-center gap-2 px-4 py-2 font-mono text-[13px]',
  variants: {
    variant: {
      added: 'bg-diff-added-bg text-diff-added-text',
      removed: 'bg-diff-removed-bg text-diff-removed-text',
      context: 'bg-diff-context-bg text-text-secondary',
    },
  },
  defaultVariants: {
    variant: 'context',
  },
});

type DiffLineProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof diffLineVariants>;

export const DiffLine = forwardRef<HTMLDivElement, DiffLineProps>(
  ({ className, variant, children, ...props }, ref) => {
    const prefix =
      variant === 'added' ? '+' : variant === 'removed' ? '-' : ' ';

    return (
      <div
        ref={ref}
        className={diffLineVariants({ variant, className })}
        {...props}
      >
        <span className="w-4 shrink-0 text-center">{prefix}</span>
        <span>{children}</span>
      </div>
    );
  },
);

DiffLine.displayName = 'DiffLine';
