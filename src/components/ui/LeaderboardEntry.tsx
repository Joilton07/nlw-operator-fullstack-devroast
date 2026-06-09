import { codeToHtml } from 'shiki';

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
  const html = await codeToHtml(code, { lang: language, theme: 'vesper' });
  const lineCount = code.split('\n').length;

  const scoreColor =
    score < 3
      ? 'text-accent-red'
      : score < 6
        ? 'text-accent-amber'
        : 'text-accent-green';

  return (
    <div className="flex flex-col border border-border">
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
      <div className="flex bg-input">
        <div className="flex w-10 shrink-0 flex-col items-end gap-[6px] border-r border-border bg-surface px-[10px] py-3.5">
          {Array.from({ length: lineCount }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static line numbers
              key={i}
              className="font-mono text-xs leading-none text-text-tertiary"
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div
          className="overflow-x-auto p-4 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!font-mono [&_code]:!text-xs [&_code]:!leading-none"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates safe HTML server-side
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
