import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useKnowledgeRules } from '../hooks/useKnowledgeRules';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import type { KnowledgeRule } from '../api/types';

function RuleCard({ rule }: { rule: KnowledgeRule }) {
  const [expanded, setExpanded] = useState(false);

  const wr = rule.win_rate != null ? (rule.win_rate * 100).toFixed(1) : '—';
  const confidence = rule.confidence != null ? rule.confidence.toFixed(1) : '—';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {rule.title}
          </h3>
          {rule.category && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {rule.category}
            </span>
          )}
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
          rule.confidence != null && rule.confidence >= 60
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : rule.confidence != null && rule.confidence >= 30
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          Confidence: {confidence}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-4 text-sm">
        <div className="rounded-md bg-slate-50 p-3 text-center dark:bg-slate-800/50">
          <div className="text-lg font-bold text-slate-900 dark:text-white">{rule.occurrences}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Occurrences</div>
        </div>
        <div className="rounded-md bg-slate-50 p-3 text-center dark:bg-slate-800/50">
          <div className="text-lg font-bold text-green-600">{wr}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Win Rate</div>
        </div>
        <div className="rounded-md bg-slate-50 p-3 text-center dark:bg-slate-800/50">
          <div className="text-lg font-bold text-blue-600">{rule.avg_rr != null ? rule.avg_rr.toFixed(2) : '—'}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Avg R:R</div>
        </div>
        <div className="rounded-md bg-slate-50 p-3 text-center dark:bg-slate-800/50">
          <div className="text-lg font-bold text-purple-600">{rule.expectancy != null ? rule.expectancy.toFixed(2) : '—'}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Expectancy</div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-md bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <span>Details & Evidence</span>
        <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 text-sm">
          {rule.description && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-300">Evidence</h4>
              {rule.description.split('\n').map((line, i) => (
                <p key={i} className="text-slate-600 dark:text-slate-400">{line}</p>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/10">
              <span className="text-xs text-green-600 dark:text-green-400">Wins</span>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">{rule.wins}</div>
            </div>
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/10">
              <span className="text-xs text-red-600 dark:text-red-400">Losses</span>
              <div className="text-lg font-bold text-red-700 dark:text-red-300">{rule.losses}</div>
            </div>
          </div>
          {rule.signature && (
            <div className="rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-600">
              <span className="text-xs text-slate-500 dark:text-slate-400">Signature</span>
              <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">{rule.signature}</p>
            </div>
          )}
          <div className="text-xs text-slate-400">
            Created: {new Date(rule.created_at).toLocaleDateString()} — Updated: {new Date(rule.updated_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: rules, isLoading, error, refetch } = useKnowledgeRules(projectId!);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading knowledge rules." onRetry={refetch} />;
  if (!rules || rules.length === 0) return <EmptyState message="No knowledge rules yet. Create at least 5 similar trades to generate a rule." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Rules"
        description="Reusable trading knowledge derived from historical trade memories."
      />
      <div className="space-y-4">
        {rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
}
