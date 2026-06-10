import { CodeBlock } from '@/components/ui/CodeBlock';

type LeaderboardEntryProps = {
  rank: number;
  score: number;
  language: string;
  lines: number;
  code: string;
};

export async function LeaderboardEntry({
  rank,
  score,
  language,
  lines,
  code,
}: LeaderboardEntryProps) {
  const scoreColor =
    score < 3
      ? 'text-accent-red'
      : score < 6
        ? 'text-accent-amber'
        : 'text-accent-green';

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
      <div className="flex h-12 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[13px] text-text-tertiary">#</span>
            <span className="font-mono text-[13px] font-bold text-accent-amber">
              {rank}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-text-tertiary">score:</span>
            <span className={`font-mono text-[13px] font-bold ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-secondary">
            {language}
          </span>
          <span className="font-mono text-xs text-text-tertiary">
            {lines} lines
          </span>
        </div>
      </div>
      <CodeBlock code={code} language={language} />
    </div>
  );
}
