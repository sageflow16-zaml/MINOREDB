import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRunResearch, useResearchSession, useResearchHistory } from '../hooks/useResearch';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { Sparkles, Send, History, Clock, CheckCircle2, XCircle, AlertCircle, BarChart3, Brain, LineChart, BookOpen, Network, Globe, Layers, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const TOOL_COLORS: Record<string, string> = {
  trade_memory: 'bg-chart-1/10 text-chart-1',
  similarity: 'bg-chart-2/10 text-chart-2',
  statistics: 'bg-chart-1/10 text-chart-1',
  patterns: 'bg-chart-3/10 text-chart-3',
  knowledge_rules: 'bg-chart-4/10 text-chart-4',
  knowledge_graph: 'bg-chart-3/10 text-chart-3',
  macro: 'bg-chart-5/10 text-chart-5',
  learning: 'bg-muted text-muted-foreground',
  validator: 'bg-warning/10 text-warning',
  report: 'bg-success/10 text-success',
};

const TOOL_ICONS: Record<string, typeof Brain> = {
  trade_memory: Brain,
  similarity: LineChart,
  statistics: BarChart3,
  patterns: BarChart3,
  knowledge_rules: BookOpen,
  knowledge_graph: Network,
  macro: Globe,
  learning: Layers,
  validator: AlertCircle,
  report: CheckCircle2,
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-success/10 text-success border-success/20',
    running: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    pending: 'bg-muted text-muted-foreground border-border',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
    planning: 'bg-warning/10 text-warning border-warning/20',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', styles[status] || styles.pending)}>
      {status === 'running' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {status}
    </span>
  );
}

function ToolBadge({ tool }: { tool: string }) {
  const Icon = TOOL_ICONS[tool];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', TOOL_COLORS[tool] || 'bg-muted text-muted-foreground')}>
      {Icon && <Icon className="h-3 w-3" />}
      {tool.replace(/_/g, ' ')}
    </span>
  );
}

function TaskList({ tasks }: { tasks: { step: number; tool: string; description: string | null; status: string; evidence_count: number }[] }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.step} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <span className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            task.status === 'completed' ? 'bg-success/10 text-success' :
            task.status === 'failed' ? 'bg-destructive/10 text-destructive' :
            task.status === 'running' ? 'bg-chart-1/10 text-chart-1' :
            'bg-muted text-muted-foreground'
          )}>
            {task.step}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ToolBadge tool={task.tool} />
              <StatusBadge status={task.status} />
            </div>
            {task.description && (
              <p className="mt-1 text-[11px] text-muted-foreground">{task.description}</p>
            )}
          </div>
          {task.evidence_count > 0 && (
            <span className="shrink-0 text-[10px] text-muted-foreground">{task.evidence_count} items</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ReportView({ report }: { report: NonNullable<ReturnType<typeof useResearchSession>['data']>['report'] }) {
  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-success/20 bg-success/5 p-4">
        <h3 className="mb-2 text-xs font-semibold text-success">Summary</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{report.summary}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-success">
            Confidence: {report.confidence ?? 'N/A'}%
          </span>
          {report.sources && report.sources.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {report.sources.map((s: string) => (
                <ToolBadge key={s} tool={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      {report.findings && report.findings.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold text-foreground">Findings</h3>
          <ul className="space-y-1">
            {report.findings.map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-chart-1" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold text-foreground">Recommendations</h3>
          <ul className="space-y-1">
            {report.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [question, setQuestion] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const runMutation = useRunResearch();
  const { data: activeSession, isLoading: sessionLoading, isError: sessionError, error: sessionErr } = useResearchSession(projectId!, activeSessionId);
  const { data: history = [], isLoading: historyLoading, isError: historyError, error: historyErr, refetch: refetchHistory } = useResearchHistory(projectId!);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !projectId) return;
    setActiveSessionId(null);
    runMutation.mutate(
      { projectId, question: question.trim() },
      { onSuccess: (data) => setActiveSessionId(data.session_id) },
    );
  };

  const isRunning = runMutation.isPending || (activeSession?.session.status === 'running' || activeSession?.session.status === 'planning');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Engine"
        description="Ask questions and let AI analyze your trading data"
      />

      {/* Search Input */}
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a research question..."
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isRunning}
              />
            </div>
            <Button type="submit" disabled={isRunning || !question.trim()} isLoading={runMutation.isPending}>
              <Send className="mr-1.5 h-4 w-4" /> Research
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Running state */}
      {runMutation.isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-xs text-muted-foreground">Initializing research session...</p>
          </div>
        </div>
      )}

      {runMutation.isError && (
        <ErrorState message={runMutation.error?.message || 'Error running research.'} onRetry={() => handleSubmit} />
      )}

      {/* Active Session */}
      {sessionLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {sessionError && !sessionLoading && (
        <ErrorState message={sessionErr?.message || 'Error loading research session.'} onRetry={() => setActiveSessionId(activeSessionId)} />
      )}

      {activeSession && !sessionLoading && !sessionError && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Research Tasks</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">{activeSession.session.question}</p>
                </div>
                <StatusBadge status={activeSession.session.status} />
              </CardHeader>
              <CardContent>
                <TaskList tasks={activeSession.tasks} />
                {activeSession.session.duration && (
                  <p className="mt-3 text-[10px] text-muted-foreground">
                    Completed in {activeSession.session.duration.toFixed(1)}s
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {activeSession.report && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Research Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportView report={activeSession.report} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {!activeSession && !sessionLoading && !runMutation.isPending && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Research History</CardTitle>
            </div>
            <Badge variant="secondary" size="sm">{history.length}</Badge>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <LoadingSpinner />
            ) : historyError ? (
              <ErrorState message={historyErr?.message || 'Failed to load history.'} onRetry={() => refetchHistory()} />
            ) : history.length === 0 ? (
              <EmptyState title="No research sessions yet" description="Ask a question above to begin." icon={<Brain className="h-6 w-6" />} />
            ) : (
              <div className="space-y-2">
                {history.map((s: { id: string; question: string; status: string; duration: number | null; created_at: string }) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className="w-full rounded-lg border border-border bg-card p-3 text-left text-xs transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-foreground font-medium">{s.question}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.created_at).toLocaleString()}
                      </span>
                      {s.duration && <span>{s.duration.toFixed(1)}s</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
