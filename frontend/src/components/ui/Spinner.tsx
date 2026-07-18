import { cn } from '../../lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: number;
  label?: string;
}

export function Spinner({ className, size = 20, label }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-muted-foreground', className)} role="status">
      <div
        className="animate-spin rounded-full border-2 border-primary border-t-transparent"
        style={{ width: size, height: size }}
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
