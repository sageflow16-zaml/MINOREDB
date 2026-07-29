import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../../components/ui/input';

describe('Input', () => {
  it('renders placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('applies error styles when error is present', () => {
    const { container } = render(<Input error={true} />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-danger');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Input onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(handleChange).toHaveBeenCalledTimes(5);
  });

  it('disables input', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders with custom className', () => {
    const { container } = render(<Input className="custom-input" />);
    expect(container.querySelector('input')).toHaveClass('custom-input');
  });
});