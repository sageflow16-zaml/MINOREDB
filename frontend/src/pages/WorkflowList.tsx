import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow, useDuplicateWorkflow, useToggleWorkflow, useExecuteWorkflow } from '../hooks/useAutomation';
import { Workflow, Play, Pause, Trash2, Copy, Eye, Plus, Search, ExternalLink } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-success/10 text-success',
  paused: 'bg-warning/10 text-warning',
  archived: 'bg-muted text-muted-foreground',
};

export default function WorkflowList() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: workflows = [], isLoading, error } = useWorkflows(projectId!);
  const createWf = useCreateWorkflow(projectId!);
  const deleteWf = useDeleteWorkflow(projectId!);
  const dupWf = useDuplicateWorkflow(projectId!);
  const toggleWf = useToggleWorkflow(projectId!);
  const execWf = useExecuteWorkflow(projectId!);

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWf.mutate({ name: newName }, { onSuccess: (data) => { setShowNewForm(false); setNewName(''); navigate(`/projects/${projectId}/automation/workflows/${data.id}`); } });
  };

  const columns = [
    { id: 'name', header: 'Name', accessor: (row: Record<string, unknown>) => (
      <Link to={`/projects/${projectId}/automation/workflows/${row.id}`} className="font-medium hover:text-primary transition-colors">{row.name as string}</Link>
    )},
    { id: 'status', header: 'Status', accessor: (row: Record<string, unknown>) => <Badge className={statusColors[row.status as string] || ''}>{row.status as string}</Badge> },
    { id: 'category', header: 'Category', accessor: (row: Record<string, unknown>) => row.category ? <Badge variant="info">{row.category as string}</Badge> : '-' },
    { id: 'version', header: 'Version', accessor: 'version' },
    { id: 'usage_count', header: 'Runs', accessor: 'usage_count' },
    { id: 'updated_at', header: 'Updated', accessor: (row: Record<string, unknown>) => row.updated_at ? new Date(row.updated_at as string).toLocaleDateString() : '-' },
    { id: 'actions', header: 'Actions', accessor: (row: Record<string, unknown>) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => execWf.mutate({ id: row.id as string })} title="Execute"><Play className="w-3.5 h-3.5 text-success" /></Button>
        <Button size="icon" variant="ghost" onClick={() => toggleWf.mutate(row.id as string)} title="Toggle active/paused"><Pause className="w-3.5 h-3.5 text-warning" /></Button>
        <Button size="icon" variant="ghost" onClick={() => dupWf.mutate(row.id as string)} title="Duplicate"><Copy className="w-3.5 h-3.5" /></Button>
        <Button size="icon" variant="ghost" onClick={() => navigate(`/projects/${projectId}/automation/workflows/${row.id}`)} title="View"><Eye className="w-3.5 h-3.5" /></Button>
        <Button size="icon" variant="ghost" onClick={() => deleteWf.mutate(row.id as string)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    )},
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load workflows" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Create, manage, and execute automated trading workflows"
        actions={
          <Button onClick={() => setShowNewForm(true)}><Plus className="w-4 h-4 mr-2" />New Workflow</Button>
        }
      />

      {showNewForm && (
        <Card>
          <CardHeader><CardTitle>Create Workflow</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Workflow name" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
              <Button onClick={handleCreate} disabled={!newName.trim() || createWf.isPending}>Create</Button>
              <Button variant="ghost" onClick={() => setShowNewForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search workflows..." className="pl-9" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} />
      ) : (
        <EmptyState title="No workflows" message={searchTerm ? 'No workflows match your search' : 'Create your first workflow to start automating'} />
      )}
    </motion.div>
  );
}
