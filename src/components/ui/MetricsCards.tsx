'use client';

import NumberFlow from '@number-flow/react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';

export function MetricsCards() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.metrics.getStats.queryOptions(undefined));

  const totalRoasted = data?.totalRoasted ?? 0;
  const averageScore = data?.averageScore ?? null;
  const score = averageScore ? Number(averageScore) : null;

  return (
    <div className="flex items-center gap-6">
      <span className="font-mono text-xs text-text-tertiary">
        <NumberFlow value={totalRoasted} /> codes roasted
      </span>
      <span className="font-mono text-xs text-text-tertiary">&middot;</span>
      <span className="font-mono text-xs text-text-tertiary">
        {score !== null ? (
          <>
            avg score:{' '}
            <NumberFlow
              value={score}
              format={{
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }}
            />
            /10
          </>
        ) : (
          'avg score: —/10'
        )}
      </span>
    </div>
  );
}
