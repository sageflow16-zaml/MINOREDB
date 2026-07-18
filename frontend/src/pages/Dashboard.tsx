import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboard';
import { useSources } from '../hooks/useSources';
import { useClaims } from '../hooks/useClaims';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, Target, BookOpen, MessageSquare, Brain, GitBranch, Database, AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const stats = useDashboardStats(projectId!);
  const recentSources = useSources(projectId!);
  const recentClaims = useClaims(projectId!);

  if (stats.isLoading || recentSources.isLoading || recentClaims.isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingSpinner />
      </div>
    );
  }
  if (stats.isError || recentSources.isError || recentClaims.isError) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState message="Error loading dashboard." />
      </div>
    );
  }

  const chartData = [
    { name: 'Sources', value: stats.data?.sources || 0 },
    { name: 'Claims', value: stats.data?.claims || 0 },
    { name: 'Concepts', value: stats.data?.concepts || 0 },
    { name: 'Interpretations', value: stats.data?.interpretations || 0 },
  ];

  const pipelineData = [
    { name: 'Sources', value: stats.data?.sources || 0, path: `/projects/${projectId}/sources` },
    { name: 'Claims', value: stats.data?.claims || 0, path: `/projects/${projectId}/claims` },
    { name: 'Concepts', value: stats.data?.concepts || 0, path: `/projects/${projectId}/concepts` },
    { name: 'Interpretations', value: stats.data?.interpretations || 0, path: `/projects/${projectId}/interpretations` },
  ];

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-7xl space-y-8"
      >
        {/* Header */}
        <motion.div variants={item}>
          <PageHeader
            title="Dashboard"
            description="Overview of your trading research pipeline"
          />
        </motion.div>

        {/* Trading Performance KPIs */}
        <motion.div variants={item}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Trades"
              value={stats.data?.total_trades ?? 0}
              icon={BarChart3}
              onClick={() => navigate(`/projects/${projectId}/trades`)}
              variant="info"
            />
            <KpiCard
              title="Win Rate"
              value={stats.data?.win_rate != null ? `${stats.data.win_rate}%` : '0%'}
              icon={Target}
              trend={stats.data?.win_rate != null ? { value: 0, positive: (stats.data.win_rate) >= 50 } : undefined}
              onClick={() => navigate(`/projects/${projectId}/trades`)}
              variant={stats.data?.win_rate != null && stats.data.win_rate >= 50 ? 'success' : 'default'}
            />
            <KpiCard
              title="Avg R:R"
              value={stats.data?.avg_rr != null ? stats.data.avg_rr.toFixed(2) : '0.00'}
              icon={Activity}
              onClick={() => navigate(`/projects/${projectId}/trades`)}
              variant="info"
            />
            <KpiCard
              title="Expectancy"
              value={stats.data?.expectancy != null ? stats.data.expectancy.toFixed(2) : '—'}
              icon={DollarSign}
              trend={stats.data?.expectancy != null ? { value: 0, positive: stats.data.expectancy > 0 } : undefined}
              onClick={() => navigate(`/projects/${projectId}/statistics`)}
              variant={(stats.data?.expectancy ?? 0) > 0 ? 'success' : 'danger'}
            />
          </div>
        </motion.div>

        {/* P&L and Drawdown KPIs */}
        <motion.div variants={item}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total P&L"
              value={stats.data?.total_pnl != null ? `$${stats.data.total_pnl.toFixed(2)}` : '—'}
              icon={TrendingUp}
              trend={stats.data?.total_pnl != null ? { value: 0, positive: stats.data.total_pnl > 0 } : undefined}
              onClick={() => navigate(`/projects/${projectId}/statistics`)}
              variant={(stats.data?.total_pnl ?? 0) > 0 ? 'success' : 'danger'}
            />
            <KpiCard
              title="Max Drawdown"
              value={stats.data?.max_drawdown != null ? stats.data.max_drawdown.toFixed(2) : '—'}
              icon={TrendingDown}
              onClick={() => navigate(`/projects/${projectId}/statistics`)}
              variant={(stats.data?.max_drawdown ?? 0) > 0 ? 'warning' : 'default'}
            />
            <KpiCard
              title="Profit Factor"
              value={stats.data?.profit_factor != null ? stats.data.profit_factor.toFixed(2) : '—'}
              icon={Activity}
              onClick={() => navigate(`/projects/${projectId}/statistics`)}
              variant={(stats.data?.profit_factor ?? 0) >= 1.5 ? 'success' : (stats.data?.profit_factor ?? 0) >= 1 ? 'warning' : 'danger'}
            />
            <KpiCard
              title="Open Trades"
              value={stats.data?.open_trades ?? 0}
              icon={BarChart3}
              onClick={() => navigate(`/projects/${projectId}/trades`)}
            />
          </div>
        </motion.div>

        {/* Market Context */}
        <motion.div variants={item}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Bullish Bias"
              value={stats.data?.bullish_bias ?? 0}
              icon={TrendingUp}
              onClick={() => navigate(`/projects/${projectId}/market-structure`)}
              variant="success"
            />
            <KpiCard
              title="Bearish Bias"
              value={stats.data?.bearish_bias ?? 0}
              icon={TrendingDown}
              onClick={() => navigate(`/projects/${projectId}/market-structure`)}
              variant="danger"
            />
            <KpiCard
              title="Current Phase"
              value={stats.data?.current_market_phase ?? '-'}
              icon={Activity}
              onClick={() => navigate(`/projects/${projectId}/market-structure`)}
            />
            <KpiCard
              title="Current Trend"
              value={stats.data?.current_trend ?? '-'}
              icon={Target}
              onClick={() => navigate(`/projects/${projectId}/market-structure`)}
            />
          </div>
        </motion.div>

        {/* Pipeline & Knowledge Rule */}
        <motion.div variants={item} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pipeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Knowledge Rule */}
          {stats.data?.top_knowledge_rule ? (
            <Card
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(`/projects/${projectId}/knowledge`)}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Knowledge Rule</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="mb-4 text-lg font-semibold text-foreground">
                  {stats.data.top_knowledge_rule.title}
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{stats.data.top_knowledge_rule.occurrences}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-500">
                      {stats.data.top_knowledge_rule.win_rate != null ? (stats.data.top_knowledge_rule.win_rate * 100).toFixed(0) : '—'}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-500">
                      {stats.data.top_knowledge_rule.avg_rr != null ? stats.data.top_knowledge_rule.avg_rr.toFixed(2) : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg R:R</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-500">
                      {stats.data.top_knowledge_rule.confidence != null ? stats.data.top_knowledge_rule.confidence.toFixed(0) : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Knowledge Rule</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-8 text-center text-sm text-muted-foreground">No knowledge rules generated yet</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Collectors Status */}
        <motion.div variants={item}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Collectors"
              value={stats.data?.total_collectors ?? 0}
              icon={Database}
              onClick={() => navigate(`/projects/${projectId}/collectors`)}
            />
            <KpiCard
              title="Active"
              value={stats.data?.active_collectors ?? 0}
              icon={Activity}
              variant="success"
              onClick={() => navigate(`/projects/${projectId}/collectors`)}
            />
            <KpiCard
              title="Records Collected"
              value={stats.data?.collector_records ?? 0}
              icon={Brain}
              onClick={() => navigate(`/projects/${projectId}/collectors`)}
            />
            <KpiCard
              title="Errors"
              value={stats.data?.collector_errors ?? 0}
              icon={AlertTriangle}
              variant={(stats.data?.collector_errors ?? 0) > 0 ? 'danger' : 'default'}
              onClick={() => navigate(`/projects/${projectId}/collectors`)}
            />
          </div>
        </motion.div>

        {/* Knowledge Graph Stats */}
        <motion.div variants={item}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              title="Graph Nodes"
              value={stats.data?.graph_nodes ?? 0}
              icon={GitBranch}
              onClick={() => navigate(`/projects/${projectId}/knowledge-graph`)}
            />
            <KpiCard
              title="Graph Edges"
              value={stats.data?.graph_edges ?? 0}
              icon={GitBranch}
              onClick={() => navigate(`/projects/${projectId}/knowledge-graph`)}
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Sources</CardTitle>
              <Badge variant="secondary" className="text-xs">{recentSources.data?.length ?? 0} total</Badge>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentSources.data?.slice(0, 5) || []}
                columns={[
                  { header: 'Title', accessor: (row) => (row as { title?: string }).title || (row as { id?: string }).id?.substring(0, 8) || '-' },
                  { header: 'Date', accessor: (row) => (row as { created_at?: string }).created_at || '-', hideOnMobile: true },
                ]}
                keyExtractor={(row) => (row as { id?: string }).id || String(Math.random())}
                searchable={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Claims</CardTitle>
              <Badge variant="secondary" className="text-xs">{recentClaims.data?.length ?? 0} total</Badge>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentClaims.data?.slice(0, 5) || []}
                columns={[
                  { header: 'Verbatim', accessor: (row) => {
                    const text = (row as { verbatim_text?: string }).verbatim_text || '';
                    return text.length > 40 ? text.substring(0, 40) + '...' : text || '-';
                  }},
                  { header: 'Date', accessor: (row) => (row as { created_at?: string }).created_at || '-', hideOnMobile: true },
                ]}
                keyExtractor={(row) => (row as { id?: string }).id || String(Math.random())}
                searchable={false}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
