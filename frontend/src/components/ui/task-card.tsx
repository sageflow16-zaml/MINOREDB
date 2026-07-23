import { Badge } from './badge';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

export interface TaskCardProps {
  step: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description?: string;
  result?: string;
  className?: string;
}

const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  pending: 'default',
  in_progress: 'warning',
  completed: 'success',
  failed: 'destructive',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
};

export function TaskCard({ step, title, status, description, result, className }: TaskCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {step}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-medium text-foreground">{title}</h4>
              <Badge variant={statusVariant[status] ?? 'default'} size="sm">
                {statusLabel[status] ?? status}
              </Badge>
            </div>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
            {result && (
              <div className="mt-2 rounded-md bg-muted/30 px-2.5 py-1.5">
                <p className="text-xs text-foreground">{result}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
