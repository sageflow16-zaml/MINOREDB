import { QueryCache, type Query } from '@tanstack/react-query-real';
import { reportError, breadcrumb } from './observability';

export { reportError, breadcrumb };

const reportedFailures = new Set<string>();

/**
 * React Query global telemetry.
 *
 * Attaches an onError handler to the shared QueryCache (v5 supports the
 * QueryCacheConfig.onError callback) so EVERY query failure — auth errors,
 * API failures, empty/slow responses — surfaces as a Sentry event tagged
 * with the operation (queryKey[0]) and route. No payload data is ever
 * attached: only the operation name, status category and route.
 *
 * Dedup: onError fires once per failed ATTEMPT (retry: 1 means up to two
 * events per failure). We report only the first failure per query key and
 * clear the marker as soon as that query succeeds, so a burst of retries
 * produces one error event and a later recovery produces one breadcrumb.
 */
export function createQueryTelemetryCache() {
  return new QueryCache({
    onError: (error, query: Query<unknown, unknown, unknown>) => {
      const hash = query.queryHash;
      const [operation] = query.queryKey as unknown[];
      const op = typeof operation === 'string' ? operation : 'unknown-query';
      const route = typeof window !== 'undefined' ? window.location.pathname : '';
      if (!reportedFailures.has(hash)) {
        reportedFailures.add(hash);
        reportError(error, {
          category: 'query',
          operation: op,
          route,
        });
      }
    },
    onSuccess: (_data, query: Query<unknown, unknown, unknown>) => {
      reportedFailures.delete(query.queryHash);
      const [operation] = query.queryKey as unknown[];
      breadcrumb('query', 'query resolved', {
        operation: typeof operation === 'string' ? operation : 'unknown-query',
      });
    },
  });
}