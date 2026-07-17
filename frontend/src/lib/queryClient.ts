import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client.
 * Sensible defaults for the Minore app: no automatic refetch on window focus
 * (to avoid hammering the backend), and retry only on transient network errors.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});