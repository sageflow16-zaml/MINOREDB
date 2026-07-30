import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useProjects } from '../hooks/useProjects';
import { WorkspaceProvider } from '../components/workspace/WorkspaceContext';
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout';
import { WorkspaceToolbar } from '../components/workspace/WorkspaceToolbar';
import { FolderOpen, ChevronDown } from 'lucide-react';

export default function Workspace() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const { projectId, setProjectId } = useProject();
  const { data: projects = [] } = useProjects();
  const navigate = useNavigate();

  const activeProjectId = urlProjectId || projectId;
  const currentProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex flex-col h-full">
      {/* Header with project selector */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/20 shrink-0">
        <div className="relative group">
          <button
            onClick={() => {
              const select = document.getElementById('workspace-project-select') as HTMLSelectElement;
              if (select) select.focus();
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <span>{currentProject?.name || 'Select Project'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <select
            id="workspace-project-select"
            value={activeProjectId || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setProjectId(val);
                navigate(`/projects/${val}/workspace`, { replace: true });
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <WorkspaceToolbar />

      <WorkspaceProvider>
        <WorkspaceLayout />
      </WorkspaceProvider>
    </div>
  );
}
