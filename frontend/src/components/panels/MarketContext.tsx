import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Radio, Settings } from 'lucide-react';

export function MarketContext({ previewMode }: { previewMode?: boolean }) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <Globe className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Research Context</h3>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
        <Radio className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
          {!projectId
            ? 'Select a project to access correlated instruments, economic data, regime detection, and market news.'
            : 'Market context populates automatically once a project with live data sources is connected. No simulated data is displayed.'}
        </p>
        {!projectId ? (
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Select Project
          </button>
        ) : (
          <button
            onClick={() => navigate(`/projects/${projectId}/settings`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Project Settings
          </button>
        )}
      </div>
    </div>
  );
}
