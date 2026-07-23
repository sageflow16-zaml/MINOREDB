import { cn } from '../lib/utils';

export const StatCard = ({
  title,
  value,
  className,
}: {
  title: string;
  value: number | string;
  className?: string;
}) => (
  <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
    <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
    <p className="text-2xl font-bold tracking-tight mt-1 text-foreground">{value}</p>
  </div>
);
