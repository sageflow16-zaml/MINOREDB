import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
}

/** Reusable error UI for React Error Boundaries and query failures. */
export function ErrorFallback({ error, resetErrorBoundary, title = 'Something went wrong', message }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {message ?? error?.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
      {resetErrorBoundary && (
        <Button variant="outline" onClick={resetErrorBoundary}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}