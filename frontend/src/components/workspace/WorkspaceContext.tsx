import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type {
  WorkspaceState, WorkspaceLayout, WorkspacePanel, ChartConfig,
  ICTOverlay, SessionOverlay, Drawing, ChartNote, PanelId,
  ChartLayout, Symbol, Timeframe, DrawingPoint, WatchlistItem,
} from './types';

const defaultPanels = (layout: ChartLayout): WorkspacePanel[] => {
  const charts: WorkspacePanel[] = [];
  const n = parseInt(layout);
  const cols = n <= 2 ? n : 2;
  const rows = Math.ceil(n / cols);
  const w = 100 / cols;
  const h = 100 / rows;

  for (let i = 0; i < n; i++) {
    charts.push({
      id: `chart-${i}`,
      type: 'chart',
      label: `Chart ${i + 1}`,
      x: (i % cols) * w,
      y: Math.floor(i / cols) * h,
      width: i === n - 1 && n % cols !== 0 ? w * (n % cols) : w,
      height: h,
      minimized: false,
      floating: false,
      zIndex: 0,
    });
  }
  return charts;
};

const defaultChartConfig = (symbol: string): ChartConfig => ({
  symbol,
  timeframe: '1h',
  indicators: [],
  showICT: false,
  showSessions: false,
  drawings: [],
});

const defaultICT = (): ICTOverlay[] => [
  { type: 'fvg', visible: true, color: 'hsl(var(--success))', opacity: 0.15 },
  { type: 'order_block', visible: true, color: 'hsl(var(--info))', opacity: 0.2 },
  { type: 'breaker_block', visible: true, color: 'hsl(var(--danger))', opacity: 0.2 },
  { type: 'mitigation_block', visible: true, color: 'hsl(var(--warning))', opacity: 0.2 },
  { type: 'bpr', visible: true, color: 'hsl(var(--chart-4))', opacity: 0.15 },
  { type: 'liquidity_pool', visible: true, color: 'hsl(var(--chart-5))', opacity: 0.2 },
  { type: 'equal_high', visible: true, color: 'hsl(var(--chart-2))', opacity: 0.3 },
  { type: 'equal_low', visible: true, color: 'hsl(var(--chart-3))', opacity: 0.3 },
  { type: 'premium_discount', visible: true, color: 'hsl(var(--chart-1))', opacity: 0.1 },
  { type: 'pdh', visible: true, color: 'hsl(var(--chart-4))', opacity: 0.5 },
  { type: 'pdl', visible: true, color: 'hsl(var(--chart-4))', opacity: 0.5 },
  { type: 'weekly_hl', visible: true, color: 'hsl(var(--chart-5))', opacity: 0.4 },
  { type: 'monthly_hl', visible: true, color: 'hsl(var(--chart-3))', opacity: 0.4 },
];

const defaultSession = (): SessionOverlay[] => [
  { session: 'asia', visible: true, color: 'hsl(var(--chart-1))', opacity: 0.06 },
  { session: 'london', visible: true, color: 'hsl(var(--warning))', opacity: 0.06 },
  { session: 'new_york', visible: true, color: 'hsl(var(--danger))', opacity: 0.06 },
  { session: 'kill_zone_asia', visible: false, color: 'hsl(var(--chart-1))', opacity: 0.1 },
  { session: 'kill_zone_london', visible: false, color: 'hsl(var(--warning))', opacity: 0.1 },
  { session: 'kill_zone_new_york', visible: false, color: 'hsl(var(--danger))', opacity: 0.1 },
  { session: 'silver_bullet', visible: false, color: 'hsl(var(--success))', opacity: 0.08 },
  { session: 'power_of_three', visible: false, color: 'hsl(var(--chart-4))', opacity: 0.08 },
  { session: 'opening_range', visible: false, color: 'hsl(var(--chart-2))', opacity: 0.08 },
];

const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'XAGUSD', 'BTCUSD'];

const NOTES_STORAGE_KEY = 'minore_workspace_notes';
const WATCHLIST_STORAGE_KEY = 'minore_workspace_watchlist';

const createDefaultLayout = (): WorkspaceLayout => {
  const panels = defaultPanels('4');
  const configs: Record<string, ChartConfig> = {
    'chart-main': defaultChartConfig('EURUSD'),
  };
  panels.forEach((p, i) => {
    configs[p.id] = defaultChartConfig(symbols[i % symbols.length]);
  });
  return {
    id: 'default',
    name: 'Default 4-Chart',
    chartLayout: '4',
    panels,
    chartConfigs: configs,
    activeTheme: 'dark',
    focusMode: false,
    compactMode: false,
    previewMode: true,
  };
};

