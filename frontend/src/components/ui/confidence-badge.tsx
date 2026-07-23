import { Badge } from './badge';
import { cn } from '../../lib/utils';

export interface ConfidenceBadgeProps {
  score: number;
  className?: string;
}

export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const variant = score >= 80 ? 'success' : score >= 60 ? 'info' : score >= 40 ? 'warning' : 'destructive';
  return (
    <Badge variant={variant} size="sm" className={cn('gap-1', className)}>
      {score}% confidence
    </Badge>
  );
}
