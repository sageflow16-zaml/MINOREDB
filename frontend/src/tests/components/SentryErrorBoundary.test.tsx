import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SentryErrorBoundary } from '../../components/SentryErrorBoundary';
import { isSentryEnabled } from '../../lib/sentry';

const Boom = () => {
  throw new Error('render exploded');
};

const Stable = () => <div>STABLE_CHILD</div>;

describe('SentryErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <SentryErrorBoundary>
        <Stable />
      </SentryErrorBoundary>
    );
    expect(screen.getByText('STABLE_CHILD')).toBeInTheDocument();
  });

  it('renders a safe fallback (no raw error message) when a child crashes', () => {
    render(
      <SentryErrorBoundary>
        <Boom />
      </SentryErrorBoundary>
    );
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    // Error text is deliberately not shown on the global boundary.
    expect(screen.queryByText(/boom exploded/)).not.toBeInTheDocument();
  });

  it('offers a reload action (safe retry) in the fallback', () => {
    render(
      <SentryErrorBoundary>
        <Boom />
      </SentryErrorBoundary>
    );
    const reload = screen.getByRole('button', { name: /try again/i });
    expect(reload).toBeInTheDocument();
  });

  it('does not double-report when Sentry is disabled (tests run without DSN)', () => {
    expect(isSentryEnabled).toBe(false);
    render(
      <SentryErrorBoundary>
        <Boom />
      </SentryErrorBoundary>
    );
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});