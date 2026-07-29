import { cn } from '../../lib/utils';
import type { ReasoningStep } from '../../lib/trust/types';

interface ReasoningTraceProps {
  steps: ReasoningStep[];
  className?: string;
}

export function ReasoningTrace({ steps, className }: ReasoningTraceProps) {
  if (!steps.length) return null;

  return (
    <div className={cn('space-y-0', className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Reasoning</h4>
      <div className="relative">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
        {steps.map((step) => (
          <div key={step.order} className="flex items-start gap-3 pb-3 last:pb-0">
            <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-3xs font-medium text-muted-foreground">
              {step.order}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">{step.action}</p>
              <p className="text-3xs text-muted-foreground mt-0.5">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
