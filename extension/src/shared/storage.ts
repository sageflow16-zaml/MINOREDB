import { STORAGE_KEYS, DEFAULT_SETTINGS, MAX_QUEUE_SIZE, MAX_LOG_ENTRIES, LOG_RETENTION_DAYS } from './constants';
import type { AuthState, ExtensionSettings, QueuedTrade, LogEntry } from './types';

function get<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

function set<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

export async function getAuth(): Promise<AuthState | undefined> {
  return get<AuthState>(STORAGE_KEYS.AUTH);
}

export async function setAuth(auth: AuthState): Promise<void> {
  return set(STORAGE_KEYS.AUTH, auth);
}

export async function clearAuth(): Promise<void> {
  return set(STORAGE_KEYS.AUTH, undefined);
}

export async function getSettings(): Promise<ExtensionSettings> {
  const saved = await get<ExtensionSettings>(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function updateSettings(
  partial: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await set(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

export async function getQueue(): Promise<QueuedTrade[]> {
  return (await get<QueuedTrade[]>(STORAGE_KEYS.QUEUE)) || [];
}

export async function addToQueue(trade: QueuedTrade): Promise<QueuedTrade[]> {
  const queue = await getQueue();
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift();
  }
  queue.push(trade);
  await set(STORAGE_KEYS.QUEUE, queue);
  return queue;
}

export async function updateQueuedTrade(
  id: string,
  updates: Partial<QueuedTrade>
): Promise<QueuedTrade[]> {
  const queue = await getQueue();
  const index = queue.findIndex((t) => t.id === id);
  if (index === -1) return queue;
  queue[index] = { ...queue[index], ...updates };
  await set(STORAGE_KEYS.QUEUE, queue);
  return queue;
}

export async function removeFromQueue(id: string): Promise<QueuedTrade[]> {
  const queue = await getQueue();
  const filtered = queue.filter((t) => t.id !== id);
  await set(STORAGE_KEYS.QUEUE, filtered);
  return filtered;
}

export async function clearQueue(): Promise<void> {
  await set(STORAGE_KEYS.QUEUE, []);
}

export async function getLogs(): Promise<LogEntry[]> {
  return (await get<LogEntry[]>(STORAGE_KEYS.LOGS)) || [];
}

export async function addLog(entry: LogEntry): Promise<void> {
  const logs = await getLogs();
  logs.push(entry);

  const cutoff = Date.now() - LOG_RETENTION_DAYS * 86400000;
  const filtered = logs.filter((l) => l.timestamp > cutoff).slice(-MAX_LOG_ENTRIES);

  await set(STORAGE_KEYS.LOGS, filtered);
}
