import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { cn } from '../lib/utils';
import {
  useExperiments, useCreateExperiment, useUpdateExperiment,
  useDeleteExperiment, useDuplicateExperiment,
} from '../hooks/useQuantResearch';
import {
  FlaskConical, Plus, Trash2, Copy, Edit3, Play, CheckCircle2,
  XCircle, AlertTriangle, Beaker, Eye, Brain, ArrowRight,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground border-border' },
  running: { label: 'Running', color: 'bg-primary/10 text-primary-text border-primary/20' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Failed', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground border-border' },
};

export default function QuantExperiments() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', hypothesis: '' });

  const { data: experiments = [], isLoading, error } = useExperiments(projectId!);
  const createExp = useCreateExperiment(projectId!);
  const updateExp = useUpdateExperiment(projectId!);
  const deleteExp = useDeleteExperiment(projectId!);
  const duplicateExp = useDuplicateExperiment(projectId!);

  const handleCreate = () => {
    createExp.mutate(form, {
      onSuccess: () => { setShowCreate(false); setForm({ name: '', description: '', hypothesis: '' }); },
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    updateExp.mutate({ id: editing.id, data: form }, {
      onSuccess: () => { setEditing(null); setForm({ name: '', description: '', hypothesis: '' }); },
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load experiments" />;

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', hypothesis: '' }); setShowCreate(true); };
  const openEdit = (exp: any) => { setEditing(exp); setForm({ name: exp.name, description: exp.description || '', hypothesis: exp.hypothesis || '' }); setShowCreate(true); };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Experiments"
        description="Scientific experiments to discover, validate, and optimize trading edges"
        actions={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Experiment</Button>}
      />

      {/* Create / Edit Dialog */}
      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreate(false); setEditing(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Experiment' : 'Create Experiment'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Experiment" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hypothesis</label>
                <Input value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} placeholder="e.g., Strategy performs better during trending markets" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your experiment..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
                <Button onClick={editing ? handleUpdate : handleCreate} disabled={!form.name || createExp.isPending}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => { deleteExp.mutate(deleting.id); setDeleting(null); }}
        title="Delete Experiment"
        message={`Delete "${deleting?.name}" and all associated runs?`}
      />

      {experiments.length === 0 ? (
        <EmptyState title="No experiments" message="Create your first experiment to start researching" icon={<FlaskConical className="h-6 w-6" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {experiments.map((exp) => (
            <motion.div key={exp.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <Badge className={statusConfig[exp.status]?.color || ''}>{statusConfig[exp.status]?.label || exp.status}</Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(exp)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => duplicateExp.mutate(exp.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleting(exp)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <Link to={`/projects/${projectId}/quant-research/experiments/${exp.id}`} className="block">
                <h3 className="font-semibold mb-1 group-hover:text-primary-text transition-colors">{exp.name}</h3>
                {exp.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{exp.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {exp.hypothesis_status && (
                    <Badge variant={exp.hypothesis_status === 'supported' ? 'success' : exp.hypothesis_status === 'rejected' ? 'destructive' : exp.hypothesis_status === 'inconclusive' ? 'warning' : 'outline'}>
                      {exp.hypothesis_status}
                    </Badge>
                  )}
                  {exp.confidence_score != null && (
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{(exp.confidence_score * 100).toFixed(0)}%</span>
                  )}
                  <span>v{exp.version}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-primary-text">
                  <Eye className="w-3 h-3" /> View Details <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
