export const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-shimmer rounded-lg bg-zinc-800/60 ${className}`}
      {...props}
    />
  );
};

export const RunCardSkeleton = () => {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-2"
        >
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
