import { motion } from 'framer-motion';
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
  danger: 'border-destructive/20',
  info: 'border-chart-1/20',
};

const iconContainerStyles = {
  default: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  danger: 'text-destructive bg-destructive/10',
  info: 'text-chart-1 bg-chart-1/10',
};

export function KpiCard({ title, value, icon: Icon, trend, subtitle, onClick, variant = 'default', size = 'default' }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.01, y: -1 } : undefined}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-4 transition-all',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md',
        size === 'sm' && 'p-3'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn('font-medium text-muted-foreground', size === 'sm' ? 'text-[10px]' : 'text-xs')}>{title}</p>
          <p className={cn('font-bold tracking-tight text-foreground', size === 'sm' ? 'text-base' : 'text-xl')}>{value}</p>
          {subtitle && (
            <p className={cn('text-muted-foreground', size === 'sm' ? 'text-[10px]' : 'text-xs')}>{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              {trend.positive !== undefined ? (
                trend.positive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )
              ) : null}
              <span className={cn(
                'text-xs font-medium',
                trend.positive ? 'text-success' : trend.positive === false ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconContainerStyles[variant])}>
            <Icon className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
