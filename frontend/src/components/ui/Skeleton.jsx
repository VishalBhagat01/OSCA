export const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-shimmer rounded-lg bg-white/5 ${className}`}
  />
);

export const RunCardSkeleton = () => (
  <div className="rounded-2xl border border-white/6 bg-[#111111] p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-xl border border-white/6 bg-[#111111] p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
    ))}
  </div>
);

export default Skeleton;
