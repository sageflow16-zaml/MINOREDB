export const LoadingSpinner = () => (
  <div className="flex justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const ErrorState = ({ message }: { message: string }) => (
  <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
    {message}
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
    {message}
  </div>
);

export interface SkeletonProps {
  className?: string;
  rows?: number;
}

/** Reusable loading skeleton. Pass a className for a single block, or rows for stacked lines. */
export const Skeleton = ({ className, rows = 0 }: SkeletonProps) => {
  const base = 'animate-pulse rounded bg-slate-200 dark:bg-slate-700';
  if (rows > 0) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${base} h-4 ${i === rows - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    );
  }
  return <div className={`${base} ${className ?? 'h-4 w-full'}`} aria-hidden="true" />;
};
