import { forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const scoreRingVariants = tv({
  base: 'relative inline-flex items-center justify-center',
  variants: {
    size: {
      sm: 'size-28',
      md: 'size-[180px]',
      lg: 'size-48',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type ScoreRingProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof scoreRingVariants> & {
    score: number;
    maxScore?: number;
  };

function getGradientColor(ratio: number): string {
  if (ratio < 0.3) return '#ef4444';
  if (ratio < 0.6) return '#f59e0b';
  return '#10b981';
}

export const ScoreRing = forwardRef<HTMLDivElement, ScoreRingProps>(
  ({ className, size, score, maxScore = 10, ...props }, ref) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const ratio = Math.min(score / maxScore, 1);
    const offset = circumference * (1 - ratio);
    const color = getGradientColor(ratio);

    const dimension = size === 'sm' ? 112 : size === 'lg' ? 192 : 180;
    const viewBox = 180;

    return (
      <div
        ref={ref}
        className={scoreRingVariants({ size, className })}
        {...props}
      >
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          className="-rotate-90"
          aria-label={`Score: ${score} out of ${maxScore}`}
          role="img"
        >
          <defs>
            <linearGradient
              id={`gradient-${score}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <circle
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-border"
          />
          <circle
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold text-text-primary"
            style={{ fontSize: 48, lineHeight: 1 }}
          >
            {score.toFixed(1)}
          </span>
          <span
            className="font-mono text-text-tertiary"
            style={{ fontSize: 16, lineHeight: 1 }}
          >
            /{maxScore}
          </span>
        </div>
      </div>
    );
  },
);

ScoreRing.displayName = 'ScoreRing';
