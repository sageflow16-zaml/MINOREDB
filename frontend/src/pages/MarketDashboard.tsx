import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import { useMarketDashboard, useMarketAlerts, useActiveRegime } from '../hooks/useMarketIntelligence';
import type { MarketDashboardData, MarketAlert, MarketRegime } from '../api/types';
import {
  Activity, TrendingUp, TrendingDown, Globe, Bell, Eye, Clock,
  Zap, BarChart3, AlertTriangle, RefreshCw, ChevronRight,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const SESSION_LABELS: Record<string, string> = { asia: 'Asia', london: 'London', newyork: 'New York', overlap: 'Overlap' };
const SESSION_COLORS: Record<string, string> = { open: 'bg-emerald-500', closed: 'bg-zinc-400' };

function RegimeBadge({ regime }: { regime: MarketRegime | null }) {
  if (!regime) return <Badge variant="info">No Data</Badge>;
  const color: Record<string, string> = {
    trending: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ranging: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    high_vol: 'bg-red-500/15 text-red-400 border-red-500/30',
    low_vol: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    risk_on: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    risk_off: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', color[regime.regime_type] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30')}>
      {regime.regime_type.replace('_', ' ')} · {regime.regime_value}
    </span>
  );
}

function AlertRow({ alert }: { alert: MarketAlert }) {
  const sev: Record<string, string> = {
    critical: 'destructive',
    warning: 'warning',
    info: 'info',
  };
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
        {alert.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>}
      </div>
      <Badge variant={(sev[alert.severity] as 'destructive' | 'warning' | 'info') ?? 'info'}>{alert.severity}</Badge>
    </div>
  );
}

export default function MarketDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const { data: dashboard, isLoading, error } = useMarketDashboard(projectId!);
  const { data: alerts = [] } = useMarketAlerts(projectId!);
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!dashboard) return <EmptyState />;

  const d = dashboard as MarketDashboardData;
  const sessions = d.session_status ?? {};
  const volatilityLevel = d.volatility_summary?.level ?? 'normal';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Intelligence"
        description="Real-time regime, sessions, alerts and upcoming events"
        actions={
          <Button variant="outline" size="sm" onClick={() => setRefreshing((r) => !r)}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', refreshing && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* KPI row */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Regime"
            value={d.regime ? d.regime.regime_type.replace('_', ' ') : '—'}
            icon={Activity}
            subtitle={d.regime ? `Confidence ${(d.regime.confidence * 100).toFixed(0)}%` : 'No active regime'}
          />
          <KpiCard
            title="Volatility"
            value={volatilityLevel}
            icon={Zap}
            subtitle={d.regime ? `${d.regime.regime_value} regime` : 'Normal'}
          />
          <KpiCard
            title="USD Strength"
            value={d.usd_strength?.toFixed(1) ?? '—'}
            icon={BarChart3}
            subtitle="DXY proxy"
          />
          <KpiCard
            title="Active Alerts"
            value={String(alerts.length)}
            icon={Bell}
            subtitle={alerts.filter((a: MarketAlert) => a.severity === 'critical').length > 0 ? 'Has critical alerts' : 'All clear'}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Trading Sessions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(SESSION_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', SESSION_COLORS[sessions[key] ?? 'closed'])} />
                      <span className="text-xs font-medium capitalize">{sessions[key] ?? '—'}</span>
                    </span>
                  </div>
                ))}
                {sessions.current && sessions.current !== 'closed' && (
                  <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-2">
                    <span className="text-xs font-medium text-primary-text">Current: {SESSION_LABELS[sessions.current] ?? sessions.current}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming events */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Upcoming High-Impact Events</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {d.upcoming_events?.length === 0 && <p className="text-xs text-muted-foreground">No upcoming events</p>}
                {d.upcoming_events?.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 text-sm">
                    <Badge variant={ev.impact === 'high' ? 'destructive' : ev.impact === 'medium' ? 'warning' : 'info'}>{ev.impact}</Badge>
                    <span className="flex-1 truncate text-foreground">{ev.event_name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{ev.event_date.slice(5)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Alerts */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Active Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {alerts.length === 0 && <p className="text-xs text-muted-foreground">No active alerts</p>}
                {alerts.slice(0, 5).map((a: MarketAlert) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Watchlist summary + Regime history */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Watchlist Summary</CardTitle></CardHeader>
            <CardContent>
              {d.watchlist_summary ? (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{d.watchlist_summary.count}</p>
                    <p className="text-xs text-muted-foreground">Symbols</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{d.watchlist_summary.bullish}</p>
                    <p className="text-xs text-muted-foreground">Bullish</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{d.watchlist_summary.bearish}</p>
                    <p className="text-xs text-muted-foreground">Bearish</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No watchlist configured</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Recent Regimes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {d.recent_regimes?.length === 0 && <p className="text-xs text-muted-foreground">No regime history</p>}
              {d.recent_regimes?.slice(0, 5).map((r: MarketRegime) => (
                <div key={r.id} className="flex items-center justify-between">
                  <RegimeBadge regime={r} />
                  <span className="text-xs text-muted-foreground">{r.symbol}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
