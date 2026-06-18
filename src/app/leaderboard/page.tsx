'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';
import { CollapsibleCode } from '@/components/CollapsibleCode';
import { CodeBlockClient } from '@/components/ui/CodeBlockClient';
import { LeaderboardSkeleton } from '@/components/ui/LeaderboardSkeleton';

export default function Leaderboard() {
  const trpc = useTRPC();
  const { data, isPending, isError } = useQuery({
    ...trpc.leaderboard.getWorst.queryOptions({ limit: 20 }),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
  });

  const scoreColor = (score: number) => {
    if (score < 3) return 'text-accent-red';
    if (score < 6) return 'text-accent-amber';
    return 'text-accent-green';
  };

  return (
    <div className="mx-auto max-w-3xl px-20 py-10">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[32px] font-bold text-accent-green">
              {'>'}
            </span>
            <h1 className="font-mono text-[28px] font-bold text-text-primary">
              shame_leaderboard
            </h1>
          </div>
          <p className="font-mono text-sm text-text-secondary">
            {'// the most roasted code on the internet'}
          </p>
          {data && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-tertiary">
                {data.totalCount.toLocaleString()} submissions
              </span>
            </div>
          )}
        </div>

        {isPending && <LeaderboardSkeleton count={3} />}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-20">
            <span className="font-mono text-sm text-accent-red">
              {'// failed to load leaderboard'}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {'try again later'}
            </span>
          </div>
        )}

        {data && data.entries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-20">
            <span className="font-mono text-sm text-text-secondary">
              {'// no code has been roasted yet'}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {'be the first.'}
            </span>
          </div>
        )}

        {data && data.entries.length > 0 && (
          <div className="flex flex-col gap-5">
            {data.entries.map((entry, i) => {
              const score = Number(entry.score);
              return (
                <div
                  key={entry.id}
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[13px] text-text-tertiary">
                          #
                        </span>
                        <span className="font-mono text-[13px] font-bold text-accent-amber">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-text-tertiary">
                          score:
                        </span>
                        <span
                          className={`font-mono text-[13px] font-bold ${scoreColor(score)}`}
                        >
                          {score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-text-secondary">
                        {entry.language ?? '—'}
                      </span>
                    </div>
                  </div>
                  <CollapsibleCode maxHeight={89}>
                    <CodeBlockClient
                      code={entry.codeContent}
                      language={entry.language ?? 'typescript'}
                    />
                  </CollapsibleCode>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
