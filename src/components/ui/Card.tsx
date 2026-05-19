import { forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const cardVariants = tv({
  base: 'flex flex-col gap-3 rounded-lg border border-border p-5',
  variants: {},
  defaultVariants: {},
});

type CardProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cardVariants({ className })} {...props} />;
  },
);

Card.displayName = 'Card';

export const cardHeaderVariants = tv({
  base: 'inline-flex items-center gap-2',
  variants: {},
  defaultVariants: {},
});

type CardHeaderProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardHeaderVariants>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cardHeaderVariants({ className })} {...props} />
    );
  },
);

CardHeader.displayName = 'CardHeader';

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={tv({ base: 'font-mono text-[13px] text-text-primary' })({
          className,
        })}
        {...props}
      />
    );
  },
);

CardTitle.displayName = 'CardTitle';

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={tv({
        base: 'font-mono text-xs leading-relaxed text-text-secondary',
      })({ className })}
      {...props}
    />
  );
});

CardDescription.displayName = 'CardDescription';
