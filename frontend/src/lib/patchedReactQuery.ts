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
