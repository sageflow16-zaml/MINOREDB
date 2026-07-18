import {
  getQueue,
  addToQueue,
  updateQueuedTrade,
  removeFromQueue,
  getSettings,
} from '../shared/storage';
import { logger } from '../shared/logger';
import { uploadTrade } from './api';
import type { QueuedTrade, TradeData, ScreenshotData } from '../shared/types';

let isProcessing = false;

export async function enqueueTrade(
  trade: TradeData,
  screenshots?: ScreenshotData[]
): Promise<QueuedTrade> {
  const queued: QueuedTrade = {
    id: crypto.randomUUID(),
    trade,
    screenshots,
    status: 'pending',
    retryCount: 0,
    lastAttempt: null,
    createdAt: Date.now(),
  };

  await addToQueue(queued);
  await logger.info('Trade queued', { id: queued.id, pair: trade.pair });

  processQueue();

  return queued;
}

export async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const queue = await getQueue();
    const settings = await getSettings();
    const pending = queue.filter(
      (t) => t.status === 'pending' || t.status === 'failed' || t.status === 'retrying'
    );

    if (pending.length === 0) {
      return;
    }

    await logger.info(`Processing queue: ${pending.length} items`);

    for (const item of pending) {
      if (item.retryCount >= settings.maxRetries) {
        await updateQueuedTrade(item.id, {
          status: 'failed',
          error: 'Max retries exceeded',
          lastAttempt: Date.now(),
        });
        continue;
      }

      if (!settings.projectId) {
        await updateQueuedTrade(item.id, {
          status: 'failed',
          error: 'No project configured',
          lastAttempt: Date.now(),
        });
        continue;
      }

      await updateQueuedTrade(item.id, {
        status: 'uploading',
        lastAttempt: Date.now(),
      });

      const result = await uploadTrade(item.trade, settings.projectId, item.screenshots);

      if (result.success) {
        await removeFromQueue(item.id);
        await logger.info('Trade uploaded successfully', {
          id: item.id,
          responseId: result.data?.id,
        });
      } else {
        const retryCount = item.retryCount + 1;
        await updateQueuedTrade(item.id, {
          status: retryCount >= settings.maxRetries ? 'failed' : 'retrying',
          retryCount,
          error: result.error,
          lastAttempt: Date.now(),
        });
        await logger.warn('Trade upload failed', {
          id: item.id,
          error: result.error,
          retry: retryCount,
        });
      }
    }
  } catch (err) {
    await logger.error('Queue processing error', err);
  } finally {
    isProcessing = false;
  }
}

export async function retryFailed(): Promise<number> {
  const queue = await getQueue();
  const settings = await getSettings();
  const failed = queue.filter(
    (t) => t.status === 'failed' && t.retryCount < settings.maxRetries
  );

  for (const item of failed) {
    await updateQueuedTrade(item.id, { status: 'retrying' });
  }

  if (failed.length > 0) {
    processQueue();
  }

  return failed.length;
}
