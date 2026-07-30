import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import { useMarketEvents } from '../hooks/useMarketIntelligence';
import { useOhlcData } from '../hooks/useOhlcData';
import {
  Calendar, Globe, Search, Filter, Clock, TrendingUp, Activity,
  AlertTriangle, DollarSign, RefreshCw
} from 'lucide-react';

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', AU: '🇦🇺', CA: '🇨🇦', CH: '🇨🇭', CN: '🇨🇳', NZ: '🇳🇿', SE: '🇸🇪', NO: '🇳🇴',
};
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', EU: 'EUR', UK: 'GBP', JP: 'JPY', AU: 'AUD', CA: 'CAD', CH: 'CHF', CN: 'CNY', NZ: 'NZD',
};
const IMPACT_VARIANT: Record<string, 'destructive' | 'warning' | 'info'> = { high: 'destructive', medium: 'warning', low: 'info' };
const COUNTRIES = ['All', 'US', 'EU', 'UK', 'JP', 'AU', 'CA', 'CH', 'NZ'];
const IMPACTS = ['All', 'high', 'medium', 'low'];
const PERIODS = ['Today', 'This Week', 'All'];

function importanceLabel(v: any): string {
  if (typeof v === 'string') return v;
  const n = Number(v);
  if (n >= 4) return 'high';
  if (n >= 2) return 'medium';
  return 'low';
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function MacroIntelligencePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [period, setPeriod] = useState('Today');
  const [country, setCountry] = useState('All');
  const [impact, setImpact] = useState('All');
  const [search, setSearch] = useState('');

  const { data: rawEvents = [], isLoading, error, refetch } = useMarketEvents(
    projectId!, undefined, undefined,
    country === 'All' ? undefined : country,
    impact === 'All' ? undefined : impact,
  );

  const { data: dxy } = useOhlcData('DXY', '1h', projectId, !!projectId);
  const { data: gold } = useOhlcData('XAUUSD', '1h', projectId, !!projectId);
  const { data: vix } = useOhlcData('VIX', '1h', projectId, !!projectId);

  useEffect(() => {
    const timer = setInterval(() => refetch(), 120_000);
    return () => clearInterval(timer);
  }, [refetch]);

  const latestPx = (data: any[] | undefined) => data && data.length > 0 ? data[data.length - 1].close : null;

  const filtered = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const todayStr = now.toISOString().slice(0, 10);

    return rawEvents.filter((ev: any) => {
      if (search && !(ev.event_name || ev.title || '').toLowerCase().includes(search.toLowerCase())) return false;
      const dateStr = (ev.event_date || '').slice(0, 10);
      if (period === 'Today' && dateStr !== todayStr) return false;
      if (period === 'This Week') {
        const d = new Date(ev.event_date);
        if (d < weekStart || d > now) return false;
      }
      return true;
    }).sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [rawEvents, period, search]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-5">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader title="Macro Terminal" description="Bloomberg-style economic calendar and market dashboard" />
        <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isLoading}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { title: 'DXY', value: latestPx(dxy), icon: DollarSign },
          { title: 'XAUUSD', value: latestPx(gold), icon: TrendingUp },
          { title: 'VIX', value: latestPx(vix), icon: Activity },
          { title: 'US10Y', value: '—', icon: TrendingUp },
          { title: 'US02Y', value: '—', icon: TrendingUp },
          { title: 'Yield', value: '—', icon: Activity },
          { title: 'Oil', value: '—', icon: Activity },
        ].map((k) => (
          <div key={k.title} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider">{k.title}</p>
            <p className="text-sm font-semibold font-mono text-foreground mt-0.5">
              {k.value != null ? k.value.toFixed(2) : '—'}
            </p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-1">
                {PERIODS.map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                      period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}>{p}</button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Globe className="w-3 h-3 text-muted-foreground" />
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:border-primary/50">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Filter className="w-3 h-3 text-muted-foreground" />
                <select value={impact} onChange={e => setImpact(e.target.value)}
                  className="h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:border-primary/50">
                  {IMPACTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search events..."
                    className="h-7 w-36 rounded border border-border bg-background pl-7 pr-2 text-xs outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500/60 mb-2" />
                <p className="text-xs text-muted-foreground">Failed to load calendar data.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No events found for the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-3xs font-medium uppercase text-muted-foreground">
                      <th className="px-3 py-2.5 w-8"></th>
                      <th className="px-3 py-2.5">Country</th>
                      <th className="px-3 py-2.5">Currency</th>
                      <th className="px-3 py-2.5">Time</th>
                      <th className="px-3 py-2.5">Event</th>
                      <th className="px-3 py-2.5 w-20">Impact</th>
                      <th className="px-3 py-2.5 text-right w-20">Previous</th>
                      <th className="px-3 py-2.5 text-right w-20">Forecast</th>
                      <th className="px-3 py-2.5 text-right w-20">Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((ev: any) => {
                      const name = ev.event_name || ev.title || 'Unknown';
                      const imp = importanceLabel(ev.importance);
                      const ctry = ev.country || '—';
                      const flag = COUNTRY_FLAGS[ctry] || '';
                      const currency = COUNTRY_CURRENCY[ctry] || ev.currency || '';
                      const time = ev.event_date || '';
                      return (
                        <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2.5 text-base">{flag}</td>
                          <td className="px-3 py-2.5 font-medium text-foreground">{ctry}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{currency}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground max-w-[240px] truncate">{name}</td>
                          <td className="px-3 py-2.5"><Badge variant={IMPACT_VARIANT[imp] || 'info'} size="sm">{imp}</Badge></td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">{ev.previous ?? '—'}</td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">{ev.forecast ?? '—'}</td>
                          <td className={cn('px-3 py-2.5 text-right font-medium',
                            ev.actual != null ? 'text-foreground' : 'text-muted-foreground'
                          )}>{ev.actual ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
