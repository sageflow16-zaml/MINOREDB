// Why this file exists: @tanstack/react-query refetches when the options
// object identity changes. Pages that pass inline queryFn closures together
// with inline queryKey arrays would otherwise refetch on every render.
// This wrapper memoizes options on [queryKey entries, enabled], breaking the
// loop while preserving queryKey-driven invalidation. It is wired in as the
// `@tanstack/react-query` import via vite.config.ts alias and is covered by
// the frontend test suite (useStableQuery tests). Do not remove without
// verifying refetch behavior across pages.
import { useMemo } from 'react';
import {
  useQuery as originalUseQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  type UseQueryOptions,
  type QueryKey,
  type UseQueryResult,
} from '@tanstack/react-query-real';

function useQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  const { queryKey, enabled } = options;
  const stableOptions = useMemo(
    () => options,
    // Spread queryKey and enabled as deps so the object is only recreated when meaningful deps change
    [...(Array.isArray(queryKey) ? queryKey : [queryKey]), enabled],
  );
  return originalUseQuery(stableOptions);
}

export {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
};
export type {
  UseQueryOptions,
  QueryKey,
  UseQueryResult,
};
