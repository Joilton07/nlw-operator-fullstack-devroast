type LeaderboardSkeletonProps = {
  count?: number;
  showFooter?: boolean;
};

export function LeaderboardSkeleton({
  count = 3,
  showFooter = false,
}: LeaderboardSkeletonProps) {
  const lineNumbers = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <div key={i} className="overflow-hidden rounded-lg border border-border">
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
      ))}
      {showFooter && (
        <div className="flex justify-center py-4">
          <div className="h-4 w-44 animate-pulse rounded-sm bg-surface-alt" />
        </div>
      )}
    </div>
  );
}
