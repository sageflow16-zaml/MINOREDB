import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: boolean;
  compact?: boolean;
}

export function NumberInput({ value, onChange, min, max, step = 1, error, compact, className, ...props }: NumberInputProps) {
  const handleDecrement = () => {
    if (value === undefined) return;
    const newVal = Math.max(min ?? -Infinity, value - step);
    onChange?.(newVal);
  };

  const handleIncrement = () => {
    if (value === undefined) return;
    const newVal = Math.min(max ?? Infinity, value + step);
    onChange?.(newVal);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange?.(parsed);
    } else if (e.target.value === '') {
      onChange?.(0);
    }
  };

  return (
    <div className={cn('flex items-center', compact ? 'gap-0' : 'gap-0.5')}>
      <button
        type="button"
        onClick={handleDecrement}
        aria-label="Decrease value"
        disabled={value !== undefined && min !== undefined ? value <= min : false}
        className={cn(
          'flex items-center justify-center border border-r-0 border-input rounded-l-lg bg-background hover:bg-accent transition-colors',
          compact ? 'h-8 w-7' : 'h-9 w-8',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Minus className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
      </button>
      <input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'flex w-16 border border-input bg-background text-center text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          error ? 'border-destructive' : 'border-input',
          compact ? 'h-8 text-xs' : 'h-9',
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={handleIncrement}
        aria-label="Increase value"
        disabled={value !== undefined && max !== undefined ? value >= max : false}
        className={cn(
          'flex items-center justify-center border border-l-0 border-input rounded-r-lg bg-background hover:bg-accent transition-colors',
          compact ? 'h-8 w-7' : 'h-9 w-8',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Plus className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
      </button>
    </div>
  );
}
