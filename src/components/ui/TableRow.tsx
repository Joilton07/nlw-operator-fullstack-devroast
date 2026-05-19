import { forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/cn';

export const tableRowVariants = tv({
  base: 'flex w-full items-center gap-6 border-b border-border px-5 py-4',
  variants: {},
  defaultVariants: {},
});

type TableRowProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof tableRowVariants>;

export const TableRow = forwardRef<HTMLDivElement, TableRowProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={tableRowVariants({ className })} {...props} />
    );
  },
);

TableRow.displayName = 'TableRow';

export const TableRowRank = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => (
  <div className="w-10">
    <span
      ref={ref}
      className={cn('font-mono text-[13px] text-text-tertiary', className)}
      {...props}
    >
      #{children}
    </span>
  </div>
));

TableRowRank.displayName = 'TableRowRank';

type TableRowScoreProps = HTMLAttributes<HTMLSpanElement> & {
  score: number;
};

export const TableRowScore = forwardRef<HTMLSpanElement, TableRowScoreProps>(
  ({ className, score, ...props }, ref) => {
    const severity = score < 3 ? 'critical' : score < 6 ? 'warning' : 'good';
    const scoreColor =
      severity === 'critical'
        ? 'text-accent-red'
        : severity === 'warning'
          ? 'text-accent-amber'
          : 'text-accent-green';

    return (
      <div className="w-14 shrink-0">
        <span
          ref={ref}
          className={cn(
            'font-mono text-[13px] font-bold',
            scoreColor,
            className,
          )}
          {...props}
        >
          {score.toFixed(1)}
        </span>
      </div>
    );
  },
);

TableRowScore.displayName = 'TableRowScore';

export const TableRowCode = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => (
  <div className="min-w-0 flex-1">
    <span
      ref={ref}
      className={cn(
        'block truncate font-mono text-xs text-text-secondary',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  </div>
));

TableRowCode.displayName = 'TableRowCode';

export const TableRowLanguage = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => (
  <div className="w-[100px]">
    <span
      ref={ref}
      className={cn('font-mono text-xs text-text-tertiary', className)}
      {...props}
    >
      {children}
    </span>
  </div>
));

TableRowLanguage.displayName = 'TableRowLanguage';
