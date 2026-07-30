import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { usePlaybooks, useDeletePlaybook, useCreatePlaybook } from '../hooks/usePlaybooks';
import { BookTemplate, Plus, Search, Trash2, Copy, Play, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'info' | 'destructive'> = {
  Draft: 'default', Active: 'success', Archived: 'warning',
};

const categoryOptions = ['Scalping', 'Swing', 'ICT', 'News', 'Breakout', 'Mean Reversion', 'Trend Following', 'Custom'];

export default function PlaybooksPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: playbooks, isLoading, error, refetch } = usePlaybooks(projectId!, { search: search || undefined, status: statusFilter || undefined, category: categoryFilter || undefined });
  const createPlaybook = useCreatePlaybook(projectId!);
  const deletePlaybook = useDeletePlaybook(projectId!);

  const filtered = useMemo(() => {
    if (!playbooks) return [];
    return playbooks.filter((s) => {
      if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (categoryFilter && s.category !== categoryFilter) return false;
      return true;
    });
  }, [playbooks, search, statusFilter, categoryFilter]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading playbooks." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Playbooks" description="Step-by-step trading playbooks with conditions, validation, and trade linking.">
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> New Playbook
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search playbooks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onChange={(v) => setStatusFilter(v)} placeholder="All Status" className="w-[140px]"
              options={[
                { value: '', label: 'All Status' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Active', label: 'Active' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />
            <Select value={categoryFilter} onChange={(v) => setCategoryFilter(v)} placeholder="All Categories" className="w-[160px]"
              options={[{ value: '', label: 'All Categories' }, ...categoryOptions.map((c) => ({ value: c, label: c }))]}
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No playbooks found"
          description={playbooks?.length === 0 ? 'Create your first playbook to document your trading workflow.' : 'Try adjusting filters.'}
          action={<Button size="sm" onClick={() => setShowCreate(true)}>Create Playbook</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((pb, i) => (
            <motion.div key={pb.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 h-full" onClick={() => navigate(`/projects/${projectId}/playbooks/${pb.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookTemplate className="h-4 w-4 text-muted-foreground shrink-0" />
                        <CardTitle className="text-sm font-semibold truncate">{pb.name || 'Untitled'}</CardTitle>
                        <Badge variant={statusColors[pb.status || 'Draft'] || 'default'} size="sm">{pb.status || 'Draft'}</Badge>
                      </div>
                      {pb.category && <span className="text-2xs text-muted-foreground">{pb.category}</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setDeleteId(pb.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pb.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pb.description}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5 text-3xs font-medium text-muted-foreground">
                      <ListChecks className="h-3 w-3" /> {(pb.steps || []).length} steps
                    </span>
                    {(pb.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-3xs font-medium text-primary">{tag}</span>
                    ))}
                    {(pb.linked_trades?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5 text-3xs font-medium text-muted-foreground ml-auto">
                        {(pb.linked_trades ?? []).length} trades
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteId} onCancel={() => setDeleteId(null)}
        title="Delete Playbook" message="This will permanently delete this playbook."
        confirmLabel="Delete" variant="danger"
        onConfirm={() => { if (deleteId) { deletePlaybook.mutate(deleteId); setDeleteId(null); } }}
      />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-foreground">New Playbook</h3>
            <input placeholder="Playbook name" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createPlaybook.mutate({ name: newName.trim() }, { onSuccess: (data) => { setShowCreate(false); setNewName(''); navigate(`/projects/${projectId}/playbooks/${data.id}`); } })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => newName.trim() && createPlaybook.mutate({ name: newName.trim() }, { onSuccess: (data) => { setShowCreate(false); setNewName(''); navigate(`/projects/${projectId}/playbooks/${data.id}`); } })} disabled={!newName.trim()}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
