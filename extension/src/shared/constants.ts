export const STORAGE_KEYS = {
  AUTH: 'minore_auth',
  SETTINGS: 'minore_settings',
  QUEUE: 'minore_queue',
  LOGS: 'minore_logs',
  DETECTED_TRADES: 'minore_detected_trades',
} as const;

export const DEFAULT_SETTINGS = {
  backendUrl: 'http://localhost:8000',
  projectId: '',
  autoCapture: true,
  autoSave: false,
  saveOnExit: true,
  enableNotifications: true,
  retryIntervalMinutes: 5,
  maxRetries: 5,
  debugMode: false,
};

export const QUEUE_ALARM_NAME = 'minore-retry-queue';
export const RETRY_ALARM_PERIOD_MINUTES = 1;
export const LOG_RETENTION_DAYS = 7;
export const MAX_LOG_ENTRIES = 1000;
export const MAX_QUEUE_SIZE = 200;
export const API_TIMEOUT_MS = 30000;
export const SCREENSHOT_QUALITY = 80;
export const MAX_SCREENSHOT_WIDTH = 1920;

export const FXREPLAY_DOMAINS = ['fxreplay.com'];

export const MESSAGE_ACTIONS = {
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_STATUS: 'AUTH_STATUS',
  SAVE_TRADE: 'SAVE_TRADE',
  CAPTURE_SCREENSHOT: 'CAPTURE_SCREENSHOT',
  GET_QUEUE: 'GET_QUEUE',
  RETRY_QUEUE: 'RETRY_QUEUE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_STATUS: 'GET_STATUS',
  TRADE_DETECTED: 'TRADE_DETECTED',
  PING: 'PING',
} as const;

export const DEFAULT_SELECTORS = {
  tradeTable: [
    'table.trades-table',
    'table.trade-history',
    'div.trades-list',
    '[data-testid="trade-history"]',
    '.account-history-table',
  ],
  tradeRow: [
    'tr.trade-row',
    'tr.trade-item',
    '.trade-entry',
    '[data-testid="trade-row"]',
  ],
  pairCell: [
    '.pair-cell',
    '.symbol-cell',
    'td:nth-child(1)',
    '[data-field="pair"]',
    '.currency-pair',
  ],
  directionCell: [
    '.direction-cell',
    '.type-cell',
    'td:nth-child(2)',
    '[data-field="direction"]',
    '.trade-type',
  ],
  entryCell: [
    '.entry-cell',
    '.open-price',
    'td:nth-child(3)',
    '[data-field="entry"]',
    '.open-price-cell',
  ],
  exitCell: [
    '.exit-cell',
    '.close-price',
    'td:nth-child(4)',
    '[data-field="exit"]',
    '.close-price-cell',
  ],
  pnlCell: [
    '.pnl-cell',
    '.profit-cell',
    'td:nth-child(5)',
    '[data-field="pnl"]',
    '.result-cell',
  ],
  dateCell: [
    '.date-cell',
    '.time-cell',
    'td:nth-child(6)',
    '[data-field="date"]',
    '.timestamp-cell',
  ],
  completedBadge: [
    '.closed-badge',
    '.completed-badge',
    '.status-closed',
    '[data-status="closed"]',
    '.trade-closed',
  ],
  activeBadge: [
    '.open-badge',
    '.active-badge',
    '.status-open',
    '[data-status="open"]',
    '.trade-open',
  ],
} as const;
