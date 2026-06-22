'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { CodeBlockClient } from '@/components/ui/CodeBlockClient';
import { DiffLine } from '@/components/ui/DiffLine';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { useTRPC } from '@/lib/trpc/client';

export default function RoastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const trpc = useTRPC();
  const numericId = Number(id);

  const { data, isLoading } = useQuery({
    ...trpc.roast.getStatus.queryOptions({ id: numericId }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'error') return false;
      return 2000;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-20 py-10">{/* loading */}</div>;
  }

  if (!data || data.status === 'error') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-20 py-10">
        <p className="font-mono text-accent-red">{'// failed_to_roast'}</p>
        {data?.errorMessage && (
          <p className="font-mono text-xs text-text-tertiary">
            {'// '}
            {data.errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (data.status === 'pending' || data.status === 'processing') {
    return (
      <div className="mx-auto max-w-3xl px-20 py-10">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent-green">
                {'//'}
              </span>
              <h2 className="font-mono text-sm font-bold text-text-primary">
                roasting...
              </h2>
            </div>
            <CodeBlockClient
              code={data.submission.codeContent}
              language={data.submission.language ?? 'plaintext'}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-20 py-10">
      <div className="flex flex-col gap-10">
        {/* Score Hero */}
        <div className="flex items-center gap-12">
          <ScoreRing
            score={Number(
              'score' in data.submission ? data.submission.score : 0,
            )}
            maxScore={10}
            size="md"
          />
          <div className="flex flex-col gap-4">
            <Badge variant="verdict" size="md">
              {'verdict' in data.submission ? data.submission.verdict : null}
            </Badge>
            <p className="font-mono text-xl leading-relaxed text-text-primary">
              &ldquo;
              {'roastQuote' in data.submission
                ? data.submission.roastQuote
                : ''}
              &rdquo;
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
                lang: {data.submission.language}
                <span>·</span>
                {data.submission.codeContent.split('\n').length} lines
              </span>
              <Button variant="secondary" size="sm">
                $ share_roast
              </Button>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        {/* Submitted Code */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {'//'}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              your_submission
            </h2>
          </div>
          <CodeBlockClient
            code={data.submission.codeContent}
            language={data.submission.language ?? 'plaintext'}
          />
        </div>

        <div className="h-px w-full bg-border" />

        {/* Detailed Analysis */}
        {data.issues && data.issues.length > 0 && (
          <>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-accent-green">
                  {'//'}
                </span>
                <h2 className="font-mono text-sm font-bold text-text-primary">
                  detailed_analysis
                </h2>
              </div>
              <div className="flex flex-col gap-5">
                {chunkArray(data.issues, 2).map((row, rowIndex) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static chunk rows
                  <div key={rowIndex} className="flex gap-5">
                    {row.map((issue) => (
                      <Card key={issue.id} className="flex-1">
                        <CardHeader>
                          <Badge
                            variant={
                              issue.severity as 'critical' | 'warning' | 'good'
                            }
                          >
                            {issue.severity}
                          </Badge>
                        </CardHeader>
                        <CardTitle>{issue.title}</CardTitle>
                        <CardDescription>{issue.description}</CardDescription>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-border" />
          </>
        )}

        {/* Suggested Fix (first issue's fixes) */}
        {data.issues?.[0]?.fixes && data.issues[0].fixes.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent-green">
                {'//'}
              </span>
              <h2 className="font-mono text-sm font-bold text-text-primary">
                suggested_fix
              </h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-input">
              <div className="flex h-10 items-center border-b border-border px-4">
                <span className="font-mono text-xs font-medium text-text-secondary">
                  {data.submission.language ?? 'code'} &rarr; improved
                </span>
              </div>
              <div className="flex flex-col py-1">
                {data.issues[0].fixes
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((fix) => (
                    <DiffLine
                      key={fix.id}
                      variant={fix.diffType as 'added' | 'removed' | 'context'}
                    >
                      {fix.codeContent}
                    </DiffLine>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
