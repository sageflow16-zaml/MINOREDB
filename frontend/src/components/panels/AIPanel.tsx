import { Bot, Brain, Lock } from 'lucide-react';

export function AIPanel({ previewMode }: { previewMode?: boolean }) {
  if (previewMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-1 mb-2">
          <Bot className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Analyst</h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 flex-1 py-4 px-2 border border-dashed border-border rounded-lg bg-muted/20">
          <Brain className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-2xs text-muted-foreground text-center leading-relaxed">
            AI analysis requires an active project with connected market data sources and a configured AI provider (e.g., OpenAI, Anthropic, or local LLM). Enable these in Project Settings to unlock market structure analysis, trade review, and contextual research.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <Bot className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Analyst</h3>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 flex-1 py-4 px-2 border border-dashed border-border rounded-lg bg-muted/20">
        <Brain className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-2xs text-muted-foreground text-center leading-relaxed">
          AI analysis requires an active project with connected market data sources and a configured AI provider (e.g., OpenAI, Anthropic, or local LLM). Enable these in Project Settings to unlock market structure analysis, trade review, and contextual research.
        </p>
      </div>
    </div>
  );
}
