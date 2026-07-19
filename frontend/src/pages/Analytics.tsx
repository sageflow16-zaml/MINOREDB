import { useParams } from 'react-router-dom';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { useDashboardStats } from '../hooks/useDashboard';

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

  if (error) return <ErrorState message="Error loading analytics." onRetry={refetch} />;

  const chartData = data
    ? [
        { name: 'Sources', value: data.sources },
        { name: 'Claims', value: data.claims },
        { name: 'Concepts', value: data.concepts },
        { name: 'Interpretations', value: data.interpretations },
        { name: 'Conflicts', value: data.conflicts },
        { name: 'Questions', value: data.questions },
        { name: 'Hypotheses', value: data.hypotheses },
      ]
    : [];

  if (!chartData.length || chartData.every(d => !d.value)) {
    return <EmptyState title="No analytics data yet" description="Start adding sources and claims to see analytics." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Research Analytics" />
      <div className="p-4 border rounded dark:border-slate-800">
        <h3 className="font-bold mb-4">Entity Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
