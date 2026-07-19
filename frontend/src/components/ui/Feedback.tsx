import { motion } from 'framer-motion';
import { AlertCircle, Inbox, RefreshCw, SearchX } from 'lucide-react';
import { Button } from './Button';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function LoadingSpinner({ message, size = 'default' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    default: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className={cn('animate-spin rounded-full border-primary/30 border-t-primary', sizeClasses[size])} />
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-muted-foreground"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-2 h-3 w-3" /> Try Again
        </Button>
      )}
    </motion.div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, message, action }: EmptyStateProps) {
  const displayTitle = title || message || 'No data';
  const displayDesc = description || '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-muted-foreground"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon || <Inbox className="h-6 w-6 text-muted-foreground/50" />}
      </div>
      <p className="text-sm font-medium text-foreground">{displayTitle}</p>
      {displayDesc && <p className="mt-1 text-xs text-muted-foreground max-w-sm text-center">{displayDesc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
