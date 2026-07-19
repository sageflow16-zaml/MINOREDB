import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { useMacroState, useMacroRefresh } from '../hooks/useMacro';

const importanceColor: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
};

export default function MacroIntelligencePage() {
  const state = useMacroState();
  const refresh = useMacroRefresh();

  if (state.isLoading) return <LoadingSpinner />;
  if (state.isError) return <ErrorState message="Error loading macro data." onRetry={() => state.refetch()} />;

  const data = state.data;
  const snapshot = data?.snapshot;
  const todayEvents = data?.events_today || [];
  const highImpact = data?.high_impact_events || [];
  const upcoming = data?.upcoming_events || [];
  const recent = data?.recent_releases || [];

  const yieldHistory = [
    { name: 'Now', us10y: snapshot?.us10y ?? 0, us02y: snapshot?.us02y ?? 0 },
  ];

  const dxyTrend = [
    { name: 'Current', dxy: snapshot?.dxy ?? 0 },
  ];

  const macroTimeline = todayEvents.map((e) => ({
    name: e.event_name,
    importance: e.importance === 'high' ? 3 : e.importance === 'medium' ? 2 : 1,
    actual: e.actual,
    forecast: e.forecast,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Macro Intelligence" />
        <button
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {refresh.isPending ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Market Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard title="DXY" value={snapshot?.dxy?.toFixed(2) ?? '--'} />
        <StatCard title="US10Y" value={snapshot?.us10y != null ? `${snapshot.us10y.toFixed(2)}%` : '--'} />
        <StatCard title="US02Y" value={snapshot?.us02y != null ? `${snapshot.us02y.toFixed(2)}%` : '--'} />
        <StatCard title="Yield Curve" value={snapshot?.yield_curve != null ? `${snapshot.yield_curve.toFixed(2)}%` : '--'} />
        <StatCard title="Gold" value={snapshot?.gold != null ? `$${snapshot.gold.toFixed(0)}` : '--'} />
        <StatCard title="Oil" value={snapshot?.oil != null ? `$${snapshot.oil.toFixed(1)}` : '--'} />
        <StatCard title="VIX" value={snapshot?.vix?.toFixed(1) ?? '--'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yield History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Yield History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yieldHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="us10y" fill="#3b82f6" name="US 10Y" />
              <Bar dataKey="us02y" fill="#ef4444" name="US 02Y" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DXY Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">DXY Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dxyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip />
              <Line type="monotone" dataKey="dxy" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macro Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Macro Timeline</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={macroTimeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="importance" fill="#f59e0b" name="Importance" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calendar Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Economic Calendar</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Event</th>
                <th className="text-left py-2 px-3">Country</th>
                <th className="text-left py-2 px-3">Importance</th>
                <th className="text-right py-2 px-3">Actual</th>
                <th className="text-right py-2 px-3">Forecast</th>
                <th className="text-right py-2 px-3">Previous</th>
                <th className="text-left py-2 px-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {todayEvents.map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{event.event_name}</td>
                  <td className="py-2 px-3">{event.country}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${importanceColor[event.importance] || 'bg-gray-100'}`}>
                      {event.importance}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">{event.actual ?? '--'}</td>
                  <td className="py-2 px-3 text-right">{event.forecast ?? '--'}</td>
                  <td className="py-2 px-3 text-right">{event.previous ?? '--'}</td>
                  <td className="py-2 px-3">
                    {event.release_time ? new Date(event.release_time).toLocaleString() : '--'}
                  </td>
                </tr>
              ))}
              {todayEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">No events today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Events & Recent Releases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((event) => (
              <div key={event.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium text-sm">{event.event_name}</p>
                  <p className="text-xs text-gray-500">{event.country} | {event.category}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${importanceColor[event.importance] || 'bg-gray-100'}`}>
                    {event.importance}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.release_time ? new Date(event.release_time).toLocaleDateString() : '--'}
                  </p>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-gray-500 text-sm">No upcoming events</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Releases</h3>
          <div className="space-y-3">
            {recent.slice(0, 5).map((event) => (
              <div key={event.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium text-sm">{event.event_name}</p>
                  <p className="text-xs text-gray-500">{event.country} | {event.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Actual: {event.actual ?? '--'}</p>
                  <p className="text-xs text-gray-500">Forecast: {event.forecast ?? '--'}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="text-gray-500 text-sm">No recent releases</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
