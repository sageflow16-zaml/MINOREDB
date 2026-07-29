import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Alert } from '../../components/ui/alert';

describe('Alert', () => {
  it('renders with default info variant', () => {
    const { container } = render(<Alert>Alert content</Alert>);
    expect(screen.getByText('Alert content')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('border-chart-1/20');
  });

  it('renders with success variant', () => {
    const { container } = render(<Alert variant="success">Success</Alert>);
    const alert = container.firstChild as HTMLElement;
    expect(alert).toHaveClass('border-success/20');
  });

  it('renders with warning variant', () => {
    const { container } = render(<Alert variant="warning">Warning</Alert>);
    const alert = container.firstChild as HTMLElement;
    expect(alert).toHaveClass('border-warning/20');
  });

  it('renders with error variant', () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    const alert = container.firstChild as HTMLElement;
    expect(alert).toHaveClass('border-destructive/20');
  });

  it('renders title', () => {
    render(<Alert title="Alert Title" />);
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  it('renders both title and children', () => {
    render(<Alert title="Title">Description text</Alert>);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('renders close button when onClose is provided', () => {
    render(<Alert onClose={() => {}}>Closable</Alert>);
    expect(screen.getByRole('button', { name: /close alert/i })).toBeInTheDocument();
  });

  it('does not render close button when onClose is not provided', () => {
    render(<Alert>No close</Alert>);
    expect(screen.queryByRole('button', { name: /close alert/i })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Alert onClose={handleClose}>Closable</Alert>);
    await user.click(screen.getByRole('button', { name: /close alert/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-alert">Custom</Alert>);
    expect(container.firstChild).toHaveClass('custom-alert');
  });

  it('renders info icon by default', () => {
    const { container } = render(<Alert>Info alert</Alert>);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
