import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ActivityFeedProps {
  children: ReactNode;
  className?: string;
}

export function ActivityFeed({ children, className }: ActivityFeedProps) {
  return <div className={cn('space-y-1', className)}>{children}</div>;
}

interface ActivityItemProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  time?: string;
  badge?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  className?: string;
}

const variantDot: Record<string, string> = {
  default: 'bg-muted-foreground/30',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-chart-1',
};

export function ActivityItem({
  icon, title, description, time, badge,
  variant = 'default', onClick, className,
}: ActivityItemProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors w-full text-left',
        onClick && 'hover:bg-muted/20 cursor-pointer',
        className,
      )}
    >
      {icon ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
      ) : (
        <div className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', variantDot[variant])} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground truncate">{title}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {description && (
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
        )}
      </div>
      {time && <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">{time}</span>}
    </Wrapper>
  );
}
