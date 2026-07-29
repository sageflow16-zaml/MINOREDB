import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import { RelatedItem, RelationshipType, KnowledgeEntity, ENTITY_COLORS, ENTITY_LABELS, RELATIONSHIP_LABELS } from './types';

interface RelatedItemsPanelProps {
  entity: KnowledgeEntity;
  related: RelatedItem[];
  loading: boolean;
  onNavigate: (entity: KnowledgeEntity) => void;
}

function RelationshipIcon({ type }: { type: RelationshipType }) {
  const icons = {
    supports: () => <ArrowUp className="h-3 w-3 text-success" />,
    contradicts: () => <ArrowDown className="h-3 w-3 text-danger" />,
    explains: () => <ArrowRight className="h-3 w-3 text-chart-4" />,
    references: () => <ExternalLink className="h-3 w-3 text-chart-2" />,
    derived_from: () => <ArrowLeft className="h-3 w-3 text-warning" />,
    related_to: () => <Minus className="h-3 w-3 text-muted-foreground" />,
    used_by: () => <ArrowRight className="h-3 w-3 text-chart-1" />,
    mentioned_in: () => <ExternalLink className="h-3 w-3 text-chart-3" />,
    validated_by: () => <ArrowUp className="h-3 w-3 text-success" />,
    broken_by: () => <ArrowDown className="h-3 w-3 text-danger" />,
  };
  return (icons[type] || icons.related_to)();
}

export function RelatedItemsPanel({ entity, related, loading, onNavigate }: RelatedItemsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 rounded-lg bg-muted/20 p-2.5">
            <div className="h-6 w-6 rounded bg-muted/40" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 w-3/4 rounded bg-muted/40" />
              <div className="h-2 w-1/2 rounded bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!related.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center px-4">
        <p className="text-xs text-muted-foreground">No related items found for this entity</p>
      </div>
    );
  }

  const grouped = related.reduce<Record<string, RelatedItem[]>>((acc, item) => {
    const key = item.relationship;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-3 p-4">
      {Object.entries(grouped).map(([relationship, items]) => (
        <div key={relationship}>
          <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <RelationshipIcon type={relationship as RelationshipType} />
            {RELATIONSHIP_LABELS[relationship as RelationshipType]}
            <span className="text-muted ml-1">({items.length})</span>
          </p>
          <div className="space-y-1">
            {items.map((item) => (
              <motion.button
                key={`${item.entity.id}-${item.relationship}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onNavigate(item.entity)}
                className="w-full flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-2.5 text-left transition-all hover:bg-background hover:border-border"
              >
                <div
                  className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: ENTITY_COLORS[item.entity.type] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{item.entity.title}</p>
                  <p className="text-3xs text-muted-foreground">{ENTITY_LABELS[item.entity.type]}{item.entity.subtitle ? ` · ${item.entity.subtitle}` : ''}</p>
                  {item.evidence && (
                    <p className="text-3xs text-muted mt-0.5 line-clamp-1">{item.evidence}</p>
                  )}
                </div>
                {item.strength > 0 && (
                  <span className="text-3xs text-muted-foreground shrink-0">{Math.round(item.strength * 100)}%</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
