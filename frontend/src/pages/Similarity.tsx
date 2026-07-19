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
  LineChart,
  Line,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import {
  useSimilarityCurrent,
  useSimilarityTrade,
  useSimilarityPattern,
  useSimilarityHistory,
} from '../hooks/useSimilarity';
import type { SimilarityResponse, SimilarityEnvironment } from '../api/types';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'];

export default function SimilarityPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [env, setEnv] = useState<SimilarityEnvironment>({
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

  const [compareMode, setCompareMode] = useState<'current' | 'trade' | 'pattern'>('current');
  const [tradeIdInput, setTradeIdInput] = useState('');
  const [patternIdInput, setPatternIdInput] = useState('');

  const currentMutation = useSimilarityCurrent(projectId!);
  const tradeMutation = useSimilarityTrade(projectId!);
  const patternMutation = useSimilarityPattern(projectId!);
  const history = useSimilarityHistory(projectId!);

  const result: SimilarityResponse | null =
    currentMutation.data || tradeMutation.data || patternMutation.data || null;

  const isLoading = currentMutation.isPending || tradeMutation.isPending || patternMutation.isPending;
  const isError = currentMutation.isError || tradeMutation.isError || patternMutation.isError;

  const handleCompare = () => {
    if (compareMode === 'current') {
      currentMutation.mutate(env);
    } else if (compareMode === 'trade' && tradeIdInput) {
      tradeMutation.mutate(tradeIdInput);
    } else if (compareMode === 'pattern' && patternIdInput) {
      patternMutation.mutate(patternIdInput);
    }
  };

  const matches = result?.matches || [];
  const summary = result?.summary;

  const winCount = matches.filter((m) => m.trade_result === 'WIN').length;
  const lossCount = matches.filter((m) => m.trade_result === 'LOSS').length;
  const beCount = matches.filter((m) => m.trade_result === 'BE').length;

  const resultPieData = [
    { name: 'WIN', value: winCount },
    { name: 'LOSS', value: lossCount },
    { name: 'BE', value: beCount },
  ].filter((d) => d.value > 0);

  const rrData = matches
    .filter((m) => m.rr != null)
    .map((m, i) => ({ index: i + 1, rr: m.rr, similarity: m.similarity_score }));

  const simDistData = (() => {
    const buckets = [
      { range: '0-20%', count: 0 },
      { range: '20-40%', count: 0 },
      { range: '40-60%', count: 0 },
      { range: '60-80%', count: 0 },
      { range: '80-100%', count: 0 },
    ];
    for (const m of matches) {
      const s = m.similarity_score;
      if (s < 20) buckets[0].count++;
      else if (s < 40) buckets[1].count++;
      else if (s < 60) buckets[2].count++;
      else if (s < 80) buckets[3].count++;
      else buckets[4].count++;
    }
    return buckets;
  })();

  const winRateBySim = (() => {
    const groups: Record<string, { wins: number; total: number }> = {};
    for (const m of matches) {
      const bucket =
        m.similarity_score >= 80 ? '80-100%'
        : m.similarity_score >= 60 ? '60-80%'
        : m.similarity_score >= 40 ? '40-60%'
        : '0-40%';
      if (!groups[bucket]) groups[bucket] = { wins: 0, total: 0 };
      groups[bucket].total++;
      if (m.trade_result === 'WIN') groups[bucket].wins++;
    }
    return Object.entries(groups)
      .map(([range, v]) => ({
        range,
        win_rate: v.total > 0 ? Math.round((v.wins / v.total) * 100) : 0,
        count: v.total,
      }))
      .sort((a, b) => b.range.localeCompare(a.range));
  })();

  return (
    <div className="space-y-8">
      <PageHeader title="Similarity Engine" />

      {/* Environment Input */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Current Environment</h2>

        <div className="mb-4 flex gap-2">
          {(['current', 'trade', 'pattern'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCompareMode(mode)}
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                compareMode === mode
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode === 'current' ? 'Current Env' : mode === 'trade' ? 'By Trade' : 'By Pattern'}
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
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={env.asian_session || false} onChange={(e) => setEnv({ ...env, asian_session: e.target.checked })} />
                  Asian
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={env.london_session || false} onChange={(e) => setEnv({ ...env, london_session: e.target.checked })} />
                  London
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={env.newyork_session || false} onChange={(e) => setEnv({ ...env, newyork_session: e.target.checked })} />
                  NY
                </label>
              </div>
            </div>
          </div>
        )}

        {compareMode === 'trade' && (
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Trade ID (UUID)"
              value={tradeIdInput}
              onChange={(e) => setTradeIdInput(e.target.value)}
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
          </div>
        )}

        {compareMode === 'pattern' && (
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Pattern ID (UUID)"
              value={patternIdInput}
              onChange={(e) => setPatternIdInput(e.target.value)}
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={isLoading || (compareMode === 'trade' && !tradeIdInput) || (compareMode === 'pattern' && !patternIdInput)}
          className="mt-4 rounded bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading ? 'Comparing...' : 'Find Similar Trades'}
        </button>
      </div>

      {isError && <ErrorState message="Error running similarity comparison." />}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Matches Found" value={summary.matches_found} />
          <StatCard title="Avg Win Rate" value={`${summary.average_win_rate}%`} />
          <StatCard title="Avg RR" value={summary.average_rr.toFixed(2)} />
          <StatCard title="Avg PnL" value={summary.average_pnl.toFixed(2)} />
        </div>
      )}

      {/* Charts Row */}
      {matches.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Similarity Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={simDistData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Historical RR by Match</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rrData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rr" stroke="#22c55e" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Win Rate by Similarity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={winRateBySim}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="win_rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Result Pie */}
      {resultPieData.length > 0 && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Result Distribution</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={resultPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {resultPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-6">
              {resultPieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-slate-600">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Matches Table */}
      {matches.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Top Similar Matches</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-4 py-3">Similarity</th>
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">RR</th>
                  <th className="px-4 py-3">PnL</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Weekly Bias</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {matches.map((m) => (
                  <tr key={m.trade_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${m.similarity_score}%`,
                              backgroundColor: m.similarity_score >= 70 ? '#22c55e' : m.similarity_score >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="font-medium">{m.similarity_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{m.pair || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        m.trade_result === 'WIN' ? 'bg-green-100 text-green-800'
                        : m.trade_result === 'LOSS' ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                      }`}>
                        {m.trade_result || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.rr != null ? m.rr.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={m.pnl != null && m.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {m.pnl != null ? m.pnl.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{m.session || '—'}</td>
                    <td className="px-4 py-3">{m.weekly_bias || '—'}</td>
                    <td className="px-4 py-3">{m.market_phase || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      {history.data && history.data.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Trades (History)</h2>
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
                  <th className="px-4 py-3">Bias</th>
                  <th className="px-4 py-3">Phase</th>
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
                    <td className="px-4 py-3">{h.weekly_bias || '—'}</td>
                    <td className="px-4 py-3">{h.market_phase || '—'}</td>
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

      {matches.length === 0 && !isLoading && result && (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No similar trades found. Try adjusting the environment parameters.</p>
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border px-3 py-2 text-sm"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
