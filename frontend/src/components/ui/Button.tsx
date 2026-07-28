import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/25 active:scale-[0.97] active:shadow-md',
        secondary:
          'bg-[#18181B] text-foreground border border-[#27272A] shadow-sm hover:bg-[#1c1c1f] hover:border-[#3f3f46] active:scale-[0.97]',
        outline:
          'border border-[#27272A] bg-transparent text-secondary-foreground hover:bg-[#18181B] hover:text-foreground active:scale-[0.97]',
        ghost:
          'text-secondary-foreground hover:bg-[#18181B] hover:text-foreground active:scale-[0.97]',
        danger:
          'bg-danger text-danger-foreground shadow-lg shadow-danger/20 hover:bg-danger/90 hover:shadow-xl hover:shadow-danger/25 active:scale-[0.97]',
        success:
          'bg-success text-success-foreground shadow-lg shadow-success/20 hover:bg-success/90 hover:shadow-xl hover:shadow-success/25 active:scale-[0.97]',
        warning:
          'bg-warning text-warning-foreground shadow-lg shadow-warning/20 hover:bg-warning/90 active:scale-[0.97]',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary-hover',
      },
      size: {
        xs: 'h-7 rounded-md px-2.5 text-xs gap-1.5',
        sm: 'h-8 rounded-lg px-3 text-xs gap-1.5',
        default: 'h-9 rounded-xl px-4 gap-2',
        lg: 'h-10 rounded-xl px-5 gap-2',
        xl: 'h-12 rounded-2xl px-6 text-base gap-2.5',
        'icon-xs': 'h-7 w-7 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-lg',
        icon: 'h-9 w-9 rounded-xl',
        'icon-lg': 'h-10 w-10 rounded-xl',
        'icon-xl': 'h-12 w-12 rounded-2xl',
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
