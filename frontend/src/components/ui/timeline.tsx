import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TimelineProps {
  children: ReactNode;
  className?: string;
}

export function Timeline({ children, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  );
}

interface TimelineItemProps {
  time?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: ReactNode;
  className?: string;
}

const variantColors: Record<string, string> = {
  default: 'bg-muted-foreground/30',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-chart-1',
};

const variantIconBg: Record<string, string> = {
  default: 'bg-muted',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-chart-1/10 text-chart-1',
};

export function TimelineItem({
  time, title, description, icon,
  variant = 'default', children, className,
}: TimelineItemProps) {
  return (
    <div className={cn('relative flex gap-4 pb-6 last:pb-0', className)}>
      <div className="flex flex-col items-center">
        {icon ? (
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            variantIconBg[variant],
          )}>
            {icon}
          </div>
        ) : (
          <div className={cn('mt-1.5 h-3 w-3 shrink-0 rounded-full', variantColors[variant])} />
        )}
        <div className="mt-1 w-px flex-1 bg-border" />
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2">
          {time && <span className="text-[10px] font-medium text-muted-foreground shrink-0">{time}</span>}
          <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        </div>
        {description && (
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">{description}</p>
        )}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

interface TimelineBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function TimelineBadge({ label, variant = 'default' }: TimelineBadgeProps) {
  const colors: Record<string, string> = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-chart-1/10 text-chart-1',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium', colors[variant])}>
      {label}
    </span>
  );
}
