import { useWorkspace } from '../workspace/WorkspaceContext';
import { Wallet, Lock } from 'lucide-react';

export function ExecutionPanel() {
  const { state } = useWorkspace();
  const previewMode = state.layout.previewMode;

  if (previewMode) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <Wallet className="w-3 h-3" /> Execution
        </h3>
        <div className="flex flex-col items-center justify-center gap-2 py-4 px-2 border border-dashed border-border rounded-lg bg-muted/20">
          <Lock className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-2xs text-muted-foreground text-center leading-relaxed">
            Execution is disabled in preview mode. Connect a project with a live or paper-trading broker account to enable trade execution, position sizing, and risk management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <Wallet className="w-3 h-3" /> Execution
      </h3>
      <p className="text-2xs text-muted-foreground italic">Connect a broker account to begin trading.</p>
    </div>
  );
}
