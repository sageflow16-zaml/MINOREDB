import { useWorkspace } from './WorkspaceContext';
import { Badge } from '../ui/badge';
import {
  Focus, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceToolbar() {
  const { state, dispatch } = useWorkspace();
  const { layout } = state;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/20">
      <span className="text-sm font-semibold mr-2">Research Workspace</span>

      <div className="flex items-center gap-1 border-r border-border pr-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
          className={cn('p-1 rounded hover:bg-muted transition-colors', layout.focusMode && 'bg-muted text-primary')}
          title="Focus Mode"
        >
          <Focus className="w-4 h-4" />
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW_MODE' })}
          className={cn('p-1 rounded hover:bg-muted transition-colors', layout.previewMode && 'bg-muted text-warning')}
          title={layout.previewMode ? 'Preview Mode On' : 'Preview Mode Off'}
        >
          {layout.previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {layout.focusMode && <Badge variant="secondary" className="text-3xs">Focus</Badge>}
        {layout.previewMode && <Badge variant="outline" className="text-3xs border-warning/30 text-warning">Preview</Badge>}
      </div>
    </div>
  );
}
