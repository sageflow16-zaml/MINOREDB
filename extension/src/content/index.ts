import { TradeObserver } from './observer';
import { detectTrades, extractAllTrades } from './detector';
import { captureViewport } from './screenshot';
import { showNotesModal } from './notesModal';
import { logger } from '../shared/logger';
import { getSettings } from '../shared/storage';
import type { TradeData, TradeNotes } from '../shared/types';

let observer: TradeObserver | null = null;
let lastDetectedTrade: TradeData | null = null;
let saveButton: HTMLElement | null = null;

async function init(): Promise<void> {
  await logger.info('Content script loaded on FXReplay');

  const settings = await getSettings();
  injectStyles();

  observer = new TradeObserver((trade) => {
    lastDetectedTrade = trade;
    showSaveButton(trade);
    notifyTradeDetected(trade);
  });

  observer.start();

  const initial = detectTrades();
  if (initial.found && initial.trade) {
    lastDetectedTrade = initial.trade;
    showSaveButton(initial.trade);
  }
}

function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .minore-save-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      transition: all 0.2s ease;
      animation: minore-slide-up 0.3s ease-out;
    }
    .minore-save-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }
    .minore-save-btn:active { transform: translateY(0); }
    .minore-save-btn--disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .minore-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: minore-slide-up 0.2s ease-out;
    }
    .minore-toast--success { background: #22c55e; color: white; }
    .minore-toast--error { background: #ef4444; color: white; }
    @keyframes minore-slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

function showSaveButton(trade: TradeData): void {
  if (saveButton) {
    saveButton.remove();
    saveButton = null;
  }

  const btn = document.createElement('button');
  btn.className = 'minore-save-btn';
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Minore`;

  btn.addEventListener('click', async () => {
    btn.classList.add('minore-save-btn--disabled');
    btn.innerHTML = 'Opening notes...';

    try {
      const summary = `${trade.pair} ${trade.direction.toUpperCase()} | Entry: ${trade.entryPrice} Exit: ${trade.exitPrice}${trade.pnl != null ? ` | P&L: ${trade.pnl >= 0 ? '+' : ''}${trade.pnl}` : ''}`;

      const notes = await showNotesModal(summary);
      if (!notes) {
        btn.classList.remove('minore-save-btn--disabled');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Minore`;
        return;
      }

      btn.innerHTML = 'Capturing screenshot...';
      const screenshot = await captureViewport();
      const screenshots = [{
        dataUrl: screenshot.dataUrl,
        timestamp: screenshot.timestamp,
        label: 'exit' as const,
      }];

      btn.innerHTML = 'Saving...';
      const enriched: TradeData = {
        ...trade,
        strategy: notes.strategy,
        emotion: notes.emotion,
        confidence: notes.confidence,
        mistake: notes.mistake,
        notes: notes.notes,
      };

      const response = await sendSaveTrade(enriched, screenshots);

      if (response.success) {
        btn.innerHTML = 'Saved!';
        btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        showToast('Trade saved to Minore', 'success');
        setTimeout(() => btn.remove(), 2000);
      } else {
        throw new Error(response.error || 'Save failed');
      }
    } catch (err) {
      btn.classList.remove('minore-save-btn--disabled');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Minore`;
      showToast(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  });

  document.body.appendChild(btn);
  saveButton = btn;
}

function sendSaveTrade(trade: TradeData, screenshots: { dataUrl: string; timestamp: string; label: string }[]): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'SAVE_TRADE', payload: { trade, screenshots } },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { success: false, error: 'No response' });
      }
    );
  });
}

function notifyTradeDetected(trade: TradeData): void {
  chrome.runtime.sendMessage({ action: 'TRADE_DETECTED', payload: { trade } });
}

function showToast(message: string, type: 'success' | 'error'): void {
  const toast = document.createElement('div');
  toast.className = `minore-toast minore-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'PING':
      sendResponse({ success: true, data: { active: true } });
      break;
    case 'GET_DETECTED_TRADES':
      sendResponse({ success: true, data: { current: lastDetectedTrade, all: extractAllTrades() } });
      break;
    case 'MANUAL_CAPTURE': {
      captureViewport().then((s) => sendResponse({ success: true, data: s })).catch((e) => sendResponse({ success: false, error: e.message }));
      return true;
    }
    default:
      sendResponse({ success: false, error: `Unknown action: ${message.action}` });
  }
});

init().catch((err) => {
  console.error('[Minore] Content script init error:', err);
});
