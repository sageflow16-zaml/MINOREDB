import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    positive?: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'default';
}

const variantStyles = {
  default: '',
  success: 'border-success/20',
  warning: 'border-warning/20',
  danger: 'border-danger/20',
  info: 'border-info/20',
};

const iconContainerStyles = {
  default: 'text-primary-text bg-primary-muted',
  success: 'text-success bg-success-muted',
  warning: 'text-warning bg-warning-muted',
  danger: 'text-danger-text bg-danger-muted',
  info: 'text-info bg-info-muted',
};

export function KpiCard({ title, value, icon: Icon, trend, subtitle, onClick, variant = 'default', size = 'default' }: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:border-border hover:shadow-md',
        size === 'sm' && 'p-3'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn('font-medium text-muted', size === 'sm' ? 'text-3xs' : 'text-xs')}>{title}</p>
          <p className={cn('font-semibold tracking-tight text-foreground tabular-nums', size === 'sm' ? 'text-base' : 'text-xl')}>{value}</p>
          {subtitle && (
            <p className={cn('text-muted', size === 'sm' ? 'text-3xs' : 'text-xs')}>{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              {trend.positive !== undefined ? (
                trend.positive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-danger-text" />
                )
              ) : null}
              <span className={cn(
                'text-xs font-medium',
                trend.positive ? 'text-success' : trend.positive === false ? 'text-danger-text' : 'text-muted'
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded', iconContainerStyles[variant])}>
            <Icon className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
        )}
      </div>
    </div>
  );
}
