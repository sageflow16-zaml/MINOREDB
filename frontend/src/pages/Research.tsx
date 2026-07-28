import { useParams } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRunResearch, useResearchSession, useResearchHistory } from '../hooks/useResearch';
import type { ResearchSession } from '../api/types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import {
  Sparkles, History, Clock, CheckCircle, AlertCircle,
  BarChart3, Brain, LineChart, BookOpen, Network, Globe, Layers,
  Lightbulb, Target, Award, ChevronRight,
} from 'lucide-react';

const TOOL_COLORS: Record<string, string> = {
  trade_memory: 'bg-[#4F46E5]/10 text-[#4F46E5]',
  similarity: 'bg-[#22C55E]/10 text-[#22C55E]',
  statistics: 'bg-[#4F46E5]/10 text-[#4F46E5]',
  patterns: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  knowledge_rules: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  knowledge_graph: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  macro: 'bg-[#A1A1AA]/10 text-[#A1A1AA]',
  learning: 'bg-[#71717A]/10 text-[#71717A]',
  validator: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  report: 'bg-[#22C55E]/10 text-[#22C55E]',
};

const TOOL_ICONS: Record<string, typeof Brain> = {
  trade_memory: Brain, similarity: LineChart, statistics: BarChart3, patterns: BarChart3,
  knowledge_rules: BookOpen, knowledge_graph: Network, macro: Globe, learning: Layers,
  validator: AlertCircle, report: CheckCircle,
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20',
    running: 'bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20',
    pending: 'bg-[#111113] text-[#71717A] border-[#27272A]',
    failed: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    planning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
  };
  return (<span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', styles[status] || styles.pending)}>{status === 'running' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}{status}</span>);
}

