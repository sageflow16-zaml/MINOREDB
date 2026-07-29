import { Construction } from 'lucide-react';
import { WorkspaceProvider } from '../components/workspace/WorkspaceContext';
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout';

export default function Workspace() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 bg-warning/10 border-b border-warning/20 px-4 py-2 shrink-0">
        <Construction className="h-4 w-4 text-warning shrink-0" />
        <p className="text-xs text-warning">
          Workspace is in preview mode. Chart data, trade execution, and AI analysis are not yet connected to live data.
        </p>
      </div>
      <WorkspaceProvider>
        <WorkspaceLayout />
      </WorkspaceProvider>
    </div>
  );
}
