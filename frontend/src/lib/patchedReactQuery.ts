// Why this file exists: @tanstack/react-query refetches when the options
// object identity changes. Pages that pass inline queryFn closures together
// with inline queryKey arrays would otherwise refetch on every render.
// This wrapper memoizes options on the serialized queryKey + enabled,
// breaking the loop while preserving queryKey-driven invalidation.
//
// Serialization (JSON.stringify) is essential, not just entry identity:
// several hooks build query keys with inline object literals
// (useBroker.ts `{ limit }`, usePortfolio.ts `filters`, useCopilot.ts
// `params`, useAutomation.ts `{ enabledOnly }`). Those objects get a new
// identity on every render; spreading them into useMemo deps would defeat
// the memo and re-create the options object (and the observer work it
// triggers) on every render. JSON.stringify keys are deterministically
// ordered, so structurally-equal keys always compare equal.
//
// It is wired in as the `@tanstack/react-query` import via
// vite.config.ts alias and is covered by the frontend test suite
// (patchedReactQuery tests). Do not remove without verifying refetch
// behavior across pages.
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
  const serializedKey = JSON.stringify(queryKey);
  const stableOptions = useMemo(
    () => options,
    // Serialized key + enabled as deps: stable even when the key contains
    // inline object literals that are recreated on every render. JSON
    // stringify is deterministic for the string/enum/object keys used by
    // this codebase (no functions or BigInts appear in query keys).
    [serializedKey, enabled],
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
