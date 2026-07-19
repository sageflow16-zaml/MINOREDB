import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useRunResearch, useResearchSession, useResearchHistory } from '../hooks/useResearch';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';

const TOOL_COLORS: Record<string, string> = {
  trade_memory: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  similarity: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  statistics: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  patterns: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  knowledge_rules: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  knowledge_graph: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  macro: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  learning: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  validator: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  report: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    pending: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    planning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function ToolBadge({ tool }: { tool: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TOOL_COLORS[tool] || 'bg-slate-100 text-slate-700'}`}>
      {tool.replace(/_/g, ' ')}
    </span>
  );
}

function TaskList({ tasks }: { tasks: { step: number; tool: string; description: string | null; status: string; evidence_count: number }[] }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.step} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            {task.step}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ToolBadge tool={task.tool} />
              <StatusBadge status={task.status} />
            </div>
            {task.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
            )}
          </div>
          {task.evidence_count > 0 && (
            <span className="shrink-0 text-xs text-slate-400">{task.evidence_count} items</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ReportView({ report }: { report: NonNullable<ReturnType<typeof useResearchSession>['data']>['report'] }) {
  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
        <h3 className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">Summary</h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-200">{report.summary}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Findings</h3>
          <ul className="space-y-1">
            {report.findings.map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Recommendations</h3>
          <ul className="space-y-1">
            {report.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.limitations && report.limitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Limitations</h3>
          <ul className="space-y-1">
            {report.limitations.map((l: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                {l}
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
      {
        onSuccess: (data) => {
          setActiveSessionId(data.session_id);
        },
      },
    );
  };

  const isRunning = runMutation.isPending || (activeSession?.session.status === 'running' || activeSession?.session.status === 'planning');

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader title="Research Engine">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
          V1
        </span>
      </PageHeader>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a research question (e.g. Why has my EURUSD performance decreased since January?)"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          disabled={isRunning}
        />
        <button
          type="submit"
          disabled={isRunning || !question.trim()}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Research'}
        </button>
      </form>

      {runMutation.isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-slate-500">Initializing research session...</p>
          </div>
        </div>
      )}

      {runMutation.isError && (
        <ErrorState message={runMutation.error?.message || 'Error running research. Please try again.'} onRetry={() => { if (!question.trim() || !projectId) return; runMutation.mutate({ projectId, question: question.trim() }); }} />
      )}

      {sessionLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {sessionError && !sessionLoading && (
        <ErrorState message={sessionErr?.message || 'Error loading research session.'} onRetry={() => { if (activeSessionId) setActiveSessionId(activeSessionId); }} />
      )}

      {activeSession && !sessionLoading && !sessionError && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Research Tasks</h3>
                  <p className="mt-1 text-xs text-slate-500">{activeSession.session.question}</p>
                </div>
                <StatusBadge status={activeSession.session.status} />
              </div>
              <TaskList tasks={activeSession.tasks} />
              {activeSession.session.duration && (
                <p className="mt-3 text-xs text-slate-400">
                  Completed in {activeSession.session.duration.toFixed(1)}s
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {activeSession.report && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Research Report</h3>
                <ReportView report={activeSession.report} />
              </div>
            )}
          </div>
        </div>
      )}

      {!activeSession && !sessionLoading && !runMutation.isPending && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Research History</h3>
          {historyLoading ? (
            <LoadingSpinner />
          ) : historyError ? (
            <ErrorState message={historyErr?.message || 'Failed to load research history.'} onRetry={() => refetchHistory()} />
          ) : history.length === 0 ? (
            <EmptyState message="No research sessions yet. Ask a question above to begin." />
          ) : (
            <div className="space-y-2">
              {history.map((s: { id: string; question: string; status: string; duration: number | null; created_at: string }) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-700 dark:text-slate-300">{s.question}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(s.created_at).toLocaleString()}</span>
                    {s.duration && <span>{s.duration.toFixed(1)}s</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
