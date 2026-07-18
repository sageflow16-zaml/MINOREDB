import { DEFAULT_SELECTORS } from '../shared/constants';
import type { TradeData, TradeDetectionResult } from '../shared/types';

function queryFirst(selector: string, root: Document | Element): Element | null {
  const elements = root.querySelectorAll(selector);
  return elements.length > 0 ? elements[0] : null;
}

function getText(el: Element, selectors: readonly string[]): string | null {
  for (const sel of selectors) {
    const found = queryFirst(sel, el);
    if (found?.textContent) {
      const text = found.textContent.trim().replace(/\s+/g, ' ');
      if (text.length > 0) return text;
    }
  }
  return null;
}

function parsePrice(text: string): number | undefined {
  const cleaned = text.replace(/[^0-9.\-]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? undefined : val;
}

function parsePair(text: string): string {
  return text.replace(/[^A-Za-z/]/g, '').toUpperCase() || text;
}

function parseDirection(text: string): 'long' | 'short' {
  const lower = text.toLowerCase();
  if (lower.includes('short') || lower.includes('sell') || lower.includes('bear')) {
    return 'short';
  }
  return 'long';
}

function parsePnl(text: string): number | undefined {
  const cleaned = text.replace(/[^0-9.\-]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? undefined : val;
}

function parseDateTime(text: string): string {
  const cleaned = text.trim();
  if (!cleaned) return new Date().toISOString();
  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {
    // fall through
  }
  return new Date().toISOString();
}

function findCompletedTradeRows(
  root: Document | Element
): Element[] {
  const completed: Element[] = [];

  for (const tableSelector of DEFAULT_SELECTORS.tradeTable) {
    const table = queryFirst(tableSelector, root);
    if (!table) continue;

    const rows = table.querySelectorAll(
      DEFAULT_SELECTORS.tradeRow.map((s) => s).join(', ')
    );

    for (const row of Array.from(rows)) {
      const hasClosed =
        DEFAULT_SELECTORS.completedBadge.some((s) => row.querySelector(s)) ||
        row.textContent?.toLowerCase().includes('closed') ||
        row.textContent?.toLowerCase().includes('completed') ||
        row.getAttribute('data-status') === 'closed';

      const isActive =
        DEFAULT_SELECTORS.activeBadge.some((s) => row.querySelector(s)) ||
        row.textContent?.toLowerCase().includes('open') ||
        row.getAttribute('data-status') === 'open';

      if (hasClosed && !isActive) {
        completed.push(row);
      }
    }

    if (completed.length > 0) break;
  }

  return completed;
}

function extractTradeFromRow(row: Element): TradeData | null {
  const pair = getText(row, DEFAULT_SELECTORS.pairCell);
  const direction = getText(row, DEFAULT_SELECTORS.directionCell);
  const entryText = getText(row, DEFAULT_SELECTORS.entryCell);
  const exitText = getText(row, DEFAULT_SELECTORS.exitCell);
  const pnlText = getText(row, DEFAULT_SELECTORS.pnlCell);
  const dateText = getText(row, DEFAULT_SELECTORS.dateCell);

  if (!pair) return null;

  const trade: TradeData = {
    pair: parsePair(pair),
    direction: direction ? parseDirection(direction) : 'long',
    entryPrice: entryText ? parsePrice(entryText) ?? 0 : 0,
    exitPrice: exitText ? parsePrice(exitText) ?? 0 : 0,
    pnl: pnlText ? parsePnl(pnlText) : undefined,
    entryDate: parseDateTime(dateText || ''),
    exitDate: new Date().toISOString(),
    source: 'fxreplay',
    rawData: {
      pairRaw: pair,
      directionRaw: direction,
      entryRaw: entryText,
      exitRaw: exitText,
      pnlRaw: pnlText,
      dateRaw: dateText,
      html: row.innerHTML.substring(0, 500),
    },
  };

  if (trade.entryPrice && trade.exitPrice) {
    trade.pips = Math.abs(
      (trade.exitPrice - trade.entryPrice) * (trade.direction === 'long' ? 1 : -1)
    );
  }

  return trade;
}

export function detectTrades(
  root: Document | Element = document
): TradeDetectionResult {
  const rows = findCompletedTradeRows(root);

  if (rows.length === 0) {
    return { found: false, confidence: 0, selectors: [] };
  }

  const trade = extractTradeFromRow(rows[0]);

  if (!trade) {
    return { found: false, confidence: 0, selectors: [] };
  }

  return {
    found: true,
    trade,
    confidence: rows.length > 0 ? Math.min(100, rows.length * 25) : 0,
    selectors: DEFAULT_SELECTORS.tradeTable,
  };
}

export function extractAllTrades(): TradeData[] {
  const rows = findCompletedTradeRows(document);
  const trades: TradeData[] = [];

  for (const row of rows) {
    const trade = extractTradeFromRow(row);
    if (trade) trades.push(trade);
  }

  return trades;
}
