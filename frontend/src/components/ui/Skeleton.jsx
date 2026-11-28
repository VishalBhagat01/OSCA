export const Skeleton = ({ className = "" }) => (
  <div className={`shimmer rounded-md bg-bone/6 ${className}`} aria-hidden />
);

export const RunCardSkeleton = () => (
  <div className="surface flex items-center justify-between gap-6 p-5">
    <div className="space-y-2.5">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-5 w-72 max-w-full" />
    </div>
    <Skeleton className="h-4 w-20" />
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-3 bg-ink-2 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-14" />
      </div>
    ))}
  </div>
);

export default Skeleton;
