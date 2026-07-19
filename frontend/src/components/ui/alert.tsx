import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const alertVariants = {
  info: {
    container: 'border-chart-1/20 bg-chart-1/5',
    icon: 'text-chart-1',
    Icon: Info,
  },
  success: {
    container: 'border-success/20 bg-success/5',
    icon: 'text-success',
    Icon: CheckCircle,
  },
  warning: {
    container: 'border-warning/20 bg-warning/5',
    icon: 'text-warning',
    Icon: AlertTriangle,
  },
  error: {
    container: 'border-destructive/20 bg-destructive/5',
    icon: 'text-destructive',
    Icon: AlertCircle,
  },
};

interface AlertProps {
  variant?: keyof typeof alertVariants;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const { container, icon: iconColor, Icon } = alertVariants[variant];
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-4', container, className)}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium text-foreground">{title}</p>}
        {children && (
          <div className={cn('text-sm text-muted-foreground', title && 'mt-0.5')}>
            {children}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
