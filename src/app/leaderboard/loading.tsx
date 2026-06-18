import { LeaderboardSkeleton } from '@/components/ui/LeaderboardSkeleton';

export default function Loading() {
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
        </div>

        <LeaderboardSkeleton count={6} />
      </div>
    </div>
  );
}
