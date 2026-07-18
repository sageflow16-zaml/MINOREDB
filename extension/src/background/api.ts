import { getSettings } from '../shared/storage';
import { logger } from '../shared/logger';
import { API_TIMEOUT_MS } from '../shared/constants';
import { getAuthHeaders } from './auth';
import type { TradeData, ScreenshotData } from '../shared/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function mapTradeToPayload(trade: TradeData, screenshots?: ScreenshotData[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    pair: trade.pair || null,
    direction: trade.direction || null,
    entry_price: trade.entryPrice ?? null,
    exit_price: trade.exitPrice ?? null,
    stop_loss: trade.stopLoss ?? null,
    take_profit: trade.takeProfit ?? null,
    position_size: trade.positionSize ?? null,
    pnl: trade.pnl ?? null,
    rr: trade.rr ?? null,
    result: trade.pnl != null ? (trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'breakeven') : null,
    status: 'closed',
    emotion: trade.emotion || null,
  };

  let notes = trade.notes || '';
  if (trade.strategy) notes = `Strategy: ${trade.strategy}\n${notes}`.trim();
  if (trade.mistake) notes = `${notes}\nMistake: ${trade.mistake}`.trim();
  if (trade.confidence != null) notes = `${notes}\nConfidence: ${trade.confidence}/10`.trim();
  payload.notes = notes || null;

  if (screenshots && screenshots.length > 0) {
    const before = screenshots.find((s) => s.label === 'entry' || s.label === 'chart');
    const after = screenshots.find((s) => s.label === 'exit');
    if (before) payload.before_image = before.dataUrl;
    if (after) payload.after_image = after.dataUrl;
  }

  return payload;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retries = 0
): Promise<ApiResponse<T>> {
  try {
    const settings = await getSettings();
    const url = `${settings.backendUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401 && retries < 1) {
      await logger.warn('Got 401, token may be expired');
      return request<T>(method, path, body, retries + 1);
    }

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `API ${response.status}: ${text}` };
    }

    const data = await response.json();
    return { success: true, data: data as T };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (retries < 2) {
      await logger.warn(`Retrying API call (attempt ${retries + 1}): ${path}`);
      await delay(1000 * (retries + 1));
      return request<T>(method, path, body, retries + 1);
    }
    return { success: false, error: msg };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function uploadTrade(
  trade: TradeData,
  projectId: string,
  screenshots?: ScreenshotData[]
): Promise<ApiResponse<{ id: string }>> {
  const payload = mapTradeToPayload(trade, screenshots);
  await logger.info('Uploading trade', { pair: trade.pair, pnl: trade.pnl });
  return request<{ id: string }>(
    'POST',
    `/api/v1/projects/${projectId}/trades`,
    payload
  );
}
