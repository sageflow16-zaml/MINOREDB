import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, title = 'Something went wrong', message }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {message ?? error?.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
      {resetErrorBoundary && (
        <Button variant="outline" onClick={resetErrorBoundary}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
