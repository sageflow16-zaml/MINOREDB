import { useMemo } from 'react';
import { Bug, AlertTriangle, CheckCircle, XCircle, BarChart3, TrendingUp, Link2, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getRatings, getAccuracyRate } from '../../lib/trust/feedback';
import { getAllMetrics, getHistory } from '../../lib/trust/history';

interface QualityPanelProps {
  className?: string;
}

export function AIQualityPanel({ className }: QualityPanelProps) {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) return null;

  const ratings = useMemo(() => getAccuracyRate(), []);
  const metrics = useMemo(() => getAllMetrics(), []);
  const totalSnapshots = useMemo(() => {
    return metrics.reduce((sum, m) => sum + getHistory(m, 'all').length, 0);
  }, [metrics]);

  const positiveRate = ratings.total > 0
    ? Math.round(((ratings.correct + ratings.helpful) / ratings.total) * 100)
    : 0;

  const qualityItems = useMemo(() => [
    {
      label: 'Evidence Coverage',
      value: `${metrics.length} metrics tracked`,
      icon: BarChart3,
      status: metrics.length >= 5 ? 'good' : metrics.length >= 2 ? 'ok' : 'bad',
    },
    {
      label: 'Average Confidence',
      value: `${positiveRate}% positive feedback`,
      icon: TrendingUp,
      status: positiveRate >= 70 ? 'good' : positiveRate >= 40 ? 'ok' : 'bad',
    },
    {
      label: 'Unsupported Insights',
      value: `${ratings.incorrect} incorrect ratings`,
      icon: AlertTriangle,
      status: ratings.incorrect === 0 ? 'good' : ratings.incorrect <= 3 ? 'ok' : 'bad',
    },
    {
      label: 'Missing Sources',
      value: `${metrics.length === 0 ? metrics.length : 0}`,
      icon: Link2,
      status: 'ok',
    },
    {
      label: 'Recommendation Accuracy',
      value: `${ratings.correct} correct · ${ratings.helpful} helpful`,
      icon: CheckCircle,
      status: ratings.correct + ratings.helpful >= ratings.incorrect ? 'good' : 'bad',
    },
    {
      label: 'Validation Errors',
      value: `${ratings.incorrect} reported`,
      icon: XCircle,
      status: ratings.incorrect === 0 ? 'good' : 'ok',
    },
    {
      label: 'Reasoning Failures',
      value: `${ratings.notHelpful} not helpful`,
      icon: Brain,
      status: ratings.notHelpful <= 2 ? 'good' : 'ok',
    },
    {
      label: 'Missing Connections',
      value: `${metrics.length} dimensions`,
      icon: Link2,
      status: metrics.length >= 3 ? 'good' : 'ok',
    },
  ], [metrics, positiveRate, ratings]);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Bug className="h-4 w-4 text-chart-4" />
        <h3 className="text-xs font-semibold text-foreground">AI Quality Panel</h3>
        <span className="text-3xs text-muted-foreground ml-auto">Dev Mode · v1</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {qualityItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-border/50 bg-surface/50 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <item.icon className={cn(
                'h-3 w-3',
                item.status === 'good' ? 'text-success' :
                item.status === 'bad' ? 'text-danger-text' :
                'text-warning'
              )} />
              <span className="text-3xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-xs text-foreground font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-4 text-3xs text-muted-foreground">
          <span>Total feedback: {ratings.total}</span>
          <span>Snapshots: {totalSnapshots}</span>
          <span>Metrics: {metrics.length}</span>
        </div>
        <span className={cn(
          'text-3xs font-medium',
          positiveRate >= 70 ? 'text-success' : positiveRate >= 40 ? 'text-warning' : 'text-danger-text'
        )}>
          Overall: {positiveRate}%
        </span>
      </div>
    </div>
  );
}
