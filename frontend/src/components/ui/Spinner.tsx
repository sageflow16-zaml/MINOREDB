import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: number;
  label?: string;
}

/** Standalone loading spinner. */
export function Spinner({ className, size = 24, label }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-slate-500', className)} role="status">
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

/** Full-area loading overlay used as the route Suspense fallback. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}