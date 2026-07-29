import { SourceRead } from '../types';

export const SourceDrawer = ({ source, onClose }: { source: SourceRead | null; onClose: () => void }) => {
  if (!source) {
    return (
      <div className="fixed inset-0 bg-black/50 z-40 flex justify-end">
        <div className="bg-card text-card-foreground w-full max-w-lg p-6 shadow-xl overflow-y-auto border-l border-border">
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-bold">Source Details</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">Close</button>
          </div>
          <p className="text-sm text-muted">No source selected.</p>
        </div>
      </div>
    );
  }
  const meta = source.source_metadata ?? {};
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex justify-end">
      <div className="bg-card text-card-foreground w-full max-w-lg p-6 shadow-xl overflow-y-auto border-l border-border">
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-bold">Source Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">Close</button>
        </div>
        <div className="space-y-4">
          <div><h4 className="font-semibold">Raw Text</h4><pre className="text-xs bg-muted p-2 rounded">{source.raw_text}</pre></div>
          <div><h4 className="font-semibold">Normalized Text</h4><pre className="text-xs bg-muted p-2 rounded">{source.normalized_text}</pre></div>
          <div><h4 className="font-semibold">Metadata</h4><pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(meta, null, 2)}</pre></div>
        </div>
      </div>
    </div>
  );
};
