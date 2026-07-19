import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { useDashboardStats } from '../hooks/useDashboard';
import { Activity, TrendingUp, BarChart3, PieChart as PieChartIcon, Database, BookOpen, MessageSquare, Layers, Brain, GitBranch } from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, error, refetch } = useDashboardStats(projectId!);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (error) return <ErrorState message="Error loading analytics." onRetry={() => refetch()} />;

  const chartData = data
    ? [
        { name: 'Sources', value: data.sources, icon: 'BookOpen' },
        { name: 'Claims', value: data.claims, icon: 'MessageSquare' },
        { name: 'Concepts', value: data.concepts, icon: 'Layers' },
        { name: 'Interpretations', value: data.interpretations, icon: 'Brain' },
        { name: 'Conflicts', value: data.conflicts, icon: 'GitBranch' },
        { name: 'Questions', value: data.questions, icon: 'HelpCircle' },
        { name: 'Hypotheses', value: data.hypotheses, icon: 'TrendingUp' },
      ]
    : [];

  const totalEntities = chartData.reduce((sum, d) => sum + d.value, 0);

  if (!chartData.length || chartData.every(d => !d.value)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Research and performance analytics" />
        <EmptyState title="No analytics data yet" description="Start adding sources and claims to see analytics." />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader title="Analytics" description={`${totalEntities} total entities in your knowledge graph`} />

      {/* Top KPIs */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard title="Sources" value={data?.sources ?? 0} icon={BookOpen} variant="info" size="sm" />
        <KpiCard title="Claims" value={data?.claims ?? 0} icon={MessageSquare} variant="info" size="sm" />
        <KpiCard title="Concepts" value={data?.concepts ?? 0} icon={Layers} variant="info" size="sm" />
        <KpiCard title="Interpretations" value={data?.interpretations ?? 0} icon={Brain} variant="info" size="sm" />
        <KpiCard title="Graph Edges" value={data?.graph_edges ?? 0} icon={GitBranch} variant="info" size="sm" />
      </motion.div>

      {/* Charts Grid */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entity Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Entity Distribution</CardTitle>
            </div>
            <Badge variant="secondary" size="sm">All time</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {chartData.filter(d => d.value > 0).map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
