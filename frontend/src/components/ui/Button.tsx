import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
        primary:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
        secondary:
          'bg-surface text-foreground border border-border hover:bg-elevated hover:border-border',
        outline:
          'border border-border bg-transparent text-secondary hover:bg-surface hover:text-foreground',
        ghost:
          'text-secondary hover:text-foreground hover:bg-surface',
        transparent:
          'bg-transparent text-secondary hover:text-foreground',
        destructive: 'bg-danger text-danger-foreground shadow-sm hover:opacity-90',
        danger:
          'bg-danger text-danger-foreground shadow-sm hover:opacity-90',
        success:
          'bg-success text-success-foreground shadow-sm hover:opacity-90',
        warning:
          'bg-warning text-warning-foreground shadow-sm hover:opacity-90',
        link: 'text-primary-text underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 rounded px-2.5 text-xs gap-1.5',
        sm: 'h-8 rounded px-3 text-xs gap-1.5',
        default: 'h-9 rounded px-4 gap-2',
        lg: 'h-10 rounded px-5 gap-2',
        xl: 'h-12 rounded px-6 text-base gap-2.5',
        'icon-xs': 'h-7 w-7 rounded',
        'icon-sm': 'h-8 w-8 rounded',
        icon: 'h-9 w-9 rounded',
        'icon-lg': 'h-10 w-10 rounded',
        'icon-xl': 'h-12 w-12 rounded',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
