import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  usePlaybook, useDeletePlaybook, useUpdatePlaybook,
  useAddPlaybookStep, useUpdatePlaybookStep, useRemovePlaybookStep,
} from '../hooks/usePlaybooks';
import type { PlaybookStep } from '../api/types';
import {
  ArrowLeft, Trash2, Plus, GripVertical, Edit3, Check, X,
  ListChecks, BookTemplate, Play, Target, Shield, Brain, FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'info' | 'destructive'> = {
  Draft: 'default', Active: 'success', Archived: 'warning',
};

const STEP_TYPES: { value: PlaybookStep['type']; label: string; icon: any }[] = [
  { value: 'entry', label: 'Entry', icon: Play },
  { value: 'exit', label: 'Exit', icon: Target },
  { value: 'confirmation', label: 'Confirmation', icon: Check },
  { value: 'invalidation', label: 'Invalidation', icon: X },
  { value: 'risk', label: 'Risk', icon: Shield },
  { value: 'management', label: 'Management', icon: ListChecks },
  { value: 'psychology', label: 'Psychology', icon: Brain },
  { value: 'note', label: 'Note', icon: FileText },
];

function getStepIcon(type: PlaybookStep['type']) {
  return STEP_TYPES.find((s) => s.value === type)?.icon || ListChecks;
}

const sectionVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

function Section({ title, icon: Icon, children, delay = 0 }: { title: string; icon?: any; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay }}>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium">{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}{title}</CardTitle></CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

export default function PlaybookDetailPage() {
  const navigate = useNavigate();
  const { projectId, playbookId } = useParams<{ projectId: string; playbookId: string }>();
  const { data: pb, isLoading, error, refetch } = usePlaybook(projectId!, playbookId!);
  const updatePlaybook = useUpdatePlaybook(projectId!);
  const deletePlaybook = useDeletePlaybook(projectId!);
  const addStep = useAddPlaybookStep(projectId!);
  const updateStep = useUpdatePlaybookStep(projectId!);
  const removeStep = useRemovePlaybookStep(projectId!);

  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [newStep, setNewStep] = useState(false);
  const [stepForm, setStepForm] = useState({ title: '', description: '', type: 'entry' as PlaybookStep['type'], action: '', conditions: '', expected: '' });
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const startEdit = () => {
    if (!pb) return;
    setEditName(pb.name || '');
    setEditDesc(pb.description || '');
    setEditCategory(pb.category || '');
    setEditing(true);
  };

  const saveEdit = () => {
    if (!pb || !editName.trim()) return;
    updatePlaybook.mutate({ id: pb.id, data: { name: editName.trim(), description: editDesc, category: editCategory } });
    setEditing(false);
  };

  const handleAddStep = () => {
    if (!pb || !stepForm.title.trim()) return;
    const step: PlaybookStep = {
      id: crypto.randomUUID(),
      title: stepForm.title.trim(),
      description: stepForm.description || undefined,
      type: stepForm.type,
      action: stepForm.action || undefined,
      conditions: stepForm.conditions ? stepForm.conditions.split('\n').filter(Boolean) : undefined,
      expected: stepForm.expected || undefined,
    };
    addStep.mutate({ id: pb.id, step });
    setStepForm({ title: '', description: '', type: 'entry', action: '', conditions: '', expected: '' });
    setNewStep(false);
  };

  const toggleStepEdit = (stepId: string) => {
    setEditingStepId(editingStepId === stepId ? null : stepId);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading playbook." onRetry={refetch} />;
  if (!pb) return <EmptyState title="Playbook not found" description="This playbook may have been deleted." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(`/projects/${projectId}/playbooks`)} className="mt-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            {editing ? (
              <div className="space-y-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Playbook name" className="text-lg font-bold" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} disabled={!editName.trim()}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight">{pb.name}</h1>
                  <Badge variant={statusColors[pb.status || 'Draft'] || 'default'}>{pb.status || 'Draft'}</Badge>
                  {pb.category && <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">{pb.category}</span>}
                </div>
                {pb.description && <p className="text-sm text-muted-foreground mt-1">{pb.description}</p>}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={startEdit}><Edit3 className="h-3.5 w-3.5 mr-1" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setShowDelete(true)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
        </div>
      </div>

      {/* Status controls */}
      <div className="flex items-center gap-2">
        {['Draft', 'Active', 'Archived'].map((s) => (
          <button key={s} onClick={() => updatePlaybook.mutate({ id: pb.id, data: { status: s } })}
            className={cn('px-3 py-1 text-xs rounded-full border transition-colors', pb.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
            {s}
          </button>
        ))}
      </div>

      {/* Steps */}
      <Section title="Steps" icon={ListChecks}>
        <div className="space-y-3">
          {(pb.steps || []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No steps yet. Add your first trading step below.</p>
          ) : (
            (pb.steps || []).map((step, i) => {
              const StepIcon = getStepIcon(step.type);
              const isEditing = editingStepId === step.id;
              return (
                <div key={step.id} className="rounded-lg border border-border/50 bg-card/50 p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input defaultValue={step.title} onChange={(e) => updateStep.mutate({ id: pb.id, stepId: step.id, updates: { title: e.target.value } })} className="text-sm font-medium" />
                      <button onClick={() => setEditingStepId(null)} className="text-xs text-primary-text"><Check className="h-3 w-3 inline mr-1" />Done</button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary-text text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <StepIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{step.title}</span>
                          <Badge variant="outline" size="sm" className="text-3xs">{step.type}</Badge>
                        </div>
                        {step.description && <p className="text-xs text-muted-foreground mt-1">{step.description}</p>}
                        {step.action && <p className="text-xs text-muted-foreground mt-0.5"><span className="text-foreground">Action:</span> {step.action}</p>}
                        {step.conditions && step.conditions.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {step.conditions.map((c, ci) => (
                              <p key={ci} className="text-xs text-muted-foreground flex items-start gap-1"><span className="text-warning mt-0.5">●</span>{c}</p>
                            ))}
                          </div>
                        )}
                        {step.expected && <p className="text-xs text-success mt-0.5"><span className="text-foreground">Expected:</span> {step.expected}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleStepEdit(step.id)} className="p-1 rounded hover:bg-muted transition-colors">
                          <Edit3 className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => removeStep.mutate({ id: pb.id, stepId: step.id })} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {newStep ? (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
              <Input placeholder="Step title" value={stepForm.title} onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })} />
              <Input placeholder="Description (optional)" value={stepForm.description} onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })} />
              <Select value={stepForm.type} onChange={(v) => setStepForm({ ...stepForm, type: v as PlaybookStep['type'] })}
                options={STEP_TYPES.map((st) => ({ value: st.value, label: st.label }))} />
              <input placeholder="Action (optional)" value={stepForm.action} onChange={(e) => setStepForm({ ...stepForm, action: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Conditions (one per line, optional)" value={stepForm.conditions} onChange={(e) => setStepForm({ ...stepForm, conditions: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-16 resize-none" />
              <input placeholder="Expected outcome (optional)" value={stepForm.expected} onChange={(e) => setStepForm({ ...stepForm, expected: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setNewStep(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddStep} disabled={!stepForm.title.trim()}>Add Step</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setNewStep(true)} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
            </Button>
          )}
        </div>
      </Section>

      {/* Tags */}
      {pb.tags && pb.tags.length > 0 && (
        <Section title="Tags" delay={0.3}>
          <div className="flex flex-wrap gap-1.5">
            {pb.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-md bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary-text">{tag}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Linked resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Linked Trades" icon={Target} delay={0.4}>
          <p className="text-xs text-muted-foreground">{(pb.linked_trades || []).length} trades linked</p>
        </Section>
        <Section title="Linked Research" icon={FileText} delay={0.45}>
          <p className="text-xs text-muted-foreground">{(pb.linked_research || []).length} research items linked</p>
        </Section>
        <Section title="Linked Documents" icon={BookTemplate} delay={0.5}>
          <p className="text-xs text-muted-foreground">{(pb.linked_documents || []).length} documents linked</p>
        </Section>
      </div>

      <ConfirmDialog isOpen={showDelete} onCancel={() => setShowDelete(false)}
        title="Delete Playbook" message="This permanently deletes the playbook."
        confirmLabel="Delete" variant="danger"
        onConfirm={() => { deletePlaybook.mutate(playbookId!); navigate(`/projects/${projectId}/playbooks`); }}
      />
    </div>
  );
}
