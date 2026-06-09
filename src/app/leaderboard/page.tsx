import { LeaderboardEntry } from '@/components/ui/LeaderboardEntry';

const entries = [
  {
    rank: 1,
    score: 1.2,
    language: 'javascript',
    lines: 3,
    code: [
      "eval(prompt('enter code'))",
      'document.write(response)',
      '// trust the user lol',
    ].join('\n'),
  },
  {
    rank: 2,
    score: 1.8,
    language: 'typescript',
    lines: 3,
    code: [
      'if (x == true) { return true; }',
      'else if (x == false) { return false; }',
      'else { return !false; }',
    ].join('\n'),
  },
  {
    rank: 3,
    score: 2.1,
    language: 'sql',
    lines: 2,
    code: ['SELECT * FROM users WHERE 1=1', '-- TODO: add authentication'].join(
      '\n',
    ),
  },
  {
    rank: 4,
    score: 2.3,
    language: 'java',
    lines: 3,
    code: ['catch (e) {', '  // ignore', '}'].join('\n'),
  },
  {
    rank: 5,
    score: 2.5,
    language: 'javascript',
    lines: 3,
    code: [
      'const sleep = (ms) =>',
      '  new Date(Date.now() + ms)',
      '  while(new Date() < end) {}',
    ].join('\n'),
  },
];

export default async function Leaderboard() {
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
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-tertiary">
              2,847 submissions
            </span>
            <span className="font-mono text-xs text-text-tertiary">·</span>
            <span className="font-mono text-xs text-text-tertiary">
              avg score: 4.2/10
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {entries.map((entry) => (
            <LeaderboardEntry
              key={entry.rank}
              rank={entry.rank}
              score={entry.score}
              language={entry.language}
              lines={entry.lines}
              code={entry.code}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
