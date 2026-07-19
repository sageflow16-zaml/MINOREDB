import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { useTVEvents, useTVLogs, useTVStats } from '../hooks/useTradingView';

const eventTypeColor: Record<string, string> = {
  break_of_structure: 'bg-blue-100 text-blue-800',
  market_structure_shift: 'bg-purple-100 text-purple-800',
  liquidity_sweep: 'bg-red-100 text-red-800',
  equal_high: 'bg-yellow-100 text-yellow-800',
  equal_low: 'bg-yellow-100 text-yellow-800',
  order_block: 'bg-green-100 text-green-800',
  breaker_block: 'bg-orange-100 text-orange-800',
  fair_value_gap: 'bg-cyan-100 text-cyan-800',
  mitigation_block: 'bg-gray-100 text-gray-800',
  asian_range: 'bg-indigo-100 text-indigo-800',
  london_open: 'bg-blue-100 text-blue-800',
  new_york_open: 'bg-green-100 text-green-800',
  weekly_open: 'bg-purple-100 text-purple-800',
  daily_open: 'bg-pink-100 text-pink-800',
};

const logStatusColor: Record<string, string> = {
  processed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  received: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
};

export default function TradingViewPage() {
  const [symbolFilter, setSymbolFilter] = useState('');
  const [timeframeFilter, setTimeframeFilter] = useState('');

  const stats = useTVStats();
  const events = useTVEvents({
    limit: 50,
    symbol: symbolFilter || undefined,
    timeframe: timeframeFilter || undefined,
  });
  const logs = useTVLogs(30);

  if (stats.isLoading || events.isLoading) return <LoadingSpinner />;
  if (stats.isError || events.isError) return <ErrorState message="Error loading TradingView data." onRetry={() => { stats.refetch(); events.refetch(); }} />;

  const statsData = stats.data;
  const eventsData = events.data || [];
  const logsData = logs.data || [];

  const eventTimeline = eventsData.slice(0, 20).map((e) => ({
    name: e.event_type.replace(/_/g, ' '),
    symbol: e.symbol,
    timeframe: e.timeframe,
    price: e.price ?? 0,
    timestamp: new Date(e.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader title="TradingView Integration" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Webhook Active
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={statsData?.total_events ?? 0} />
        <StatCard title="Total Logs" value={statsData?.total_logs ?? 0} />
        <StatCard title="Unique Symbols" value={Object.keys(statsData?.events_by_symbol ?? {}).length} />
        <StatCard title="Event Types" value={Object.keys(statsData?.events_by_type ?? {}).length} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
            <select
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Symbols</option>
              {Object.keys(statsData?.events_by_symbol ?? {}).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
            <select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Timeframes</option>
              {Object.keys(statsData?.events_by_timeframe ?? {}).map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Event Timeline</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Time</th>
                <th className="text-left py-2 px-3">Event Type</th>
                <th className="text-left py-2 px-3">Symbol</th>
                <th className="text-left py-2 px-3">Timeframe</th>
                <th className="text-right py-2 px-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {eventTimeline.map((e, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{e.timestamp}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${eventTypeColor[e.name.replace(/ /g, '_')] || 'bg-gray-100'}`}>
                      {e.name}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium">{e.symbol}</td>
                  <td className="py-2 px-3">{e.timeframe}</td>
                  <td className="py-2 px-3 text-right">{e.price || '--'}</td>
                </tr>
              ))}
              {eventTimeline.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">No events yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events by Type */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Events by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(statsData?.events_by_type ?? {}).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className={`px-2 py-1 rounded text-xs font-medium ${eventTypeColor[type] || 'bg-gray-100'}`}>
                {type.replace(/_/g, ' ')}
              </span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Webhook Logs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Received At</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Message</th>
                <th className="text-right py-2 px-3">Processing Time</th>
              </tr>
            </thead>
            <tbody>
              {logsData.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{new Date(log.received_at).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${logStatusColor[log.status] || 'bg-gray-100'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{log.message || '--'}</td>
                  <td className="py-2 px-3 text-right">{log.processing_time_ms != null ? `${log.processing_time_ms}ms` : '--'}</td>
                </tr>
              ))}
              {logsData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
