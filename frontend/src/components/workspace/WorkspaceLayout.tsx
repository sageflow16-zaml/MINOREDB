import { useWorkspace } from './WorkspaceContext';
import { ChartContainer } from '../chart/ChartContainer';
import { Watchlist } from '../panels/Watchlist';
import { AIPanel } from '../panels/AIPanel';
import { MarketContext } from '../panels/MarketContext';
import { ExecutionPanel } from '../panels/ExecutionPanel';
import { ChartNotes } from '../panels/ChartNotes';
import { ActiveResearch } from '../panels/ActiveResearch';
import { cn } from '../../lib/utils';

export function WorkspaceLayout() {
  const { state } = useWorkspace();
  const { layout } = state;

  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden bg-background', layout.focusMode && 'bg-black/95')}>
      {/* Row 1: Main Chart */}
      <div className="flex-1 min-h-0 border-b border-border">
        <ChartContainer
          panelId="chart-main"
          config={layout.chartConfigs['chart-main'] || { symbol: 'EURUSD', timeframe: '1h', indicators: [], showICT: false, showSessions: false, drawings: [] }}
        />
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
