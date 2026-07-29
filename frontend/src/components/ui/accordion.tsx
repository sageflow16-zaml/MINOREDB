import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<any, Record<string, any>>(
({ children, ...props }, ref) => {
  const { className, title, icon, ...rest } = props;
  if (title !== undefined || icon !== undefined) {
    return (
      <AccordionPrimitive.Item ref={ref} className={cn('border-b border-border', className)} value="" {...rest}>
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-3 text-sm font-medium transition-all hover:text-foreground [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-2">
              {icon}
              <span>{title}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200" />
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
        <AccordionPrimitive.Content className="overflow-hidden text-sm text-secondary data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="pb-3 pt-0">{children}</div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    );
  }
  return <AccordionPrimitive.Item ref={ref} className={cn('border-b border-border', className)} value="" {...rest}>
    {children}
  </AccordionPrimitive.Item>;
});
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-3 text-sm font-medium transition-all hover:text-foreground [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm text-secondary data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-3 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export function AccordionGroup({ children, ...props }: AccordionProps) {
  return <Accordion {...props}>{children}</Accordion>;
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
