import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorFallback } from '../../components/ui/ErrorFallback';

describe('ErrorFallback', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders the message for safe errors', () => {
    render(<ErrorFallback error={new Error('network is down')} />);
    expect(screen.getByText('network is down')).toBeInTheDocument();
  });

  it('never renders a message that may contain a token or password', () => {
    render(
      <ErrorFallback
        error={new Error('unauthorized: access_token=eyJhbGciOiJIUzI1NiJ9.payload.secret-part')}
      />
    );
    expect(screen.queryByText(/eyJhbGciOiJIUzI1NiJ9/)).not.toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('never renders a message that mentions a password', () => {
    render(<ErrorFallback error={new Error('password rejected for user foo')} />);
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('shows the retry button only when resetErrorBoundary is provided', () => {
    const { rerender } = render(<ErrorFallback error={new Error('x')} />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();

    rerender(<ErrorFallback error={new Error('x')} resetErrorBoundary={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});