import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Globe, Radio, Settings, Calendar, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { macroService } from '../../api/macro';

export function MarketContext({ previewMode }: { previewMode?: boolean }) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['macro-events', projectId, 10],
    queryFn: () => macroService.events(projectId!, 10),
    enabled: !!projectId && !previewMode,
    refetchInterval: 120_000,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <Globe className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Research Context</h3>
      </div>
      {!projectId ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
          <Radio className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
            Select a project to access correlated instruments, economic data, regime detection, and market news.
          </p>
          <button onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Select Project
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
          <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin" />
          <p className="text-xs text-muted-foreground">Loading economic data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
          <AlertTriangle className="w-8 h-8 text-amber-500/60" />
          <p className="text-xs text-muted-foreground text-center max-w-[260px]">
            {(error as Error)?.message || 'Failed to load market context.'}
          </p>
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-1 flex-1 overflow-y-auto">
          {events.slice(0, 6).map((ev) => (
            <div key={ev.id} className="px-2 py-1.5 rounded border bg-card/50 text-xs">
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium truncate">{ev.title}</span>
                <span className={`shrink-0 text-3xs px-1 rounded ${
                  (ev.importance ?? 0) >= 4 ? 'bg-destructive/10 text-destructive' :
                  (ev.importance ?? 0) >= 3 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                }`}>{ev.importance ?? 0}</span>
              </div>
              <div className="text-3xs text-muted-foreground mt-0.5">
                {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : ''}
                {ev.country ? ` · ${ev.country}` : ''}
                {ev.category ? ` · ${ev.category}` : ''}
              </div>
              {(ev.actual != null || ev.forecast != null) && (
                <div className="flex gap-2 mt-0.5 text-3xs text-muted-foreground">
                  {ev.actual != null && <span>Actual: {ev.actual}</span>}
                  {ev.forecast != null && <span>Forecast: {ev.forecast}</span>}
                </div>
              )}
            </div>
          ))}
          <div className="pt-1">
            <button onClick={() => macroService.refresh(projectId!)}
              className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Data
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
          <Calendar className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[260px]">
            No economic events loaded. Run the economic calendar collector to populate market context data.
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
