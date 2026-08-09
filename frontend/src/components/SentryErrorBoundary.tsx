import { type ReactNode } from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from 'react-error-boundary';
import { reportError } from '../lib/observability';
import { ErrorFallback } from './ui/ErrorFallback';

const onError: ErrorBoundaryProps['onError'] = (error: Error, info: { componentStack?: string | null }) => {
  reportError(error, {
    category: 'react-render',
    component: info.componentStack ?? '',
    route: typeof window !== 'undefined' ? window.location.pathname : '',
  });
};

/**
 * Global render-error boundary.
 * Captures React render errors to Sentry (when configured) and shows a
 * safe fallback instead of a blank page. The fallback offers a reload;
 * secrets are never rendered — only the error class, not the message.
 */
export function SentryErrorBoundary({ children }: { children: ReactNode }) {
  const fallback = (
    <ErrorFallback
      error={undefined}
      resetErrorBoundary={() => window.location.reload()}
      title="An unexpected error occurred"
    />
  );
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}