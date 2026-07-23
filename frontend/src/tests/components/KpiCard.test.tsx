import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KpiCard } from '../../components/ui/KpiCard';

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Win Rate" value="72.5%" />);
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('72.5%')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<KpiCard title="Drawdown" value="5.2%" subtitle="Lowest since March" />);
    expect(screen.getByText('Lowest since March')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = React.forwardRef<SVGSVGElement, React.ComponentPropsWithoutRef<'svg'>>((props, ref) => <span data-testid="test-icon">📊</span>);
    render(<KpiCard title="Trades" value="42" icon={TestIcon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});