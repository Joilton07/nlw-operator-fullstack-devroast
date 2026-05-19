import { forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const badgeVariants = tv({
  base: 'inline-flex items-center gap-2',
  variants: {
    variant: {
      critical: 'text-accent-red',
      warning: 'text-accent-amber',
      good: 'text-accent-green',
      verdict: 'text-accent-red',
    },
    size: {
      sm: 'text-xs',
      md: 'text-[13px]',
    },
  },
  defaultVariants: {
    variant: 'good',
    size: 'sm',
  },
});

type BadgeProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={badgeVariants({ variant, size, className })}
        {...props}
      >
        <span className="size-2 rounded-full bg-current" />
        <span className="font-mono font-normal">{children}</span>
      </div>
    );
  },
);

Badge.displayName = 'Badge';
