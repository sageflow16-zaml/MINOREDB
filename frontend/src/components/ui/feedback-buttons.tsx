import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { submitRating } from '../../lib/trust/feedback';

interface FeedbackButtonsProps {
  source: string;
  targetType: string;
  targetId: string;
  className?: string;
}

const options = [
  { value: 'correct' as const, icon: CheckCircle, label: 'Correct', color: 'text-success hover:text-success/80' },
  { value: 'helpful' as const, icon: ThumbsUp, label: 'Helpful', color: 'text-chart-4 hover:text-chart-4/80' },
  { value: 'not_helpful' as const, icon: ThumbsDown, label: 'Not Helpful', color: 'text-warning hover:text-warning/80' },
  { value: 'incorrect' as const, icon: XCircle, label: 'Incorrect', color: 'text-danger hover:text-danger/80' },
];

export function FeedbackButtons({ source, targetType, targetId, className }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const handleClick = (rating: 'correct' | 'helpful' | 'not_helpful' | 'incorrect') => {
    submitRating({ source, targetType, targetId, rating });
    setSubmitted(rating);
    setTimeout(() => setSubmitted(null), 3000);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-3xs text-muted-foreground mr-1">Was this helpful?</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleClick(opt.value)}
          disabled={submitted !== null}
          className={cn(
            'flex items-center gap-1 rounded-md px-1.5 py-1 text-3xs transition-all',
            submitted === opt.value ? opt.color + ' bg-muted/30' : 'text-muted-foreground/50 hover:text-muted-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title={opt.label}
        >
          <opt.icon className="h-3 w-3" />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
      {submitted && <span className="text-3xs text-success ml-1">Thanks!</span>}
    </div>
  );
}
