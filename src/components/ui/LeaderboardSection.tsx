import Link from 'next/link';
import { Suspense } from 'react';
import { appRouter } from '@/lib/trpc/routers/_app';
import { CollapsibleCode } from '../CollapsibleCode';
import { CodeBlock } from './CodeBlock';

export function LeaderboardSection() {
  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-accent-green">
            {'//'}
          </span>
          <span className="font-mono text-sm font-bold text-text-primary">
            shame_leaderboard
          </span>
        </div>
        <Link
          href="/leaderboard"
          className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:text-text-primary"
        >
          $ view_all &gt;&gt;
        </Link>
      </div>

      <p className="font-mono text-[13px] text-text-tertiary">
        {'//'} the worst code on the internet, ranked by shame
      </p>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardContent />
      </Suspense>
    </section>
  );
}

async function LeaderboardContent() {
  const caller = appRouter.createCaller({});
  const { entries, totalCount } = await caller.leaderboard.getWorst();

  return (
    <>
      <div className="flex flex-col gap-5">
        {entries.map((entry, i) => {
          const score = Number(entry.score);
          const scoreColor =
            score < 3
              ? 'text-accent-red'
              : score < 6
                ? 'text-accent-amber'
                : 'text-accent-green';

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
                      className={`font-mono text-[13px] font-bold ${scoreColor}`}
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
                <CodeBlock
                  code={entry.codeContent}
                  language={entry.language ?? 'typescript'}
                />
              </CollapsibleCode>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-1 py-4">
        <span className="font-mono text-xs text-text-tertiary">
          showing top 3 of {totalCount.toLocaleString()} &middot;
        </span>
        <Link
          href="/leaderboard"
          className="font-mono text-xs text-text-tertiary underline underline-offset-2 hover:text-text-secondary"
        >
          view full leaderboard &gt;&gt;
        </Link>
      </div>
    </>
  );
}

function LeaderboardSkeleton() {
  const lineNumbers = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-5">
          <div className="flex items-center gap-4">
            <div className="h-4 w-12 animate-pulse rounded-sm bg-surface-alt" />
            <div className="h-4 w-20 animate-pulse rounded-sm bg-surface-alt" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded-sm bg-surface-alt" />
        </div>
        <div className="p-3">
          <div className="flex gap-3">
            <div className="flex flex-col gap-[6px]">
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="h-3 w-6 animate-pulse rounded-sm bg-surface-alt"
                />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-[6px]">
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="h-3 animate-pulse rounded-sm bg-surface-alt"
                  style={{
                    width:
                      n === 1
                        ? '75%'
                        : n === 2
                          ? '60%'
                          : n === 3
                            ? '85%'
                            : n === 4
                              ? '55%'
                              : '70%',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-5">
          <div className="flex items-center gap-4">
            <div className="h-4 w-12 animate-pulse rounded-sm bg-surface-alt" />
            <div className="h-4 w-20 animate-pulse rounded-sm bg-surface-alt" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded-sm bg-surface-alt" />
        </div>
        <div className="p-3">
          <div className="flex gap-3">
            <div className="flex flex-col gap-[6px]">
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="h-3 w-6 animate-pulse rounded-sm bg-surface-alt"
                />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-[6px]">
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="h-3 animate-pulse rounded-sm bg-surface-alt"
                  style={{
                    width:
                      n === 1
                        ? '75%'
                        : n === 2
                          ? '60%'
                          : n === 3
                            ? '85%'
                            : n === 4
                              ? '55%'
                              : '70%',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-5">
          <div className="flex items-center gap-4">
            <div className="h-4 w-12 animate-pulse rounded-sm bg-surface-alt" />
            <div className="h-4 w-20 animate-pulse rounded-sm bg-surface-alt" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded-sm bg-surface-alt" />
        </div>
        <div className="p-3">
          <div className="flex gap-3">
            <div className="flex flex-col gap-[6px]">
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="h-3 w-6 animate-pulse rounded-sm bg-surface-alt"
                />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-[6px]">
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="h-3 animate-pulse rounded-sm bg-surface-alt"
                  style={{
                    width:
                      n === 1
                        ? '75%'
                        : n === 2
                          ? '60%'
                          : n === 3
                            ? '85%'
                            : n === 4
                              ? '55%'
                              : '70%',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center py-4">
        <div className="h-4 w-44 animate-pulse rounded-sm bg-surface-alt" />
      </div>
    </div>
  );
}
