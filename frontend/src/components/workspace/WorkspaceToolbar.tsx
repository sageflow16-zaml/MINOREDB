import { useWorkspace } from './WorkspaceContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import {
  LayoutGrid, Columns2, Grid2x2, LayoutPanelTop, LayoutPanelLeft,
  Maximize, Minimize2, Save, Monitor, Focus, Crosshair,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ChartLayout } from './types';

const layouts: { id: ChartLayout; icon: typeof LayoutGrid; label: string }[] = [
  { id: '1', icon: LayoutPanelTop, label: '1 Chart' },
  { id: '2', icon: Columns2, label: '2 Charts' },
  { id: '4', icon: Grid2x2, label: '4 Charts' },
  { id: '6', icon: LayoutPanelLeft, label: '6 Charts' },
  { id: '8', icon: LayoutGrid, label: '8 Charts' },
];

export function WorkspaceToolbar() {
  const { state, dispatch } = useWorkspace();
  const { layout } = state;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/20">
      <span className="text-sm font-semibold mr-2">Workspace</span>
      <div className="flex items-center gap-1 border-r border-border pr-2">
        {layouts.map((l) => (
          <button
            key={l.id}
            onClick={() => dispatch({ type: 'SET_LAYOUT', layout: l.id })}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors',
              layout.chartLayout === l.id && 'bg-muted text-primary'
            )}
            title={l.label}
          >
            <l.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-r border-border pr-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_CROSSHAIR' })}
          className={cn('p-1 rounded hover:bg-muted transition-colors', state.syncedCrosshair && 'bg-muted text-primary')}
          title="Sync Crosshair"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Fullscreen"
        >
          {state.fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
          className={cn('p-1 rounded hover:bg-muted transition-colors', layout.focusMode && 'bg-muted text-primary')}
          title="Focus Mode"
        >
          <Focus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => dispatch({ type: 'SAVE_LAYOUT', name: `Layout ${state.savedLayouts.length + 1}` })}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Save Layout"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {state.syncedCrosshair && <Badge variant="secondary" className="text-[10px]">Crosshair Sync</Badge>}
        {layout.focusMode && <Badge variant="secondary" className="text-[10px]">Focus</Badge>}
        <Badge variant="outline" className="text-[10px]">{layout.chartLayout}-Chart</Badge>
      </div>
    </div>
  );
}
