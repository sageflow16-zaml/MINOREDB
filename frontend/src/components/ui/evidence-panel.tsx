import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

export interface EvidenceItem {
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  sourceUrl?: string;
}

export interface EvidencePanelProps {
  items: EvidenceItem[];
  title?: string;
  className?: string;
  maxItems?: number;
}

export function EvidencePanel({ items, title = 'Evidence', className, maxItems = 5 }: EvidencePanelProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const displayItems = items.slice(0, maxItems);

  if (!items.length) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {displayItems.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-foreground truncate">{item.title}</span>
              {item.confidence !== undefined && (
                <Badge
                  variant={item.confidence >= 80 ? 'success' : item.confidence >= 60 ? 'info' : 'warning'}
                  size="sm"
                >
                  {item.confidence}%
                </Badge>
              )}
            </div>
            {expanded === i ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
          </button>
          {expanded === i && (
            <div className="border-t border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">{item.content}</p>
              {item.sourceUrl && (
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary-text hover:underline">
                  <ExternalLink className="h-3 w-3" /> View source
                </a>
              )}
            </div>
          )}
        </div>
      ))}
      {items.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center">+{items.length - maxItems} more items</p>
      )}
    </div>
  );
}
