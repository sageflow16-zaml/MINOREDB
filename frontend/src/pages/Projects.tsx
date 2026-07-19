import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useProjects } from '../hooks/useProjects';
import { useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjectMutations';
import { useProject } from '../context/ProjectContext';
import { FolderKanban, Plus, ArrowRight, Pencil, Trash2, X, Calendar, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { setProjectId } = useProject();
  const { data: projects, isLoading, error, refetch } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject.mutate({ name: newName.trim(), description: newDescription.trim() });
    setNewName('');
    setNewDescription('');
    setShowCreate(false);
  };

  const handleEdit = (id: string) => {
    const p = projects?.find((x) => x.id === id);
    setEditingId(id);
    setEditingName(p?.name || '');
    setEditingDescription(p?.description || '');
  };

  const submitEdit = () => {
    if (!editingId) return;
    updateProject.mutate({ projectId: editingId, data: { name: editingName, description: editingDescription } });
    setEditingId(null);
  };

  const handleOpen = (id: string) => {
    setProjectId(id);
    navigate(`/projects/${id}/dashboard`);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading projects." onRetry={refetch} />;

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your trading research projects"
      >
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> New Project
        </Button>
      </PageHeader>

      {/* Quick Create */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm font-medium">Create New Project</CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowCreate(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Project name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={createProject.isPending || !newName.trim()} isLoading={createProject.isPending}>
                    <Plus className="mr-1.5 h-4 w-4" /> Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Grid */}
      {!projects || projects.length === 0 ? (
        <EmptyState
          message="No projects yet"
          description="Create your first project to start tracking trades and research."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any, i: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className="group cursor-pointer h-full transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => handleOpen(project.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => { e.stopPropagation(); handleEdit(project.id); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-base font-semibold line-clamp-1">
                    {project.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(project.created_at)}
                    </span>
                    {project.trade_count != null && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {project.trade_count} trades
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" size="sm">
                      {project.status || 'Active'}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-sm font-medium">Edit Project</CardTitle>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <Input value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} />
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 border-t border-border px-6 py-3">
                  <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button size="sm" onClick={submitEdit}>Save Changes</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={() => { if (deleteId) deleteProject.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
