import { useParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { useDashboardStats } from '../hooks/useDashboard';

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading } = useDashboardStats(projectId!);

  if (isLoading) return <div>Loading...</div>;

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
