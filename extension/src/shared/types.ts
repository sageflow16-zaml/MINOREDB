export interface TradeData {
  id?: string;
  pair: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  pnl?: number;
  pips?: number;
  rr?: number;
  entryDate: string;
  exitDate: string;
  session?: string;
  strategy?: string;
  emotion?: string;
  mistake?: string;
  confidence?: number;
  notes?: string;
  screenshots?: ScreenshotData[];
  labels?: string[];
  source: 'fxreplay';
  rawData?: Record<string, unknown>;
}

export interface ScreenshotData {
  dataUrl: string;
  timestamp: string;
  label: 'entry' | 'exit' | 'chart' | 'note';
}

export interface ExtensionSettings {
  backendUrl: string;
  projectId: string;
  autoCapture: boolean;
  autoSave: boolean;
  saveOnExit: boolean;
  enableNotifications: boolean;
  retryIntervalMinutes: number;
  maxRetries: number;
  debugMode: boolean;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface QueuedTrade {
  id: string;
  trade: TradeData;
  screenshots?: ScreenshotData[];
  status: 'pending' | 'uploading' | 'failed' | 'retrying';
  retryCount: number;
  lastAttempt: number | null;
  error?: string;
  createdAt: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: number;
}

export interface TradeNotes {
  strategy?: string;
  emotion?: string;
  confidence?: number;
  mistake?: string;
  notes?: string;
}

export type MessageAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_STATUS'
  | 'SAVE_TRADE'
  | 'CAPTURE_SCREENSHOT'
  | 'GET_QUEUE'
  | 'RETRY_QUEUE'
  | 'CLEAR_QUEUE'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'GET_STATUS'
  | 'TRADE_DETECTED'
  | 'PING';

export interface ExtensionMessage {
  action: MessageAction;
  payload?: Record<string, unknown>;
}

export interface ExtensionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface TradeDetectionResult {
  found: boolean;
  trade?: TradeData;
  confidence: number;
  selectors: readonly string[];
}

export interface CapturedScreenshot {
  dataUrl: string;
  tabId?: number;
  timestamp: string;
}
