import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getHistory } from '../../lib/trust/history';
import type { HistoryPoint } from '../../lib/trust/types';

interface HistoricalTrendProps {
  metric: string;
  period?: '7d' | '30d' | '90d' | 'all';
  label?: string;
  className?: string;
  value?: number;
}

export function HistoricalTrend({ metric, period = '30d', className, value }: HistoricalTrendProps) {
  const history = useMemo(() => getHistory(metric, period), [metric, period]);

  if (history.length < 2 && value === undefined) {
    return (
      <div className={cn('flex items-center gap-2 text-3xs text-muted-foreground', className)}>
        <Minus className="h-3 w-3" />
        <span>Insufficient history for trend analysis</span>
      </div>
    );
  }

  const displayPoints = history.length >= 2 ? history : [];
  const trendValue = getTrendFromPoints(displayPoints);
  const displayTrend = displayPoints.length >= 2 ? trendValue : 'stable';
  const latestValue = displayPoints.length > 0 ? displayPoints[displayPoints.length - 1].value : value;
  const firstValue = displayPoints.length > 0 ? displayPoints[0].value : value;
  const diff = latestValue != null && firstValue != null ? latestValue - firstValue : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {displayTrend === 'improving' ? <TrendingUp className="h-3.5 w-3.5 text-success" /> :
         displayTrend === 'declining' ? <TrendingDown className="h-3.5 w-3.5 text-danger-text" /> :
         <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className={cn(
          'text-xs font-medium',
          displayTrend === 'improving' ? 'text-success' :
          displayTrend === 'declining' ? 'text-danger-text' :
          'text-muted-foreground'
        )}>
          {displayTrend === 'improving' ? 'Improving' :
           displayTrend === 'declining' ? 'Declining' :
           'Stable'}
        </span>
        {diff !== 0 && (
          <span className={cn('text-3xs', diff > 0 ? 'text-success' : 'text-danger-text')}>
            {diff > 0 ? '+' : ''}{diff}pts
          </span>
        )}
        <span className="text-3xs text-muted-foreground ml-auto">{periodLabel(period)}</span>
      </div>

      {displayPoints.length >= 2 && (
        <div className="flex items-end gap-0.5 h-10">
          {displayPoints.map((point, i) => {
            const maxVal = Math.max(...displayPoints.map((p) => p.value), 1);
            const height = (point.value / maxVal) * 100;
            const isLast = i === displayPoints.length - 1;
            return (
              <div
                key={i}
                title={`${point.label || ''}: ${point.value}`}
                className={cn(
                  'flex-1 rounded-sm transition-all',
                  isLast ? 'bg-primary' : 'bg-primary/30'
                )}
                style={{ height: `${Math.max(8, height)}%` }}
              />
            );
          })}
        </div>
      )}

      {displayPoints.length >= 2 && (
        <div className="flex justify-between text-3xs text-muted-foreground">
          <span>{displayPoints[0].label || formatShort(displayPoints[0].timestamp)}</span>
          <span>{displayPoints[displayPoints.length - 1].label || formatShort(displayPoints[displayPoints.length - 1].timestamp)}</span>
        </div>
      )}
    </div>
  );
}

function periodLabel(period: string): string {
  switch (period) {
    case '7d': return '7 days';
    case '30d': return '30 days';
    case '90d': return '90 days';
    case 'all': return 'All time';
    default: return period;
  }
}

function formatShort(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function getTrendFromPoints(points: HistoryPoint[]): 'improving' | 'stable' | 'declining' {
  if (points.length < 2) return 'stable';
  const sorted = [...points].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const diff = sorted[sorted.length - 1].value - sorted[0].value;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}
