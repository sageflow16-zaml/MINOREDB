import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useReports, useCreateReport, useDeleteReport, useGenerateReport } from '../hooks/useAutomation';
import { BarChart3, Plus, Trash2, Play, FileText, Calendar } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function AutomationReports() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const { data: reports = [], isLoading, error } = useReports(projectId!);
  const createRpt = useCreateReport(projectId!);
  const deleteRpt = useDeleteReport(projectId!);
  const genRpt = useGenerateReport(projectId!);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', report_type: 'daily', format: 'markdown', schedule_cron: '' });

  const handleCreate = () => {
    createRpt.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: '', report_type: 'daily', format: 'markdown', schedule_cron: '' }); } });
  };

  const columns = [
    { id: 'name', header: 'Name', accessor: (row: Record<string, unknown>) => <span className="font-medium">{row.name as string}</span> },
    { id: 'report_type', header: 'Type', accessor: (row: Record<string, unknown>) => <Badge variant="info">{row.report_type as string}</Badge> },
    { id: 'format', header: 'Format', accessor: (row: Record<string, unknown>) => <Badge variant="outline">{row.format as string}</Badge> },
    { id: 'enabled', header: 'Enabled', accessor: (row: Record<string, unknown>) => row.enabled ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Disabled</Badge> },
    { id: 'schedule_cron', header: 'Schedule', accessor: (row: Record<string, unknown>) => row.schedule_cron ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.schedule_cron as string}</code> : '-' },
    { id: 'last_generated_at', header: 'Last Generated', accessor: (row: Record<string, unknown>) => row.last_generated_at ? new Date(row.last_generated_at as string).toLocaleString() : '-' },
    { id: 'actions', header: 'Actions', accessor: (row: Record<string, unknown>) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => genRpt.mutate(row.id as string)} title="Generate now"><Play className="w-3.5 h-3.5 text-success" /></Button>
        <Button size="icon" variant="ghost" onClick={() => deleteRpt.mutate(row.id as string)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    )},
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load report configurations" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Automated Reports"
        description="Schedule and generate daily, weekly, monthly, performance, and risk reports"
        actions={<Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Report Config</Button>}
      />

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => genRpt.mutate('daily')}><Calendar className="w-3.5 h-3.5 mr-1" />Generate Daily</Button>
        <Button variant="outline" size="sm" onClick={() => genRpt.mutate('weekly')}><Calendar className="w-3.5 h-3.5 mr-1" />Generate Weekly</Button>
        <Button variant="outline" size="sm" onClick={() => genRpt.mutate('monthly')}><Calendar className="w-3.5 h-3.5 mr-1" />Generate Monthly</Button>
        <Button variant="outline" size="sm" onClick={() => genRpt.mutate('performance')}><BarChart3 className="w-3.5 h-3.5 mr-1" />Performance</Button>
        <Button variant="outline" size="sm" onClick={() => genRpt.mutate('risk')}><BarChart3 className="w-3.5 h-3.5 mr-1" />Risk</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Report Configuration</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Daily Summary" /></div>
              <div><label className="text-xs font-medium mb-1 block">Type</label>
                <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option><option value="performance">Performance</option>
                  <option value="risk">Risk</option><option value="research">Research</option><option value="strategy">Strategy</option>
                </select>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Format</label>
                <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option value="markdown">Markdown</option><option value="pdf">PDF</option><option value="html">HTML</option>
                </select>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Schedule (cron)</label><Input value={form.schedule_cron} onChange={(e) => setForm({ ...form, schedule_cron: e.target.value })} placeholder="0 8 * * 1-5" /></div>
            </div>
            <Button onClick={handleCreate} className="mt-4" disabled={!form.name || createRpt.isPending}>Create Report Config</Button>
          </CardContent>
        </Card>
      )}

      {reports.length > 0 ? (
        <DataTable columns={columns} data={reports as unknown as Record<string, unknown>[]} />
      ) : (
        <EmptyState title="No report configurations" message="Create a report config to automate report generation" />
      )}
    </motion.div>
  );
}
