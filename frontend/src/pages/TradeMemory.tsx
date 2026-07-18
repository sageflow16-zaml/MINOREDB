import { useParams } from 'react-router-dom';
import { useTradeMemories } from '../hooks/useTradeMemory';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';

export default function TradeMemoryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: memories, isLoading, error } = useTradeMemories(projectId!);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading trade memories." />;
  if (!memories || memories.length === 0) return <EmptyState message="No trade memories yet. Create a trade to generate one." />;

  return (
    <div className="space-y-6">
      <PageHeader title="AI Memory Engine" description="Structured learning memories generated from every trade." />
      <div className="space-y-8">
        {memories.map((m) => (
          <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {m.pair || "Unknown"} — {m.direction || "N/A"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {m.session && `Session: ${m.session.replace(/_/g, ' / ')}`}
                  {m.created_at && ` — ${new Date(m.created_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {m.confidence != null && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Confidence: {m.confidence}%
                  </span>
                )}
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  m.result === 'WIN' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  m.result === 'LOSS' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {m.result || 'OPEN'}
                </span>
              </div>
            </div>

            {m.summary && (
              <div className="mb-4 rounded-md bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="text-sm text-slate-700 dark:text-slate-300">{m.summary}</p>
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-slate-500 dark:text-slate-400">R:R:</span> {m.rr != null ? m.rr.toFixed(2) : '—'}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">P&L:</span> {m.pnl != null ? m.pnl.toFixed(2) : '—'}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Risk:</span> {m.risk_percent != null ? `${m.risk_percent.toFixed(2)}%` : '—'}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Entry Model:</span> {m.entry_model || '—'}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Execution:</span> {m.execution_model || '—'}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Liquidity:</span> {m.liquidity_type || '—'}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Market Phase:</span> {m.market_phase || '—'}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Market Trend:</span> {m.market_trend || '—'}</div>
              {m.similarity_score != null && (
                <div><span className="font-medium text-slate-500 dark:text-slate-400">Similarity:</span> {m.similarity_score}%</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {m.strengths && m.strengths.length > 0 && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10">
                  <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">Strengths</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-green-700 dark:text-green-400">
                    {m.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {m.weaknesses && m.weaknesses.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10">
                  <h4 className="mb-2 text-sm font-semibold text-red-800 dark:text-red-300">Weaknesses</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-400">
                    {m.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              {m.mistakes && m.mistakes.length > 0 && (
                <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/30 dark:bg-orange-900/10">
                  <h4 className="mb-2 text-sm font-semibold text-orange-800 dark:text-orange-300">Mistakes</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-orange-700 dark:text-orange-400">
                    {m.mistakes.map((mist, i) => <li key={i}>{mist}</li>)}
                  </ul>
                </div>
              )}
              {m.lessons && m.lessons.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <h4 className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-300">Lessons</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    {m.lessons.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {m.tags && m.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {m.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
