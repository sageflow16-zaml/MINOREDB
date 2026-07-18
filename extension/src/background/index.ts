import { login, logout, getAuthStatus } from './auth';
import { enqueueTrade, processQueue, retryFailed } from './queue';
import { clearQueue, getQueue as loadQueue, getSettings, updateSettings } from '../shared/storage';
import { logger } from '../shared/logger';
import { QUEUE_ALARM_NAME, RETRY_ALARM_PERIOD_MINUTES, SCREENSHOT_QUALITY } from '../shared/constants';
import type { ExtensionMessage, ExtensionResponse, TradeData } from '../shared/types';

chrome.runtime.onInstalled.addListener(async () => {
  await logger.info('Extension installed');

  chrome.alarms.create(QUEUE_ALARM_NAME, {
    periodInMinutes: RETRY_ALARM_PERIOD_MINUTES,
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === QUEUE_ALARM_NAME) {
    await processQueue();
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    handleMessage(message).then(sendResponse);
    return true;
  }
);

async function handleMessage(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  try {
    switch (message.action) {
      case 'AUTH_LOGIN': {
        const { email, password } = (message.payload || {}) as Record<
          string,
          string
        >;
        if (!email || !password) {
          return { success: false, error: 'Email and password required' };
        }
        return await login(email, password);
      }

      case 'AUTH_LOGOUT': {
        await logout();
        return { success: true };
      }

      case 'AUTH_STATUS': {
        const status = await getAuthStatus();
        return { success: true, data: status };
      }

      case 'SAVE_TRADE': {
        const trade = message.payload?.trade as TradeData;
        if (!trade) {
          return { success: false, error: 'Trade data required' };
        }
        const screenshots = message.payload?.screenshots as { dataUrl: string; timestamp: string; label: string }[] | undefined;
        const queued = await enqueueTrade(trade, screenshots?.map((s) => ({ dataUrl: s.dataUrl, timestamp: s.timestamp, label: s.label as 'entry' | 'exit' | 'chart' | 'note' })));
        return { success: true, data: queued };
      }

      case 'GET_QUEUE': {
        const queue = await loadQueue();
        return { success: true, data: queue };
      }

      case 'RETRY_QUEUE': {
        const count = await retryFailed();
        return { success: true, data: { retried: count } };
      }

      case 'CLEAR_QUEUE': {
        await clearQueue();
        return { success: true };
      }

      case 'GET_SETTINGS': {
        const settings = await getSettings();
        return { success: true, data: settings };
      }

      case 'UPDATE_SETTINGS': {
        const partial = message.payload as Record<string, unknown>;
        const settings = await updateSettings(
          partial as Partial<typeof partial>
        );
        return { success: true, data: settings };
      }

      case 'GET_STATUS': {
        const auth = await getAuthStatus();
        const settings = await getSettings();
        return {
          success: true,
          data: {
            authenticated: auth.authenticated,
            projectConfigured: Boolean(settings.projectId),
            backendUrl: settings.backendUrl,
            debugMode: settings.debugMode,
          },
        };
      }

      case 'CAPTURE_SCREENSHOT': {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          return { success: false, error: 'No active tab' };
        }
        try {
          const dataUrl = await chrome.tabs.captureVisibleTab(tabs[0].windowId, {
            format: 'jpeg',
            quality: SCREENSHOT_QUALITY,
          });
          return {
            success: true,
            data: {
              dataUrl,
              tabId: tabs[0].id,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Capture failed';
          return { success: false, error: msg };
        }
      }

      case 'TRADE_DETECTED': {
        const trade = message.payload?.trade as TradeData;
        if (!trade) {
          return { success: false, error: 'Trade data required' };
        }
        const settings = await getSettings();
        if (settings.autoSave && settings.projectId) {
          await enqueueTrade(trade);
        }
        return { success: true, data: { queued: settings.autoSave } };
      }

      case 'PING': {
        return { success: true, data: { pong: true } };
      }

      default: {
        return { success: false, error: `Unknown action: ${message.action}` };
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await logger.error('Message handler error', { action: message.action, err });
    return { success: false, error: msg };
  }
}
