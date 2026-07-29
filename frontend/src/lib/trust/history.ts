import type { HistoryPoint } from './types';

const STORAGE_PREFIX = 'minore_history_';

export function recordSnapshot(metric: string, value: number, context?: Record<string, unknown>): void {
  try {
    const snapshots = loadSnapshots(metric);
    snapshots.push({
      timestamp: new Date().toISOString(),
      value,
      label: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
    const maxSnapshots = 365;
    const trimmed = snapshots.slice(-maxSnapshots);
    localStorage.setItem(STORAGE_PREFIX + metric, JSON.stringify(trimmed));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function getHistory(metric: string, period: '7d' | '30d' | '90d' | 'all'): HistoryPoint[] {
  const snapshots = loadSnapshots(metric);
  const now = Date.now();
  const cutoffs: Record<string, number> = {
    '7d': 7 * 86400000,
    '30d': 30 * 86400000,
    '90d': 90 * 86400000,
    'all': Infinity,
  };
  const cutoff = cutoffs[period];
  return snapshots.filter((s) => now - new Date(s.timestamp).getTime() <= cutoff);
}

export function getTrend(metric: string, period: '7d' | '30d' | '90d' | 'all' = '30d'): 'improving' | 'stable' | 'declining' | 'insufficient' {
  const snapshots = getHistory(metric, period);
  if (snapshots.length < 2) return 'insufficient';

  const sorted = snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;
  const diff = last - first;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

export function getAllMetrics(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return keys;
}

function loadSnapshots(metric: string): HistoryPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + metric);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
