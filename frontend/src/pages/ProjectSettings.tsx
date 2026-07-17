import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useUpdateProject, useDeleteProject } from '../hooks/useProjectMutations';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const { setProjectId } = useProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (projectId && confirm('Are you sure?')) {
      await deleteProject.mutateAsync(projectId);
      setProjectId(null);
      navigate('/projects');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Project Settings" />
      <div className="p-6 border rounded dark:border-slate-800">
        <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
        <Button variant="destructive" onClick={handleDelete}>Delete Project</Button>
      </div>
    </div>
  );
}
