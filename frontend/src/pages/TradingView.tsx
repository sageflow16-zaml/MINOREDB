import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { useTVEvents, useTVLogs, useTVStats } from '../hooks/useTradingView';
import { Activity, Radio } from 'lucide-react';
import { cn } from '../lib/utils';

const eventTypeVariant: Record<string, 'info' | 'default' | 'destructive' | 'warning' | 'success' | 'secondary'> = {
  break_of_structure: 'info', market_structure_shift: 'default', liquidity_sweep: 'destructive',
  equal_high: 'warning', equal_low: 'warning', order_block: 'success', breaker_block: 'warning',
  fair_value_gap: 'info', mitigation_block: 'secondary', asian_range: 'info',
  london_open: 'info', new_york_open: 'success', weekly_open: 'default', daily_open: 'secondary',
};

const logStatusVariant: Record<string, 'success' | 'destructive' | 'default'> = {
  processed: 'success', rejected: 'destructive', received: 'default', error: 'destructive',
};

export default function TradingViewPage() {
  const [symbolFilter, setSymbolFilter] = useState('');
  const [timeframeFilter, setTimeframeFilter] = useState('');

  const stats = useTVStats();
  const events = useTVEvents({ limit: 50, symbol: symbolFilter || undefined, timeframe: timeframeFilter || undefined });
  const logs = useTVLogs(30);

  if (stats.isLoading || events.isLoading) return <LoadingSpinner />;
  if (stats.isError || events.isError) return <ErrorState message="Error loading TradingView data." onRetry={() => { stats.refetch(); events.refetch(); }} />;

  const statsData = stats.data;
  const eventsData = events.data || [];
  const logsData = logs.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="TradingView Integration"
        description="Webhook-based market structure events"
      >
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Webhook Active
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="py-4"><p className="text-[10px] text-muted-foreground">Total Events</p><p className="text-lg font-bold text-foreground">{statsData?.total_events ?? 0}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-[10px] text-muted-foreground">Total Logs</p><p className="text-lg font-bold text-foreground">{statsData?.total_logs ?? 0}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-[10px] text-muted-foreground">Unique Symbols</p><p className="text-lg font-bold text-foreground">{Object.keys(statsData?.events_by_symbol ?? {}).length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-[10px] text-muted-foreground">Event Types</p><p className="text-lg font-bold text-foreground">{Object.keys(statsData?.events_by_type ?? {}).length}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Symbol</label>
              <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Symbols</option>
                {Object.keys(statsData?.events_by_symbol ?? {}).map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Timeframe</label>
              <select value={timeframeFilter} onChange={(e) => setTimeframeFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Timeframes</option>
                {Object.keys(statsData?.events_by_timeframe ?? {}).map((tf) => (<option key={tf} value={tf}>{tf}</option>))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Event Timeline</CardTitle>
        </CardHeader>
        {eventsData.length === 0 ? (
          <CardContent><p className="text-xs text-muted-foreground text-center py-4">No events yet</p></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Event Type</th>
                  <th className="px-4 py-2.5">Symbol</th>
                  <th className="px-4 py-2.5">Timeframe</th>
                  <th className="px-4 py-2.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventsData.slice(0, 20).map((e, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={eventTypeVariant[e.event_type] || 'secondary'} size="sm">{e.event_type.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{e.symbol}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.timeframe}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{e.price ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Events by Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Events by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(statsData?.events_by_type ?? {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5">
                <Badge variant={eventTypeVariant[type] || 'secondary'} size="sm">{type.replace(/_/g, ' ')}</Badge>
                <span className="text-xs font-semibold text-foreground">{count as number}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Webhook Logs</CardTitle>
        </CardHeader>
        {logsData.length === 0 ? (
          <CardContent><p className="text-xs text-muted-foreground text-center py-4">No logs yet</p></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Received At</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Message</th>
                  <th className="px-4 py-2.5 text-right">Processing Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logsData.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{new Date(log.received_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={logStatusVariant[log.status] || 'default'} size="sm">{log.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{log.message || '--'}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{log.processing_time_ms != null ? `${log.processing_time_ms}ms` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
