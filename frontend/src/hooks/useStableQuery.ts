import { useMemo } from 'react';
import { useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query';

export function useStableQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) {
  const stableOptions = useMemo(() => options, [
    JSON.stringify(options.queryKey),
    options.enabled,
  ]);
  return useQuery(stableOptions);
}
