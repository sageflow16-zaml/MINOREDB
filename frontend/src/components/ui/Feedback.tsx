import { motion } from 'framer-motion';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-muted-foreground"
    >
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="mt-4 text-sm font-medium">{message}</p>
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
  message?: string; // backward compat alias
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
      {icon || <Inbox className="h-10 w-10" />}
      <p className="mt-4 text-sm font-medium text-foreground">{displayTitle}</p>
      {displayDesc && <p className="mt-1 text-xs">{displayDesc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
