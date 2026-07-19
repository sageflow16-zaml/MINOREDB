import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { useDecisionCurrent, useDecisionTrade, useDecisionHistory } from '../hooks/useDecision';
import type { DecisionResponse, DecisionEnvironment } from '../api/types';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'];

export default function DecisionPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [env, setEnv] = useState<DecisionEnvironment>({
    pair: '',
    direction: '',
    weekly_bias: '',
    daily_bias: '',
    h4_bias: '',
    market_phase: '',
    trend: '',
    asian_session: false,
    london_session: false,
    newyork_session: false,
    liquidity_sweep: '',
    mss: '',
    fvg: '',
  });

  const [compareMode, setCompareMode] = useState<'current' | 'trade'>('current');
  const [tradeIdInput, setTradeIdInput] = useState('');

  const currentMutation = useDecisionCurrent(projectId!);
  const tradeMutation = useDecisionTrade(projectId!);
  const history = useDecisionHistory(projectId!);

  const result: DecisionResponse | null = currentMutation.data || tradeMutation.data || null;
  const isLoading = currentMutation.isPending || tradeMutation.isPending;
  const isError = currentMutation.isError || tradeMutation.isError;
  const handleRetry = () => {
    if (compareMode === 'current') {
      currentMutation.mutate(env);
    } else if (compareMode === 'trade' && tradeIdInput) {
      tradeMutation.mutate(tradeIdInput);
    }
  };

  const handleEvaluate = () => {
    if (compareMode === 'current') {
      currentMutation.mutate(env);
    } else if (compareMode === 'trade' && tradeIdInput) {
      tradeMutation.mutate(tradeIdInput);
    }
  };

  const conf = result?.confidence;
  const exec = result?.execution;
  const sim = result?.similarity;
  const pat = result?.pattern_match;
  const ma = result?.market_alignment;
  const ict = result?.ict_components;
  const sa = result?.session_alignment;
  const st = result?.statistics;

  const confGaugeData = conf ? [{ name: 'Confidence', value: conf.score, fill: conf.score >= 75 ? '#22c55e' : conf.score >= 50 ? '#f59e0b' : '#ef4444' }] : [];

  const evidenceDist = result ? [
    { name: 'Market', value: ma?.score || 0 },
    { name: 'ICT', value: ict?.score || 0 },
    { name: 'Session', value: sa?.score || 0 },
    { name: 'Pattern', value: pat?.match_score || 0 },
  ] : [];

  const patternContrib = pat && pat.found ? [
    { name: 'Win Rate', value: pat.win_rate },
    { name: 'Confidence', value: pat.confidence },
    { name: 'Match Score', value: pat.match_score },
  ] : [];

  const simTimeline = sim?.top_matches?.slice(0, 10).map((m, i) => ({
    index: i + 1,
    similarity: (m as Record<string, unknown>).similarity_score as number || 0,
    rr: (m as Record<string, unknown>).rr as number || 0,
  })) || [];

  return (
    <div className="space-y-8">
      <PageHeader title="Decision Support" />

      {/* Input */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Evaluate Environment</h2>
        <div className="mb-4 flex gap-2">
          {(['current', 'trade'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCompareMode(mode)}
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                compareMode === mode ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode === 'current' ? 'Current Env' : 'By Trade ID'}
            </button>
          ))}
        </div>

        {compareMode === 'current' && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <SelectField label="Pair" value={env.pair || ''} onChange={(v) => setEnv({ ...env, pair: v })} options={['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF']} />
            <SelectField label="Direction" value={env.direction || ''} onChange={(v) => setEnv({ ...env, direction: v })} options={['BUY', 'SELL']} />
            <SelectField label="Weekly Bias" value={env.weekly_bias || ''} onChange={(v) => setEnv({ ...env, weekly_bias: v })} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
            <SelectField label="Daily Bias" value={env.daily_bias || ''} onChange={(v) => setEnv({ ...env, daily_bias: v })} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
            <SelectField label="H4 Bias" value={env.h4_bias || ''} onChange={(v) => setEnv({ ...env, h4_bias: v })} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
            <SelectField label="Market Phase" value={env.market_phase || ''} onChange={(v) => setEnv({ ...env, market_phase: v })} options={['ACCUMULATION', 'MARKUP', 'DISTRIBUTION', 'MARKDOWN']} />
            <SelectField label="Trend" value={env.trend || ''} onChange={(v) => setEnv({ ...env, trend: v })} options={['UPTREND', 'DOWNTREND', 'RANGING']} />
            <SelectField label="Liquidity Sweep" value={env.liquidity_sweep || ''} onChange={(v) => setEnv({ ...env, liquidity_sweep: v })} options={['YES', 'NO']} />
            <SelectField label="MSS" value={env.mss || ''} onChange={(v) => setEnv({ ...env, mss: v })} options={['YES', 'NO']} />
            <SelectField label="FVG" value={env.fvg || ''} onChange={(v) => setEnv({ ...env, fvg: v })} options={['YES', 'NO']} />
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-slate-500">Sessions</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={env.asian_session || false} onChange={(e) => setEnv({ ...env, asian_session: e.target.checked })} /> Asian</label>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={env.london_session || false} onChange={(e) => setEnv({ ...env, london_session: e.target.checked })} /> London</label>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={env.newyork_session || false} onChange={(e) => setEnv({ ...env, newyork_session: e.target.checked })} /> NY</label>
              </div>
            </div>
          </div>
        )}

        {compareMode === 'trade' && (
          <div className="flex gap-4">
            <input type="text" placeholder="Trade ID (UUID)" value={tradeIdInput} onChange={(e) => setTradeIdInput(e.target.value)} className="flex-1 rounded border px-3 py-2 text-sm" />
          </div>
        )}

        <button onClick={handleEvaluate} disabled={isLoading || (compareMode === 'trade' && !tradeIdInput)} className="mt-4 rounded bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {isLoading ? 'Evaluating...' : 'Evaluate'}
        </button>
      </div>

      {isError && <ErrorState message="Error running decision evaluation." onRetry={handleRetry} />}

      {/* Confidence & Execution */}
      {result && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Confidence Gauge */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Confidence Score</h3>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width={160} height={160}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={confGaugeData} startAngle={180} endAngle={0}>
                    <RadialBar dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div>
                  <div className="text-4xl font-bold" style={{ color: conf?.score ? (conf.score >= 75 ? '#22c55e' : conf.score >= 50 ? '#f59e0b' : '#ef4444') : '#94a3b8' }}>
                    {conf?.score || 0}
                  </div>
                  <div className="text-sm text-slate-500">{conf?.level || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Execution Conditions */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Execution Conditions</h3>
              <div className={`mb-4 rounded-lg px-4 py-3 text-center text-lg font-bold ${
                exec?.status === 'SATISFIED' ? 'bg-green-100 text-green-800'
                : exec?.status === 'PARTIALLY_SATISFIED' ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
              }`}>
                {exec?.status?.replace('_', ' ') || 'NOT EVALUATED'}
              </div>
              <div className="space-y-2">
                {exec?.criteria.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${c.met ? 'bg-green-500' : 'bg-red-500'}`} />
                      {c.name}
                    </span>
                    <span className={c.met ? 'text-green-600' : 'text-red-600'}>{c.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard title="Market Alignment" value={`${ma?.score || 0}%`} />
            <StatCard title="Similar Trades" value={String(sim?.matches_found || 0)} />
            <StatCard title="Hist. Win Rate" value={`${sim?.average_win_rate || 0}%`} />
            <StatCard title="Hist. RR" value={(sim?.average_rr || 0).toFixed(2)} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Evidence Distribution */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Evidence Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={evidenceDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pattern Contribution */}
            {patternContrib.length > 0 ? (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Pattern Contribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={patternContrib}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Pattern Match</h3>
                <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
                  No matching pattern found
                </div>
              </div>
            )}
          </div>

          {/* Similarity Timeline */}
          {simTimeline.length > 0 && (
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Similarity Timeline</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={simTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="similarity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Explanation */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Explanation</h3>
            <div className="space-y-1">
              {result.explanation.map((line, i) => (
                <p key={i} className="text-sm text-slate-600">{line}</p>
              ))}
            </div>
          </div>

          {/* Pattern Detail */}
          {pat?.found && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Matched Pattern</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div><span className="text-xs text-slate-500">Name</span><div className="font-medium">{pat.name}</div></div>
                <div><span className="text-xs text-slate-500">Win Rate</span><div className="font-medium">{pat.win_rate}%</div></div>
                <div><span className="text-xs text-slate-500">Expectancy</span><div className="font-medium">{pat.expectancy}</div></div>
                <div><span className="text-xs text-slate-500">Occurrences</span><div className="font-medium">{pat.occurrences}</div></div>
                <div><span className="text-xs text-slate-500">Avg RR</span><div className="font-medium">{pat.avg_rr}</div></div>
                <div><span className="text-xs text-slate-500">Profit Factor</span><div className="font-medium">{pat.profit_factor}</div></div>
                <div><span className="text-xs text-slate-500">Confidence</span><div className="font-medium">{pat.confidence}%</div></div>
                <div><span className="text-xs text-slate-500">Match Score</span><div className="font-medium">{pat.match_score}%</div></div>
              </div>
            </div>
          )}

          {/* Statistics Summary */}
          {st && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Statistics Summary</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div><span className="text-xs text-slate-500">Overall Win Rate</span><div className="font-medium">{st.overall_win_rate}%</div></div>
                <div><span className="text-xs text-slate-500">Avg RR</span><div className="font-medium">{st.overall_avg_rr}</div></div>
                <div><span className="text-xs text-slate-500">Expectancy</span><div className="font-medium">{st.overall_expectancy}</div></div>
                <div><span className="text-xs text-slate-500">Total Trades</span><div className="font-medium">{st.overall_total_trades}</div></div>
                <div><span className="text-xs text-slate-500">Profit Factor</span><div className="font-medium">{st.overall_profit_factor}</div></div>
                <div><span className="text-xs text-slate-500">Max Drawdown</span><div className="font-medium">{st.overall_max_drawdown}</div></div>
              </div>
            </div>
          )}
        </>
      )}

      {result && !result.market_alignment.score && !result.similarity.matches_found && (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No historical data available. Add trades and market structure to enable decision support.</p>
        </div>
      )}

      {/* History */}
      {history.data && history.data.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Evaluations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">RR</th>
                  <th className="px-4 py-3">PnL</th>
                  <th className="px-4 py-3">Alignment</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.data.map((h) => (
                  <tr key={h.trade_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{h.pair || '—'}</td>
                    <td className="px-4 py-3">{h.direction || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        h.result === 'WIN' ? 'bg-green-100 text-green-800'
                        : h.result === 'LOSS' ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                      }`}>
                        {h.result || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{h.rr != null ? h.rr.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={h.pnl != null && h.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {h.pnl != null ? h.pnl.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{h.market_alignment}%</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-medium text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Any</option>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}
