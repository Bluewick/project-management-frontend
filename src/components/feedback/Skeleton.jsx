/**
 * Base shimmer skeleton block.
 */
export function Skeleton({ className = 'h-4 w-full rounded-md' }) {
  return <div aria-hidden="true" className={`skeleton-shimmer ${className}`} />;
}

/**
 * Shimmer skeleton placeholder for Level 1 cards.
 */
export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div aria-hidden="true" className={`surface-card rounded-xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton
            key={idx}
            className={`h-3 rounded-md ${idx === lines - 1 ? 'w-3/5' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton rows for DataTable loading states.
 */
export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div aria-hidden="true" className="divide-y divide-surface-container">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="h-[52px] px-4 flex items-center gap-4"
        >
          {Array.from({ length: columns }).map((__, colIdx) => (
            <Skeleton
              key={colIdx}
              className={`h-3.5 rounded-md flex-1 ${colIdx === 0 ? 'max-w-[72px]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton layout for Issue Detail workspace.
 */
export function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
      <div className="space-y-4">
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}
