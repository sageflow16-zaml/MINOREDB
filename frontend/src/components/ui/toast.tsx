import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'border-success/20 text-success',
  error: 'border-danger/20 text-danger-text',
  warning: 'border-warning/20 text-warning',
  info: 'border-info/20 text-info',
};

const bgMap = {
  success: 'bg-success-muted',
  error: 'bg-danger-muted',
  warning: 'bg-warning-muted',
  info: 'bg-info-muted',
};

type ToastVariant = keyof typeof iconMap;

function show(variant: ToastVariant, message: string, description?: string) {
  const Icon = iconMap[variant];
  hotToast.custom(
    (t) => (
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-border bg-card p-4 shadow-lg',
          'animate-in slide-in-from-right-2 fade-in-0',
          t.visible ? 'animate-in' : 'animate-out fade-out-0 slide-out-to-right-2'
        )}
      >
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded', bgMap[variant])}>
          <Icon className={cn('h-4 w-4', colorMap[variant])} />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        <button
          onClick={() => hotToast.dismiss(t.id)}
          aria-label="Dismiss notification"
          className="shrink-0 rounded p-1 text-muted/50 hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
    { duration: variant === 'error' ? 5000 : 3000 }
  );
}

export const toast = {
  success: (message: string, description?: string) => show('success', message, description),
  error: (message: string, description?: string) => show('error', message, description),
  warning: (message: string, description?: string) => show('warning', message, description),
  info: (message: string, description?: string) => show('info', message, description),
  dismiss: hotToast.dismiss,
};

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      gutter={8}
      containerClassName="!bottom-4 !right-4"
      toastOptions={{ duration: Infinity }}
    />
  );
}
