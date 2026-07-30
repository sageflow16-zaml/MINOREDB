import { useMemo } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { ChartContainer } from '../chart/ChartContainer';
import { Watchlist } from '../panels/Watchlist';
import { AIPanel } from '../panels/AIPanel';
import { MarketContext } from '../panels/MarketContext';
import { ExecutionPanel } from '../panels/ExecutionPanel';
import { ChartNotes } from '../panels/ChartNotes';
import { ActiveResearch } from '../panels/ActiveResearch';
import { cn } from '../../lib/utils';
import type { ChartLayout } from './types';

const GRID_COLS: Record<ChartLayout, number> = { '1': 1, '2': 2, '4': 2, '6': 3, '8': 4 };
const GRID_ROWS: Record<ChartLayout, number> = { '1': 1, '2': 1, '4': 2, '6': 2, '8': 2 };

export function WorkspaceLayout() {
  const { state } = useWorkspace();
  const { layout } = state;

  const chartPanels = useMemo(
    () => layout.panels.filter((p) => p.type === 'chart'),
    [layout.panels]
  );

  const cols = GRID_COLS[layout.chartLayout] || 2;
  const rows = GRID_ROWS[layout.chartLayout] || 2;

  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden bg-background', layout.focusMode && 'bg-black/95')}>
      {/* Chart Grid */}
      <div
        className="flex-1 min-h-0 border-b border-border"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {chartPanels.map((panel) => (
          <div key={panel.id} className="border-r border-b border-border min-h-0 overflow-hidden">
            <ChartContainer
              panelId={panel.id}
              config={layout.chartConfigs[panel.id] || { symbol: 'EURUSD', timeframe: '1h', indicators: [], showICT: false, showSessions: false, drawings: [] }}
            />
          </div>
        ))}
        {/* Fill empty cells if chart count < grid cells */}
        {chartPanels.length < cols * rows &&
          Array.from({ length: cols * rows - chartPanels.length }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b border-border flex items-center justify-center bg-muted/10">
              <span className="text-xs text-muted-foreground/40">Empty</span>
            </div>
          ))}
      </div>

      {/* Row 2: Watchlist | AI Analyst | Research Context */}
      {!layout.focusMode && (
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border shrink-0" style={{ height: '30%', minHeight: 180, maxHeight: 260 }}>
          <div className="p-2 overflow-y-auto">
            <Watchlist />
          </div>
          <div className="p-2 overflow-y-auto">
            <AIPanel previewMode={layout.previewMode} />
          </div>
          <div className="p-2 overflow-y-auto">
            <MarketContext previewMode={layout.previewMode} />
          </div>
        </div>
      )}

      {/* Row 3: Journal | Notes | Execution */}
      {!layout.focusMode && (
        <div className="grid grid-cols-3 divide-x divide-border shrink-0" style={{ height: '20%', minHeight: 120, maxHeight: 180 }}>
          <div className="p-2 overflow-y-auto">
            <ChartNotes />
          </div>
          <div className="p-2 overflow-y-auto">
            <ActiveResearch />
          </div>
          <div className="p-2 overflow-y-auto">
            <ExecutionPanel />
          </div>
        </div>
      )}
    </div>
  );
}
