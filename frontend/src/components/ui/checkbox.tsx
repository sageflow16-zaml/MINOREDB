import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  label?: string;
}

export function Checkbox({ checked, onCheckedChange, disabled, id, className, label }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={cn(
            'h-4 w-4 rounded border transition-colors flex items-center justify-center peer-focus-visible:ring-1 peer-focus-visible:ring-ring',
            checked
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-input bg-background hover:border-muted-foreground/50'
          )}
        >
          {checked && <Check className="h-3 w-3" />}
        </div>
      </div>
      {label && <span className="text-sm text-foreground select-none">{label}</span>}
    </label>
  );
}
