import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type MetricVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantStyles: Record<MetricVariant, { value: string; bg: string; border: string }> = {
  default: { value: 'text-foreground', bg: 'bg-muted/30', border: 'border-border' },
  success: { value: 'text-success', bg: 'bg-success/5', border: 'border-success/20' },
  warning: { value: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/20' },
  danger: { value: 'text-destructive', bg: 'bg-destructive/5', border: 'border-destructive/20' },
  info: { value: 'text-chart-1', bg: 'bg-chart-1/5', border: 'border-chart-1/20' },
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: MetricVariant;
  size?: 'sm' | 'default';
  className?: string;
}

export function MetricCard({ label, value, icon, variant = 'default', size = 'default', className }: MetricCardProps) {
  const s = variantStyles[variant];
  return (
    <div className={cn('rounded-lg border', s.border, s.bg, 'p-2.5', className)}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon && <span className={cn('h-3 w-3', s.value)}>{icon}</span>}
        <span className="text-3xs font-medium text-muted-foreground truncate">{label}</span>
      </div>
      <p className={cn(size === 'sm' ? 'text-sm' : 'text-lg', 'font-bold', s.value)}>
        {value}
      </p>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string | number;
  variant?: MetricVariant;
  className?: string;
}

export function MetricRow({ label, value, variant = 'default', className }: MetricRowProps) {
  const s = variantStyles[variant];
  return (
    <div className={cn('flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2', className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold', s.value)}>{value}</span>
    </div>
  );
}

interface MetricGroupProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function MetricGroup({ children, columns = 4, className }: MetricGroupProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {children}
    </div>
  );
}
