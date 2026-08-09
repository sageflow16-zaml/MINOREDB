import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, Repeat, Zap } from 'lucide-react';
import {DiscoveryItem} from './types';

interface DiscoveryPanelProps {
  items: DiscoveryItem[];
  loading: boolean;
  onExplore: (item: DiscoveryItem) => void;
  onSearch: (query: string) => void;
}

function DiscoveryIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    gap: <Lightbulb className="h-4 w-4 text-chart-4" />,
    contradiction: <AlertTriangle className="h-4 w-4 text-danger-text" />,
    repeated_mistake: <Repeat className="h-4 w-4 text-warning" />,
    successful_behavior: <TrendingUp className="h-4 w-4 text-success" />,
    hidden_relationship: <Zap className="h-4 w-4 text-chart-2" />,
  };
  return icons[type] || <Lightbulb className="h-4 w-4 text-muted-foreground" />;
}

function DiscoveryColor({ type }: { type: string }) {
  const colors: Record<string, string> = {
    gap: 'border-chart-4/20 bg-chart-4/5',
    contradiction: 'border-danger/20 bg-danger/5',
    repeated_mistake: 'border-warning/20 bg-warning/5',
    successful_behavior: 'border-success/20 bg-success/5',
    hidden_relationship: 'border-chart-2/20 bg-chart-2/5',
  };
  return colors[type] || 'border-border/50 bg-background/50';
}

export function DiscoveryPanel({ items, loading, onExplore }: DiscoveryPanelProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded bg-muted/40" />
              <div className="h-3 w-32 rounded bg-muted/40" />
            </div>
            <div className="h-2 w-full rounded bg-muted/20" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <Zap className="h-5 w-5 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No discoveries yet. Process more data to uncover insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        Discoveries ({items.length})
      </p>
      {items.map((item, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onExplore(item)}
          className={`w-full text-left rounded-lg border p-2.5 transition-all hover:shadow-sm ${DiscoveryColor({ type: item.type })}`}
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5">{DiscoveryIcon({ type: item.type })}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-2xs font-medium text-foreground">{item.title}</span>
                {item.severity && (
                  <span className={`text-3xs font-medium px-1 rounded ${
                    item.severity === 'high' ? 'text-danger-text bg-danger/10' :
                    item.severity === 'medium' ? 'text-warning bg-warning/10' : 'text-muted bg-muted/20'
                  }`}>
                    {item.severity}
                  </span>
                )}
              </div>
              <p className="text-3xs text-muted-foreground line-clamp-2">{item.description}</p>
              {item.actionable && (
                <span className="text-3xs text-primary-text mt-0.5 inline-block">Explore →</span>
              )}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
