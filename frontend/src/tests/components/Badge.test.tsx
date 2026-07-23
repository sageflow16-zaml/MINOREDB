import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../../components/ui/badge';

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-badge">Custom</Badge>);
    expect(container.firstChild).toHaveClass('custom-badge');
  });

  it('renders all variants without error', () => {
    const variants = ['default', 'success', 'warning', 'destructive', 'info'] as const;
    variants.forEach((v) => {
      const { container } = render(<Badge variant={v}>{v}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});