import { X } from 'lucide-react';
import { Button } from '../ui/Button';

export const DetailsDrawer = ({ node, onClose }: { node: any; onClose: () => void }) => {
  if (!node) return null;
  const { data } = node;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background shadow-2xl p-5 z-50 border-l border-border overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">Node Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">ID</span>
          <span className="text-xs font-mono text-foreground">{node.id}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Type</span>
          <span className="text-xs font-medium text-foreground">{data.type}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Label</span>
          <span className="text-xs font-medium text-foreground">{data.label}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Created</span>
          <span className="text-xs font-medium text-foreground">{data.created_at || 'N/A'}</span>
        </div>
        {data.meta && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Metadata</h4>
            <pre className="text-caption p-3 bg-muted/30 rounded-lg text-muted-foreground overflow-x-auto leading-relaxed">
              {JSON.stringify(data.meta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
