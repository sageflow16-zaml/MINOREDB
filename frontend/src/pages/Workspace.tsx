import { WorkspaceProvider } from '../components/workspace/WorkspaceContext';
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout';

export default function Workspace() {
  return (
    <div className="flex flex-col h-full">
      <WorkspaceProvider>
        <WorkspaceLayout />
      </WorkspaceProvider>
    </div>
  );
}
