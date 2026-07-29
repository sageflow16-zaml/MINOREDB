import { useMemo } from 'react';
import { Construction } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';
import { Panel } from './Panel';
import { ChartContainer } from '../chart/ChartContainer';
import { Watchlist } from '../panels/Watchlist';
import { ExecutionPanel } from '../panels/ExecutionPanel';
import { AIPanel } from '../panels/AIPanel';
import { MarketContext } from '../panels/MarketContext';
import { ChartNotes } from '../panels/ChartNotes';
import { ICTControls } from '../ict/ICTControls';
import { DrawingToolbar } from '../drawing/DrawingToolbar';
import { cn } from '../../lib/utils';

export function WorkspaceLayout() {
  const { state, dispatch } = useWorkspace();
  const { layout } = state;

  const gridStyle = useMemo(() => {
    const n = parseInt(layout.chartLayout);
    if (n <= 2) return { gridTemplateColumns: `repeat(${n}, 1fr)` };
    if (n <= 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: n > 2 ? '1fr 1fr' : '1fr' };
    if (n === 6) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' };
    return { gridTemplateColumns: '1fr 1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' };
  }, [layout.chartLayout]);

  const chartPanels = layout.panels.filter((p) => p.type === 'chart');

  return (
    <div className="flex flex-col h-full">
      {layout.previewMode && (
        <div className="flex items-center gap-2 bg-warning/10 border-b border-warning/20 px-4 py-2 shrink-0">
          <Construction className="h-4 w-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            Workspace is in preview mode. Chart data, trade execution, and AI analysis are not yet connected to live data.
          </p>
        </div>
      )}
      <div className={cn('flex-1 flex gap-0 overflow-hidden', layout.focusMode && 'bg-black/95')}>
      {/* Left sidebar - collapsed on focus */}
      {!layout.focusMode && (
        <div className="w-[280px] shrink-0 flex flex-col gap-0 border-r border-border overflow-y-auto bg-card/50">
          <div className="p-2 border-b border-border">
            <Watchlist />
          </div>
          <div className="p-2 border-b border-border">
            <ExecutionPanel />
          </div>
          <div className="p-2 border-b border-border">
            <ICTControls />
          </div>
          <div className="p-2 border-b border-border">
            <DrawingToolbar />
          </div>
          <div className="p-2">
            <ChartNotes />
          </div>
        </div>
      )}

      {/* Chart grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        {!layout.focusMode && (
          <div className="shrink-0">
            {/* WorkspaceToolbar is rendered in the page layout */}
          </div>
        )}
        {/* Charts */}
        <div className="flex-1 grid gap-1 p-1 overflow-hidden" style={gridStyle}>
          {chartPanels.map((panel) => (
            <Panel key={panel.id} panel={panel}>
              <ChartContainer panelId={panel.id} config={layout.chartConfigs[panel.id]} />
            </Panel>
          ))}
        </div>
      </div>

      {/* Right sidebar */}
      {!layout.focusMode && (
        <div className="w-[320px] shrink-0 flex flex-col border-l border-border overflow-y-auto bg-card/50">
          <div className="p-2 border-b border-border">
            <AIPanel previewMode={layout.previewMode} />
          </div>
          <div className="p-2 flex-1">
            <MarketContext />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
