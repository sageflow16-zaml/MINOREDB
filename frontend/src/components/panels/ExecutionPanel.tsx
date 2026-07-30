import { useParams, useNavigate } from 'react-router-dom';
import { Wallet, Lock } from 'lucide-react';
import { useWorkspace } from '../workspace/WorkspaceContext';

export function ExecutionPanel() {
  const { state } = useWorkspace();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const previewMode = state.layout.previewMode;

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <Wallet className="w-3.5 h-3.5" /> Execution
      </h3>
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20">
        <Lock className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
          {!projectId
            ? 'Select a project and connect a broker account to enable trade execution.'
            : 'Execution requires a live or paper-trading broker account. Configure one in Project Settings.'}
        </p>
        <button
          onClick={() => navigate(projectId ? `/projects/${projectId}/settings` : '/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Wallet className="w-3.5 h-3.5" />
          {projectId ? 'Project Settings' : 'Select Project'}
        </button>
      </div>
    </div>
  );
}
