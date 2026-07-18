import { detectTrades } from './detector';
import { logger } from '../shared/logger';
import type { TradeData } from '../shared/types';

type TradeCallback = (trade: TradeData) => void;

const DEBOUNCE_MS = 2000;
const OBSERVER_CONFIG: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'data-status', 'data-testid'],
};

export class TradeObserver {
  private observer: MutationObserver | null = null;
  private onTrade: TradeCallback;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastDetectionCount = 0;

  constructor(onTrade: TradeCallback) {
    this.onTrade = onTrade;
  }

  start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      this.handleMutation();
    });

    this.observer.observe(document.body, OBSERVER_CONFIG);

    const result = detectTrades();
    if (result.found && result.trade) {
      this.onTrade(result.trade);
    }
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private handleMutation(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const result = detectTrades();

      if (result.found && result.trade) {
        const currentCount = result.trade.pair.length + (result.trade.pnl ?? 0);
        if (currentCount !== this.lastDetectionCount) {
          this.lastDetectionCount = currentCount;
          this.onTrade(result.trade);
          logger.info('Trade detected via observer', {
            pair: result.trade.pair,
            pnl: result.trade.pnl,
          });
        }
      }
    }, DEBOUNCE_MS);
  }
}