function ToolBadge({ tool }: { tool: string }) {
  const Icon = TOOL_ICONS[tool];
  return (<span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', TOOL_COLORS[tool] || 'bg-[#111113] text-[#71717A]')}>{Icon && <Icon className="h-3 w-3" />}{tool.replace(/_/g, ' ')}</span>);
}

function ReportView({ report }: { report: any }) {
  if (!report) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 p-5">
        <h3 className="text-xs font-semibold text-[#22C55E] mb-2">Summary</h3>
        <p className="text-xs text-[#A1A1AA] leading-relaxed">{report.summary}</p>
        <div className="mt-3 flex items-center gap-2"><span className="text-xs font-medium text-[#22C55E]">Confidence: {report.confidence ?? 'N/A'}%</span></div>
      </div>
      {report.findings && report.findings.length > 0 && (
        <div><h3 className="text-xs font-semibold text-[#FAFAFA] mb-2">Findings</h3>
          <ul className="space-y-1">{report.findings.map((f: string, i: number) => (<li key={i} className="flex items-start gap-2 text-xs text-[#A1A1AA]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F46E5]" />{f}</li>))}</ul>
        </div>
      )}
      {report.recommendations && report.recommendations.length > 0 && (
        <div><h3 className="text-xs font-semibold text-[#FAFAFA] mb-2 flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5 text-[#F59E0B]" />Recommendations</h3>
          <ul className="space-y-1">{report.recommendations.map((r: string, i: number) => (<li key={i} className="flex items-start gap-2 text-xs text-[#A1A1AA]"><Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />{r}</li>))}</ul>
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
  const { data: activeSession, isLoading: sessionLoading, isError: sessionError, error: sessionErr, refetch: sessionRefetch } = useResearchSession(projectId!, activeSessionId);
  const { data: history = [], isLoading: historyLoading, isError: historyError, error: historyErr, refetch: refetchHistory } = useResearchHistory(projectId!);

  const runResearch = useCallback(() => {
    if (!question.trim() || !projectId) return;
    setActiveSessionId(null);
    runMutation.mutate({ projectId, question: question.trim() }, { onSuccess: (data) => setActiveSessionId(data.session_id) });
  }, [question, projectId, runMutation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runResearch();
  };

  const isRunning = runMutation.isPending || (activeSession?.session.status === 'running' || activeSession?.session.status === 'planning');

  if (historyLoading && history.length === 0) {
    return (
      <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-52" /></div><Skeleton className="h-8 w-28 rounded-lg" /></div>
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5]/10"><Brain className="h-5 w-5 text-[#4F46E5]" /></div>
          <div><h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Research</h1><p className="text-sm text-[#71717A] mt-0.5">AI-powered research engine</p></div>
        </div>
      </motion.div>

      {/* Search Input */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
            <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a research question..." className="h-10 pl-9" disabled={isRunning} />
          </div>
          <Button type="submit" disabled={isRunning || !question.trim()}>{runMutation.isPending ? 'Researching...' : 'Research'}</Button>
        </form>
      </motion.div>

      {/* Running state */}
      {runMutation.isPending && (
        <div className="flex items-center justify-center py-12"><div className="text-center"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" /><div className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" style={{ animationDelay: '0.2s' }} /><div className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" style={{ animationDelay: '0.4s' }} /></div><p className="mt-3 text-xs text-[#71717A]">Initializing research session...</p></div></div>
      )}

      {runMutation.isError && (
        <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#EF4444]"><AlertCircle className="h-4 w-4" />{runMutation.error?.message || 'Error running research'}</div>
          <Button variant="ghost" size="sm" onClick={runResearch}>Retry</Button>
        </div>
      )}

      {/* Active Session */}
      {sessionLoading && <div className="flex items-center justify-center py-12"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" /><div className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" style={{ animationDelay: '0.2s' }} /><div className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" style={{ animationDelay: '0.4s' }} /></div></div>}

      {sessionError && !sessionLoading && (
        <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#EF4444]"><AlertCircle className="h-4 w-4" />{sessionErr?.message || 'Error loading session'}</div>
          <Button variant="ghost" size="sm" onClick={() => sessionRefetch()}>Retry</Button>
        </div>
      )}

      {activeSession && !sessionLoading && !sessionError && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-sm font-medium text-[#FAFAFA]">Research Tasks</h3><p className="text-xs text-[#71717A] mt-0.5">{activeSession.session.question}</p></div>
                <StatusBadge status={activeSession.session.status} />
              </div>
              <div className="space-y-2">
                {activeSession.tasks.map((task: any) => (
                  <div key={task.step} className="flex items-start gap-3 rounded-lg bg-[#111113] p-3">
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', task.status === 'completed' ? 'bg-[#22C55E]/10 text-[#22C55E]' : task.status === 'failed' ? 'bg-[#EF4444]/10 text-[#EF4444]' : task.status === 'running' ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'bg-[#27272A] text-[#71717A]')}>{task.step}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><ToolBadge tool={task.tool} /><StatusBadge status={task.status} /></div>
                      {task.description && <p className="mt-1 text-[11px] text-[#71717A]">{task.description}</p>}
                    </div>
                    {task.evidence_count > 0 && <span className="shrink-0 text-[10px] text-[#71717A]">{task.evidence_count} items</span>}
                  </div>
                ))}
              </div>
              {activeSession.session.duration && <p className="mt-3 text-[10px] text-[#71717A]">Completed in {activeSession.session.duration.toFixed(1)}s</p>}
            </div>
          </div>

          <div className="space-y-4">
            {activeSession.report && (
              <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
                <h3 className="text-sm font-medium text-[#FAFAFA] mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-[#71717A]" />Research Report</h3>
                <ReportView report={activeSession.report} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {!activeSession && !sessionLoading && !runMutation.isPending && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-[#71717A]" /><h3 className="text-sm font-medium text-[#FAFAFA]">Research History</h3><Badge variant="secondary" size="sm">{history.length}</Badge></div>
          </div>
          {historyError ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#EF4444]/5"><span className="text-xs text-[#EF4444]">{historyErr?.message || 'Failed to load history'}</span><Button variant="ghost" size="sm" onClick={() => refetchHistory()}>Retry</Button></div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><Brain className="h-5 w-5 text-[#71717A]" /></div>
              <p className="text-sm text-[#A1A1AA]">No research yet</p>
              <p className="text-xs text-[#71717A] mt-1">Ask a question above to begin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((s: ResearchSession) => (
                <button key={s.id} onClick={() => setActiveSessionId(s.id)}
                  className="w-full flex items-center justify-between rounded-lg bg-[#111113] px-4 py-3 text-left transition-all hover:bg-[#18181B]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-xs font-medium text-[#FAFAFA] truncate">{s.question}</span><StatusBadge status={s.status} /></div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#71717A]"><Clock className="h-3 w-3" />{s.created_at ? new Date(s.created_at).toLocaleString() : ''}{s.duration ? <span>{s.duration.toFixed(1)}s</span> : null}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#71717A] shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
