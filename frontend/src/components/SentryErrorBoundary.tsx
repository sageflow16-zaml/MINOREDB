import { type ReactNode } from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from 'react-error-boundary';
import { isSentryEnabled } from '../lib/sentry';

const onError: ErrorBoundaryProps['onError'] = (error: Error, info: { componentStack?: string | null }) => {
  if (isSentryEnabled) {
    void import('@sentry/react').then((Sentry) =>
      Sentry.captureException(error, { extra: { componentStack: info.componentStack ?? '' } }),
    );
  } else {
    console.error('Unhandled error:', error, info.componentStack);
  }
};

export function SentryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={null} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}
