import { WorkspaceProvider } from '../components/workspace/WorkspaceContext';
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout';

export default function Workspace() {
  return (
    <WorkspaceProvider>
      <WorkspaceLayout />
    </WorkspaceProvider>
  );
}
