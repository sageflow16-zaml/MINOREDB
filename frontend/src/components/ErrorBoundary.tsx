import { Component, type ReactNode } from 'react';
import { reportError } from '../lib/observability';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    reportError(error, {
      category: 'react-render',
      component: errorInfo.componentStack ?? '',
      route: typeof window !== 'undefined' ? window.location.pathname : '',
      details: { recoverable: Boolean(this.props.fallback) },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-4">!</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            An unexpected error occurred.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface/80 text-sm font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
          {this.state.error && (
            <pre className="mt-4 text-xs text-destructive max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
