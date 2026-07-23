import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  label?: string;
}

export function Switch({ checked, onCheckedChange, disabled, id, className, label }: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'relative inline-flex items-center gap-2 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative">
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
            'h-5 w-9 rounded-full transition-colors peer-focus-visible:ring-1 peer-focus-visible:ring-ring',
            checked ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          <div
            className={cn(
              'h-4 w-4 rounded-full bg-background shadow-sm transition-transform translate-y-0.5',
              checked ? 'translate-x-[18px]' : 'translate-x-0.5'
            )}
          />
        </div>
      </div>
      {label && <span className="text-sm text-foreground select-none">{label}</span>}
    </label>
  );
}
