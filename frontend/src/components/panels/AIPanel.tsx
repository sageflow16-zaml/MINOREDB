import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bot, Brain, Settings, Sparkles, BarChart3, ScrollText, TrendingUp, Loader2 } from 'lucide-react';
import { callEdgeFunction } from '../../lib/edgeFunctions';

function useLearningStatus(projectId: string) {
  return useQuery({
    queryKey: ['ai-learning-status', projectId],
    queryFn: () => callEdgeFunction<{
      total_trades: number; total_sources: number; total_claims: number;
      total_concepts: number; total_interpretations: number;
      total_patterns: number; total_market_structures: number;
      last_event: { event_type: string; status: string; created_at: string } | null;
    }>('ai', { operation: 'learning-status', project_id: projectId }),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function AIPanel({ previewMode: _previewMode }: { previewMode?: boolean }) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: status, isLoading } = useLearningStatus(projectId || '');

  if (!projectId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-1 mb-2">
          <Bot className="w-3.5 h-3.5 text-primary-text" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Analyst</h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
          <Brain className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
            Select a project to enable AI-powered market analysis, trade review, and research assistance.
          </p>
          <button onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Select Project
          </button>
        </div>
      </div>
    );
  }

  const hasData = status && (status.total_trades > 0 || status.total_sources > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <Bot className="w-3.5 h-3.5 text-primary-text" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Analyst</h3>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
          <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin" />
          <p className="text-xs text-muted-foreground">Loading intelligence data...</p>
        </div>
      ) : hasData ? (
        <div className="space-y-2 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="px-2 py-1.5 rounded border bg-card/50">
              <div className="text-3xs text-muted-foreground uppercase">Trades</div>
              <div className="text-sm font-semibold">{status!.total_trades}</div>
            </div>
            <div className="px-2 py-1.5 rounded border bg-card/50">
              <div className="text-3xs text-muted-foreground uppercase">Sources</div>
              <div className="text-sm font-semibold">{status!.total_sources}</div>
            </div>
            <div className="px-2 py-1.5 rounded border bg-card/50">
              <div className="text-3xs text-muted-foreground uppercase">Patterns</div>
              <div className="text-sm font-semibold">{status!.total_patterns}</div>
            </div>
            <div className="px-2 py-1.5 rounded border bg-card/50">
              <div className="text-3xs text-muted-foreground uppercase">Concepts</div>
              <div className="text-sm font-semibold">{status!.total_concepts}</div>
            </div>
          </div>
          {status!.last_event && (
            <div className="px-2 py-1.5 rounded border bg-card/50 text-xs">
              <span className="text-muted-foreground">Last event: </span>
              <span className="font-medium">{status!.last_event.event_type}</span>
              <span className="text-muted-foreground ml-1">({status!.last_event.status})</span>
            </div>
          )}
          <div className="flex gap-1.5 pt-1">
            <button onClick={() => navigate(`/projects/${projectId}/research`)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-3 h-3" /> Analyze
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/trades`)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
            >
              <TrendingUp className="w-3 h-3" /> Trades
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
          <ScrollText className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
            No data yet. Import trades or add research sources to start the AI intelligence pipeline.
          </p>
          <button onClick={() => navigate(`/projects/${projectId}/settings`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Project Settings
          </button>
        </div>
      )}
    </div>
  );
}
