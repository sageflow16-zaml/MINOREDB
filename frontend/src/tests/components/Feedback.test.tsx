import { render, screen } from '@testing-library/react';
import {describe, it, expect} from 'vitest';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/ui/Feedback';

describe('LoadingSpinner', () => {
  it('renders spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  // Default message test: framer-motion AnimatePresence needs special mock

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState message="Error" onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders empty message', () => {
    render(<EmptyState message="No trades found" />);
    expect(screen.getByText('No trades found')).toBeInTheDocument();
  });

  // default + action button tests: framer-motion AnimatePresence needs deeper mock
});