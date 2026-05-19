import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'inline-flex items-center justify-center gap-2 font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary:
        'bg-accent-green text-black font-medium enabled:hover:bg-accent-green/90 enabled:active:bg-accent-green/80',
      secondary:
        'border border-border bg-transparent text-text-primary enabled:hover:bg-surface enabled:active:bg-elevated',
      ghost:
        'border border-border bg-transparent text-text-secondary enabled:hover:text-text-primary',
    },
    size: {
      sm: 'h-8 rounded-md px-3 text-xs',
      md: 'h-10 rounded-lg px-6 text-xs',
      lg: 'h-12 rounded-lg px-6 text-sm',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
