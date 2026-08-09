import {IChartApi, ISeriesApi, Time} from 'lightweight-charts';

export type PanelId = string;
export type PanelType = 'chart' | 'execution' | 'watchlist' | 'ai' | 'market' | 'notes' | 'drawing' | 'ict';
export type ChartLayout = '1' | '2' | '4' | '6' | '8';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
export type Symbol = string;

export interface WorkspacePanel {
  id: PanelId;
  type: PanelType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  floating: boolean;
  zIndex: number;
}

export interface ChartConfig {
  symbol: Symbol;
  timeframe: Timeframe;
  indicators: string[];
  showICT: boolean;
  showSessions: boolean;
  drawings: Drawing[];
}

export interface ICTOverlay {
  type: ICTOverlayType;
  visible: boolean;
  color: string;
  opacity: number;
}

export type ICTOverlayType =
  | 'fvg' | 'order_block' | 'breaker_block' | 'mitigation_block'
  | 'bpr' | 'liquidity_pool' | 'equal_high' | 'equal_low'
  | 'premium_discount' | 'pdh' | 'pdl' | 'weekly_hl' | 'monthly_hl';

export interface SessionOverlay {
  session: SessionType;
  visible: boolean;
  color: string;
  opacity: number;
}

export type SessionType =
  | 'asia' | 'london' | 'new_york'
  | 'kill_zone_asia' | 'kill_zone_london' | 'kill_zone_new_york'
  | 'silver_bullet' | 'power_of_three' | 'opening_range';

export interface Drawing {
  id: string;
  type: DrawingType;
  points: DrawingPoint[];
  color: string;
  label?: string;
  visible: boolean;
}

export type DrawingType =
  | 'trendline' | 'horizontal' | 'vertical' | 'rectangle'
  | 'fib_retracement' | 'risk_reward' | 'liquidity'
  | 'session_box' | 'bias_marker' | 'execution_marker'
  | 'screenshot_marker' | 'replay_marker';

export interface DrawingPoint {
  time: Time;
  price: number;
}

export interface TradeExecutionPanel {
  account: string;
  balance: number;
  equity: number;
  currentRisk: number;
  positionSize: number;
  openPositions: OpenPosition[];
  pendingOrders: PendingOrder[];
}

export interface OpenPosition {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  stopLoss: number;
  takeProfit: number;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  type: 'limit' | 'stop';
  direction: 'buy' | 'sell';
  volume: number;
  price: number;
}

export interface WatchlistItem {
  symbol: Symbol;
  name: string;
  last: number;
  change: number;
  changePercent: number;
}

export interface ChartNote {
  id: string;
  chartId: PanelId;
  content: string;
  priceLevel?: number;
  timestamp: number;
  tags: string[];
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  chartLayout: ChartLayout;
  panels: WorkspacePanel[];
  chartConfigs: Record<PanelId, ChartConfig>;
  activeTheme: 'dark' | 'light';
  focusMode: boolean;
  compactMode: boolean;
  previewMode: boolean;
}

export interface ChartInstance {
  chart: IChartApi;
  series: ISeriesApi<'Candlestick'>;
  container: HTMLDivElement;
}

export interface WorkspaceState {
  layout: WorkspaceLayout;
  savedLayouts: WorkspaceLayout[];
  charts: Record<PanelId, ChartInstance | null>;
  activePanel: PanelId | null;
  syncedSymbol: Symbol | null;
  syncedTimeframe: Timeframe | null;
  syncedCrosshair: boolean;
  ictOverlays: Record<PanelId, ICTOverlay[]>;
  sessionOverlays: Record<PanelId, SessionOverlay[]>;
  drawings: Record<PanelId, Drawing[]>;
  notes: ChartNote[];
  execution: TradeExecutionPanel;
  watchlist: WatchlistItem[];
  hotkeys: Record<string, string>;
  fullscreen: boolean;
}
