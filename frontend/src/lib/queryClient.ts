import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client.
 * Sensible defaults for the Minore app:
 * - staleTime 60s: data is considered fresh for a minute; refetches happen
 *   only for older data, so window-focus refetch cannot hammer the backend.
 * - refetchOnWindowFocus: true, refetchOnReconnect: true — pages recover
 *   automatically after tab restore, idle periods, offline→online and
 *   network blips without requiring a browser reload.
 * - retry 1 with capped exponential backoff: transient network errors get
 *   one retry; permanent errors (auth/4xx) surface quickly.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});