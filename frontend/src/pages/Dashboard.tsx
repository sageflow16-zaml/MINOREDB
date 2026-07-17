import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboard';
import { useSources } from '../hooks/useSources';
import { useClaims } from '../hooks/useClaims';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const stats = useDashboardStats(projectId!);
  const recentSources = useSources(projectId!);
  const recentClaims = useClaims(projectId!);

  if (stats.isLoading || recentSources.isLoading || recentClaims.isLoading) return <LoadingSpinner />;
  if (stats.isError || recentSources.isError || recentClaims.isError) return <ErrorState message="Error loading dashboard." />;

  const chartData = [
    { name: 'Sources', value: stats.data?.sources || 0 },
    { name: 'Claims', value: stats.data?.claims || 0 },
    { name: 'Concepts', value: stats.data?.concepts || 0 },
    { name: 'Interpretations', value: stats.data?.interpretations || 0 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { title: 'Total Trades', value: stats.data?.total_trades ?? 0, path: `/projects/${projectId}/trades` },
            { title: 'Win Rate', value: stats.data?.win_rate != null ? `${stats.data.win_rate}%` : '0%', path: `/projects/${projectId}/trades` },
            { title: 'Average RR', value: stats.data?.avg_rr != null ? stats.data.avg_rr.toFixed(2) : '0.00', path: `/projects/${projectId}/trades` },
            { title: 'Open Trades', value: stats.data?.open_trades ?? 0, path: `/projects/${projectId}/trades` },
        ].map(item => (
            <div key={item.title} onClick={() => navigate(item.path)} className="cursor-pointer hover:opacity-80">
                <StatCard title={item.title} value={item.value} />
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { title: 'Bullish Bias', value: stats.data?.bullish_bias ?? 0, path: `/projects/${projectId}/market-structure` },
            { title: 'Bearish Bias', value: stats.data?.bearish_bias ?? 0, path: `/projects/${projectId}/market-structure` },
            { title: 'Current Phase', value: stats.data?.current_market_phase ?? '-', path: `/projects/${projectId}/market-structure` },
            { title: 'Current Trend', value: stats.data?.current_trend ?? '-', path: `/projects/${projectId}/market-structure` },
        ].map(item => (
            <div key={item.title} onClick={() => navigate(item.path)} className="cursor-pointer hover:opacity-80">
                <StatCard title={item.title} value={item.value} />
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { title: 'Sources', value: stats.data?.sources, path: `/projects/${projectId}/sources` },
            { title: 'Claims', value: stats.data?.claims, path: `/projects/${projectId}/claims` },
            { title: 'Concepts', value: stats.data?.concepts, path: `/projects/${projectId}/concepts` },
            { title: 'Interpretations', value: stats.data?.interpretations, path: `/projects/${projectId}/interpretations` }
        ].map(item => (
            <div key={item.title} onClick={() => navigate(item.path)} className="cursor-pointer hover:opacity-80">
                <StatCard title={item.title} value={item.value || 0} />
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { title: 'Expectancy', value: stats.data?.expectancy != null ? stats.data.expectancy.toFixed(2) : '—', path: `/projects/${projectId}/statistics` },
            { title: 'Total P&L', value: stats.data?.total_pnl != null ? stats.data.total_pnl.toFixed(2) : '—', path: `/projects/${projectId}/statistics` },
            { title: 'Max Drawdown', value: stats.data?.max_drawdown != null ? stats.data.max_drawdown.toFixed(2) : '—', path: `/projects/${projectId}/statistics` },
            { title: 'Profit Factor', value: stats.data?.profit_factor != null ? stats.data.profit_factor.toFixed(2) : '—', path: `/projects/${projectId}/statistics` },
        ].map(item => (
            <div key={item.title} onClick={() => navigate(item.path)} className="cursor-pointer hover:opacity-80">
                <StatCard title={item.title} value={item.value} />
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { title: 'Collectors', value: stats.data?.total_collectors ?? 0, path: `/projects/${projectId}/collectors` },
            { title: 'Active', value: stats.data?.active_collectors ?? 0, path: `/projects/${projectId}/collectors` },
            { title: 'Records Collected', value: stats.data?.collector_records ?? 0, path: `/projects/${projectId}/collectors` },
            { title: 'Collector Errors', value: stats.data?.collector_errors ?? 0, path: `/projects/${projectId}/collectors` },
        ].map(item => (
            <div key={item.title} onClick={() => navigate(item.path)} className="cursor-pointer hover:opacity-80">
                <StatCard title={item.title} value={item.value} />
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-64 bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">Pipeline Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" /> <YAxis /> <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
            <h3 className="font-semibold mb-4">Recent Sources</h3>
            <DataTable data={recentSources.data?.slice(0, 5) || []} columns={[
                { header: 'ID', accessor: 'id' },
                { header: 'Created', accessor: 'created_at' }
            ]} />
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
            <h3 className="font-semibold mb-4">Recent Claims</h3>
            <DataTable data={recentClaims.data?.slice(0, 5) || []} columns={[
                { header: 'ID', accessor: 'id' },
                { header: 'Verbatim', accessor: (row) => (row.verbatim_text ? row.verbatim_text.substring(0, 30) : '') + '...' }
            ]} />
        </div>
      </div>
    </div>
  );
}
