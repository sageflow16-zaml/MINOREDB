import { useParams, useNavigate } from 'react-router-dom';
import { Bot, Brain, Settings } from 'lucide-react';

export function AIPanel({ previewMode }: { previewMode?: boolean }) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <Bot className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Analyst</h3>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20 flex-1">
        <Brain className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
          {!projectId
            ? 'Select a project to enable AI-powered market analysis, trade review, and research assistance.'
            : 'AI analysis requires a configured AI provider (OpenAI, Anthropic, or local LLM) and connected market data sources. Enable these in Project Settings.'}
        </p>
        {projectId && (
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
