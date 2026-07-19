import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { DataTable } from '../components/ui/DataTable';
import {
  useSimilarityCurrent, useSimilarityTrade, useSimilarityPattern, useSimilarityHistory,
} from '../hooks/useSimilarity';
import type { SimilarityResponse, SimilarityEnvironment } from '../api/types';
import { TrendingUp, Target, BarChart3, Activity, Search, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const PAIR_OPTIONS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'];
const BIAS_OPTIONS = ['BULLISH', 'BEARISH', 'NEUTRAL'];
const PHASE_OPTIONS = ['ACCUMULATION', 'MARKUP', 'DISTRIBUTION', 'MARKDOWN'];
const TREND_OPTIONS = ['UPTREND', 'DOWNTREND', 'RANGING'];
const BOOL_OPTIONS = ['YES', 'NO'];

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <option value="">Any</option>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}

export default function SimilarityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [env, setEnv] = useState<SimilarityEnvironment>({
    pair: '', direction: '', weekly_bias: '', daily_bias: '', h4_bias: '',
    market_phase: '', trend: '', asian_session: false, london_session: false, newyork_session: false,
    liquidity_sweep: '', mss: '', fvg: '',
  });
  const [compareMode, setCompareMode] = useState<'current' | 'trade' | 'pattern'>('current');
  const [tradeIdInput, setTradeIdInput] = useState('');
  const [patternIdInput, setPatternIdInput] = useState('');

  const currentMutation = useSimilarityCurrent(projectId!);
  const tradeMutation = useSimilarityTrade(projectId!);
  const patternMutation = useSimilarityPattern(projectId!);
  const history = useSimilarityHistory(projectId!);

  const result: SimilarityResponse | null = currentMutation.data || tradeMutation.data || patternMutation.data || null;
  const isLoading = currentMutation.isPending || tradeMutation.isPending || patternMutation.isPending;
  const isError = currentMutation.isError || tradeMutation.isError || patternMutation.isError;

  const handleCompare = () => {
    if (compareMode === 'current') currentMutation.mutate(env);
    else if (compareMode === 'trade' && tradeIdInput) tradeMutation.mutate(tradeIdInput);
    else if (compareMode === 'pattern' && patternIdInput) patternMutation.mutate(patternIdInput);
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

  const rrData = matches.filter((m) => m.rr != null).map((m, i) => ({ index: i + 1, rr: m.rr, similarity: m.similarity_score }));

  const simDistData = (() => {
    const buckets = [
      { range: '0-20%', count: 0 }, { range: '20-40%', count: 0 },
      { range: '40-60%', count: 0 }, { range: '60-80%', count: 0 }, { range: '80-100%', count: 0 },
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
      const bucket = m.similarity_score >= 80 ? '80-100%' : m.similarity_score >= 60 ? '60-80%' : m.similarity_score >= 40 ? '40-60%' : '0-40%';
      if (!groups[bucket]) groups[bucket] = { wins: 0, total: 0 };
      groups[bucket].total++;
      if (m.trade_result === 'WIN') groups[bucket].wins++;
    }
    return Object.entries(groups).map(([range, v]) => ({ range, win_rate: v.total > 0 ? Math.round((v.wins / v.total) * 100) : 0, count: v.total })).sort((a, b) => b.range.localeCompare(a.range));
  })();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
      <PageHeader title="Similarity Engine" description="Find historical trades matching current market conditions" />

      {/* Environment Card */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Environment Setup</CardTitle>
            </div>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              {(['current', 'trade', 'pattern'] as const).map((mode) => (
                <button key={mode} onClick={() => setCompareMode(mode)}
                  className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors', compareMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  {mode === 'current' ? 'Current Env' : mode === 'trade' ? 'By Trade' : 'By Pattern'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {compareMode === 'current' && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                <SelectField label="Pair" value={env.pair || ''} onChange={(v) => setEnv({ ...env, pair: v })} options={PAIR_OPTIONS} />
                <SelectField label="Direction" value={env.direction || ''} onChange={(v) => setEnv({ ...env, direction: v })} options={['BUY', 'SELL']} />
                <SelectField label="Weekly Bias" value={env.weekly_bias || ''} onChange={(v) => setEnv({ ...env, weekly_bias: v })} options={BIAS_OPTIONS} />
                <SelectField label="Daily Bias" value={env.daily_bias || ''} onChange={(v) => setEnv({ ...env, daily_bias: v })} options={BIAS_OPTIONS} />
                <SelectField label="H4 Bias" value={env.h4_bias || ''} onChange={(v) => setEnv({ ...env, h4_bias: v })} options={BIAS_OPTIONS} />
                <SelectField label="Market Phase" value={env.market_phase || ''} onChange={(v) => setEnv({ ...env, market_phase: v })} options={PHASE_OPTIONS} />
                <SelectField label="Trend" value={env.trend || ''} onChange={(v) => setEnv({ ...env, trend: v })} options={TREND_OPTIONS} />
                <SelectField label="Liquidity Sweep" value={env.liquidity_sweep || ''} onChange={(v) => setEnv({ ...env, liquidity_sweep: v })} options={BOOL_OPTIONS} />
                <SelectField label="MSS" value={env.mss || ''} onChange={(v) => setEnv({ ...env, mss: v })} options={BOOL_OPTIONS} />
                <SelectField label="FVG" value={env.fvg || ''} onChange={(v) => setEnv({ ...env, fvg: v })} options={BOOL_OPTIONS} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground">Sessions</label>
                  <div className="flex gap-3">
                    {(['asian_session', 'london_session', 'newyork_session'] as const).map((s) => (
                      <label key={s} className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={!!env[s]} onChange={(e) => setEnv({ ...env, [s]: e.target.checked })} className="rounded border-input" />
                        {s.replace('_session', '').replace(/^\w/, (c) => c.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {compareMode === 'trade' && (
              <div className="flex gap-3">
                <input type="text" placeholder="Trade ID (UUID)" value={tradeIdInput} onChange={(e) => setTradeIdInput(e.target.value)}
                  className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            )}
            {compareMode === 'pattern' && (
              <div className="flex gap-3">
                <input type="text" placeholder="Pattern ID (UUID)" value={patternIdInput} onChange={(e) => setPatternIdInput(e.target.value)}
                  className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCompare} isLoading={isLoading} disabled={(compareMode === 'trade' && !tradeIdInput) || (compareMode === 'pattern' && !patternIdInput)}>
                <Search className="h-3.5 w-3.5 mr-1.5" /> Find Similar Trades
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {isError && <motion.div variants={item}><ErrorState message="Error running similarity comparison." onRetry={handleCompare} /></motion.div>}

      {/* Summary KPIs */}
      {summary && (
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard title="Matches Found" value={summary.matches_found} icon={Target} variant="info" size="sm" />
          <KpiCard title="Avg Win Rate" value={`${summary.average_win_rate}%`} icon={TrendingUp} variant={summary.average_win_rate >= 50 ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Avg R:R" value={summary.average_rr != null ? summary.average_rr.toFixed(2) : '—'} icon={Activity} variant={(summary.average_rr ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
          <KpiCard title="Avg P&L" value={summary.average_pnl != null ? `$${summary.average_pnl.toFixed(2)}` : '—'} icon={BarChart3} variant={(summary.average_pnl ?? 0) >= 0 ? 'success' : 'danger'} size="sm" />
        </motion.div>
      )}

      {/* Charts Row */}
      {matches.length > 0 && (
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Similarity Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={simDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Historical R:R by Match</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={rrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="index" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="rr" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Win Rate by Similarity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={winRateBySim}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Bar dataKey="win_rate" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Result Pie + Matches Table */}
      {matches.length > 0 && (
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {resultPieData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Result Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={resultPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {resultPieData.map((_, i) => (<Cell key={i} fill={chartColors[i % chartColors.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle className="text-sm font-medium">Top Similar Matches</CardTitle></CardHeader>
            <CardContent>
              <DataTable
                data={matches}
                columns={[
                  { id: 'similarity', header: 'Similarity', accessor: (row: any) => (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${row.similarity_score}%`, backgroundColor: row.similarity_score >= 70 ? 'hsl(var(--success))' : row.similarity_score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }} />
                      </div>
                      <span className="text-xs font-medium">{row.similarity_score}%</span>
                    </div>
                  ), width: '130px' },
                  { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '—', width: '80px' },
                  { id: 'result', header: 'Result', accessor: (row: any) => (
                    <Badge variant={row.trade_result === 'WIN' ? 'success' : row.trade_result === 'LOSS' ? 'destructive' : 'default'} size="sm">
                      {row.trade_result || '—'}
                    </Badge>
                  ), width: '70px' },
                  { id: 'rr', header: 'R:R', accessor: (row: any) => row.rr?.toFixed(2) ?? '—', width: '60px' },
                  { id: 'pnl', header: 'P&L', accessor: (row: any) => {
                    if (row.pnl == null) return '—';
                    return <span className={cn('text-xs font-medium', row.pnl >= 0 ? 'text-success' : 'text-destructive')}>{row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}</span>;
                  }, width: '90px' },
                  { id: 'session', header: 'Session', accessor: (row: any) => row.session || '—', width: '80px', hideOnMobile: true },
                  { id: 'bias', header: 'Bias', accessor: (row: any) => row.weekly_bias || '—', width: '80px', hideOnMobile: true },
                  { id: 'phase', header: 'Phase', accessor: (row: any) => row.market_phase || '—', width: '90px', hideOnMobile: true },
                  { id: 'date', header: 'Date', accessor: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—', width: '90px', hideOnMobile: true },
                ]}
                pageSize={5}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* History */}
      {history.data && history.data.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Trades (History)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={history.data}
                columns={[
                  { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '—', width: '80px' },
                  { id: 'direction', header: 'Dir', accessor: (row: any) => row.direction || '—', width: '50px' },
                  { id: 'result', header: 'Result', accessor: (row: any) => (
                    <Badge variant={row.result === 'WIN' ? 'success' : row.result === 'LOSS' ? 'destructive' : 'default'} size="sm">
                      {row.result || '—'}
                    </Badge>
                  ), width: '70px' },
                  { id: 'rr', header: 'R:R', accessor: (row: any) => row.rr?.toFixed(2) ?? '—', width: '60px' },
                  { id: 'pnl', header: 'P&L', accessor: (row: any) => {
                    if (row.pnl == null) return '—';
                    return <span className={cn('text-xs font-medium', row.pnl >= 0 ? 'text-success' : 'text-destructive')}>{row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}</span>;
                  }, width: '90px' },
                  { id: 'bias', header: 'Bias', accessor: (row: any) => row.weekly_bias || '—', width: '80px', hideOnMobile: true },
                  { id: 'phase', header: 'Phase', accessor: (row: any) => row.market_phase || '—', width: '90px', hideOnMobile: true },
                  { id: 'date', header: 'Date', accessor: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—', width: '90px', hideOnMobile: true },
                ]}
                pageSize={5}
                searchable={false}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {matches.length === 0 && !isLoading && result && (
        <motion.div variants={item}>
          <EmptyState title="No similar trades found" description="Try adjusting the environment parameters." />
        </motion.div>
      )}
    </motion.div>
  );
}
