import { useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useProjects } from '../hooks/useProjects';
import { WorkspaceProvider, useWorkspace } from '../components/workspace/WorkspaceContext';
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout';
import { WorkspaceToolbar } from '../components/workspace/WorkspaceToolbar';
import { ChartContainer } from '../components/chart/ChartContainer';
import { FolderOpen, ChevronDown, BarChart3, Settings } from 'lucide-react';

function WorkspaceContent({ hasProject }: { hasProject: boolean }) {
  const { state, dispatch } = useWorkspace();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (hasProject && state.layout.previewMode) {
      dispatch({ type: 'TOGGLE_PREVIEW_MODE' });
    }
    initialized.current = true;
  }, [hasProject, state.layout.previewMode, dispatch]);

  if (!hasProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-8">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-base font-semibold">No Project Selected</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Select a project from the dropdown above to view your workspace charts.
          </p>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            To use live market data, ensure your Supabase project has a valid
            Twelve Data API key in the project secrets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <ChartContainer
        panelId="diag-chart"
        config={{ symbol: 'EURUSD', timeframe: '1h', indicators: [], showICT: false, showSessions: false, drawings: [] }}
      />
    </div>
  );
}

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

      <WorkspaceProvider>
        <WorkspaceContent hasProject={!!activeProjectId} />
      </WorkspaceProvider>
    </div>
  );
}
