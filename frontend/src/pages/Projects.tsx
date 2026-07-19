import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useProjects } from '../hooks/useProjects';
import { useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjectMutations';
import { useProject } from '../context/ProjectContext';

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

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject.mutate({ name: newName.trim(), description: newDescription.trim() });
    setNewName('');
    setNewDescription('');
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    const p = projects?.find((x) => x.id === id);
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

  return (
    <div>
      <PageHeader title="Projects">
        <div className="flex items-center gap-2">
          <input
            aria-label="Project name"
            className="border px-2 py-1 rounded"
            placeholder="New project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            aria-label="Project description"
            className="border px-2 py-1 rounded"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button
            onClick={handleCreate}
            disabled={createProject.isPending}
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {createProject.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </PageHeader>

      {!projects || projects.length === 0 ? (
        <EmptyState message="No projects found. Create one to get started." />
      ) : (
        <DataTable
          data={projects}
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Description', accessor: 'description' },
            { header: 'Created At', accessor: (row: any) => row.created_at },
            {
              header: 'Actions',
              accessor: (row: any) => (
                <div className="flex gap-2">
                  <button onClick={() => handleOpen(row.id)} className="text-blue-500">Open</button>
                  <button onClick={() => handleEdit(row.id)} className="text-slate-600">Edit</button>
                  <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
                </div>
              ),
            },
          ]}
        />
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
            <div className="space-y-2">
              <input className="w-full border px-2 py-1 rounded" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
              <input className="w-full border px-2 py-1 rounded" value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="px-3 py-1">Cancel</button>
              <button onClick={submitEdit} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        onConfirm={() => { if (deleteId) deleteProject.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