function loadPersistedNotes(): ChartNote[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistNotes(notes: ChartNote[]) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

function loadPersistedWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return symbols.map((s) => ({ symbol: s, name: s, last: 0, change: 0, changePercent: 0 }));
}

function persistWatchlist(items: WatchlistItem[]) {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

type Action =
  | { type: 'SET_LAYOUT'; layout: ChartLayout }
  | { type: 'UPDATE_PANEL'; panelId: PanelId; updates: Partial<WorkspacePanel> }
  | { type: 'SET_CHART_CONFIG'; panelId: PanelId; config: Partial<ChartConfig> }
  | { type: 'SET_SYMBOL'; panelId: PanelId; symbol: Symbol }
  | { type: 'SET_TIMEFRAME'; panelId: PanelId; timeframe: Timeframe }
  | { type: 'TOGGLE_ICT'; panelId: PanelId }
  | { type: 'TOGGLE_SESSION'; panelId: PanelId }
  | { type: 'SET_ICT_OVERLAY'; panelId: PanelId; overlays: ICTOverlay[] }
  | { type: 'TOGGLE_ICT_OVERLAY'; panelId: PanelId; overlayType: string }
  | { type: 'ADD_DRAWING'; panelId: PanelId; drawing: Drawing }
  | { type: 'REMOVE_DRAWING'; panelId: PanelId; drawingId: string }
  | { type: 'ADD_NOTE'; note: ChartNote }
  | { type: 'REMOVE_NOTE'; noteId: string }
  | { type: 'SYNC_SYMBOL'; symbol: Symbol }
  | { type: 'SYNC_TIMEFRAME'; timeframe: Timeframe }
  | { type: 'TOGGLE_CROSSHAIR' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'TOGGLE_PREVIEW_MODE' }
  | { type: 'SAVE_LAYOUT'; name: string }
  | { type: 'LOAD_LAYOUT'; layoutId: string }
  | { type: 'DELETE_LAYOUT'; layoutId: string }
  | { type: 'SET_ACTIVE_PANEL'; panelId: PanelId | null }
  | { type: 'SET_WATCHLIST'; items: WatchlistItem[] };

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'SET_LAYOUT': {
      const panels = defaultPanels(action.layout);
      const configs: Record<string, ChartConfig> = {};
      panels.forEach((p, i) => {
        const existing = state.layout.chartConfigs[p.id];
        configs[p.id] = existing || defaultChartConfig(symbols[i % symbols.length]);
      });
      return {
        ...state,
        layout: { ...state.layout, chartLayout: action.layout, panels, chartConfigs: configs },
      };
    }
    case 'UPDATE_PANEL': {
      const panels = state.layout.panels.map((p) =>
        p.id === action.panelId ? { ...p, ...action.updates } : p
      );
      return { ...state, layout: { ...state.layout, panels } };
    }
    case 'SET_CHART_CONFIG': {
      const configs = { ...state.layout.chartConfigs };
      configs[action.panelId] = { ...configs[action.panelId], ...action.config };
      return { ...state, layout: { ...state.layout, chartConfigs: configs } };
    }
    case 'SET_SYMBOL': {
      const configs = { ...state.layout.chartConfigs };
      configs[action.panelId] = { ...configs[action.panelId], symbol: action.symbol };
      return { ...state, layout: { ...state.layout, chartConfigs: configs } };
    }
    case 'SET_TIMEFRAME': {
      const configs = { ...state.layout.chartConfigs };
      configs[action.panelId] = { ...configs[action.panelId], timeframe: action.timeframe };
      return { ...state, layout: { ...state.layout, chartConfigs: configs } };
    }
    case 'TOGGLE_ICT': {
      const configs = { ...state.layout.chartConfigs };
      configs[action.panelId] = { ...configs[action.panelId], showICT: !configs[action.panelId]?.showICT };
      return { ...state, layout: { ...state.layout, chartConfigs: configs } };
    }
    case 'TOGGLE_SESSION': {
      const configs = { ...state.layout.chartConfigs };
      configs[action.panelId] = { ...configs[action.panelId], showSessions: !configs[action.panelId]?.showSessions };
      return { ...state, layout: { ...state.layout, chartConfigs: configs } };
    }
    case 'SET_ICT_OVERLAY':
      return { ...state, ictOverlays: { ...state.ictOverlays, [action.panelId]: action.overlays } };
    case 'TOGGLE_ICT_OVERLAY': {
      const current = state.ictOverlays[action.panelId] || [];
      return {
        ...state,
        ictOverlays: {
          ...state.ictOverlays,
          [action.panelId]: current.map((o) =>
            o.type === action.overlayType ? { ...o, visible: !o.visible } : o
          ),
        },
      };
    }
    case 'ADD_DRAWING': {
      const drawings = { ...state.drawings };
      drawings[action.panelId] = [...(drawings[action.panelId] || []), action.drawing];
      return { ...state, drawings };
    }
    case 'REMOVE_DRAWING': {
      const drawings = { ...state.drawings };
      drawings[action.panelId] = (drawings[action.panelId] || []).filter((d) => d.id !== action.drawingId);
      return { ...state, drawings };
    }
    case 'ADD_NOTE': {
      const updatedNotes = [...state.notes, action.note];
      persistNotes(updatedNotes);
      return { ...state, notes: updatedNotes };
    }
    case 'REMOVE_NOTE': {
      const updatedNotes = state.notes.filter((n) => n.id !== action.noteId);
      persistNotes(updatedNotes);
      return { ...state, notes: updatedNotes };
    }
    case 'SET_WATCHLIST': {
      persistWatchlist(action.items);
      return { ...state, watchlist: action.items };
    }
    case 'SYNC_SYMBOL': {
      if (!state.syncedSymbol) return state;
      const configs = { ...state.layout.chartConfigs };
      Object.keys(configs).forEach((k) => { configs[k] = { ...configs[k], symbol: action.symbol }; });
      return { ...state, syncedSymbol: action.symbol, layout: { ...state.layout, chartConfigs: configs } };
    }
    case 'SYNC_TIMEFRAME': {
      const configs = { ...state.layout.chartConfigs };
      Object.keys(configs).forEach((k) => { configs[k] = { ...configs[k], timeframe: action.timeframe }; });
      return { ...state, syncedTimeframe: action.timeframe, layout: { ...state.layout, chartConfigs: configs } };
    }
    case 'TOGGLE_CROSSHAIR':
      return { ...state, syncedCrosshair: !state.syncedCrosshair };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, fullscreen: !state.fullscreen };
    case 'TOGGLE_FOCUS_MODE':
      return { ...state, layout: { ...state.layout, focusMode: !state.layout.focusMode } };
    case 'TOGGLE_PREVIEW_MODE':
      return { ...state, layout: { ...state.layout, previewMode: !state.layout.previewMode } };
    case 'SAVE_LAYOUT': {
      const saved = { ...state.layout, id: crypto.randomUUID(), name: action.name };
      return { ...state, savedLayouts: [...state.savedLayouts, saved] };
    }
    case 'LOAD_LAYOUT': {
      const saved = state.savedLayouts.find((l) => l.id === action.layoutId);
      return saved ? { ...state, layout: saved } : state;
    }
    case 'DELETE_LAYOUT':
      return { ...state, savedLayouts: state.savedLayouts.filter((l) => l.id !== action.layoutId) };
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.panelId };
    default:
      return state;
  }
}

function initState(): WorkspaceState {
  const layout = createDefaultLayout();
  const ict: Record<string, ICTOverlay[]> = {};
  const sessions: Record<string, SessionOverlay[]> = {};
  layout.panels.forEach((p) => {
    ict[p.id] = defaultICT();
    sessions[p.id] = defaultSession();
  });
  return {
    layout,
    savedLayouts: [],
    charts: {},
    activePanel: null,
    syncedSymbol: null,
    syncedTimeframe: null,
    syncedCrosshair: false,
    ictOverlays: ict,
    sessionOverlays: sessions,
    drawings: {},
    notes: loadPersistedNotes(),
    execution: {
      account: 'Demo',
      balance: 100000,
      equity: 100500,
      currentRisk: 1.5,
      positionSize: 0,
      openPositions: [],
      pendingOrders: [],
    },
    watchlist: loadPersistedWatchlist(),
    hotkeys: {},
    fullscreen: false,
  };
}

const WorkspaceCtx = createContext<{
  state: WorkspaceState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  return <WorkspaceCtx.Provider value={{ state, dispatch }}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
