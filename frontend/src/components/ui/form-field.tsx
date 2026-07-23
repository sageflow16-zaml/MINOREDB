import { cn } from '../../lib/utils';
import { Input } from './input';
import { Label } from './label';

export interface FormFieldProps {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  options?: string[];
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormField({ label, value, onChange, type = 'text', step, options, placeholder, className, error, required, disabled }: FormFieldProps) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const isSelect = type === 'select' || !!options;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {isSelect ? (
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            error ? 'border-destructive' : 'border-input',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <option value="">—</option>
          {(options || step?.split(',') || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={type}
          value={value ?? ''}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          disabled={disabled}
          aria-invalid={!!error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-8 text-xs"
        />
      )}
      {error && <p id={`${id}-error`} className="text-[10px] text-destructive mt-0.5">{error}</p>}
    </div>
  );
}

export function SectionLabel({ label, className }: { label: string; className?: string }) {
  return (
    <h4 className={cn(
      'col-span-full text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider pt-3 border-t border-border first:border-t-0 first:pt-0',
      className
    )}>
      {label}
    </h4>
  );
}
