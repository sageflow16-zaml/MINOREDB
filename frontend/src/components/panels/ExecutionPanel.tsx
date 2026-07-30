import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { tradeService } from '../../api';

export function ExecutionPanel() {
  const { state } = useWorkspace();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const previewMode = state.layout.previewMode;

  const { data: trades, isLoading, error } = useQuery({
    queryKey: ['trades-preview', projectId],
    queryFn: () => tradeService.list(projectId!).then(t => t.slice(0, 5)),
    enabled: !!projectId && !previewMode,
  });

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <Wallet className="w-3.5 h-3.5" /> Execution
      </h3>
      {!projectId ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20">
          <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
            Select a project to view recent trades and execution history.
          </p>
          <button onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" />
            Select Project
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20">
          <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin" />
          <p className="text-xs text-muted-foreground">Loading trades...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20">
          <AlertTriangle className="w-8 h-8 text-amber-500/60" />
          <p className="text-xs text-muted-foreground text-center max-w-[240px]">
            {(error as Error)?.message || 'Failed to load trades.'}
          </p>
        </div>
      ) : trades && trades.length > 0 ? (
        <div className="space-y-1">
          {trades.map((t) => (
            <div key={t.id} className="px-2 py-1.5 rounded border bg-card/50 text-xs">
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium">{t.pair || 'N/A'}</span>
                <span className={`text-3xs font-medium ${
                  t.result === 'win' ? 'text-success' : t.result === 'loss' ? 'text-destructive' : 'text-muted-foreground'
                }`}>{t.result || 'open'}</span>
              </div>
              <div className="flex items-center justify-between text-3xs text-muted-foreground mt-0.5">
                <span>{t.direction} {t.entry_price != null ? `@ ${t.entry_price}` : ''}</span>
                <span>{t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}${t.pnl}` : ''} {t.rr != null ? `R:${t.rr}` : ''}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-1.5 pt-1">
            <button onClick={() => navigate(`/projects/${projectId}/trades`)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <TrendingUp className="w-3 h-3" /> All Trades
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/trades/new`)}
              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20">
          <Plus className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
            No trades recorded yet. Track your first trade to start building your trading journal.
          </p>
          <button onClick={() => navigate(`/projects/${projectId}/trades/new`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Trade
          </button>
        </div>
      )}
    </div>
  );
}
