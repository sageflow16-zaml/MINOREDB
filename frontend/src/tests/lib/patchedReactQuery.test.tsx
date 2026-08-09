import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

/**
 * Regression protection for the patchedReactQuery wrapper.
 *
 * Several hooks build query keys with inline object literals
 * (useBroker `{ limit }`, usePortfolio `filters`, useAutomation
 * `{ enabledOnly }`, useCopilot `params`) and inline queryFn closures.
 * Those objects get a new identity on every render. The patched useQuery
 * memoizes its options on the SERIALIZED key + enabled; without that
 * (e.g. if someone "simplifies" the wrapper back to spreading the key
 * entries into useMemo deps) every re-render would re-create the options
 * object and drive refetch loops. This test pins the behavior.
 */
describe('patched useQuery option stability', () => {
  it('does not refetch when an inline object query key is recreated by a parent re-render', async () => {
    const queryFn = vi.fn().mockResolvedValue({ ok: true });

    function Component({ filters }: { filters: { limit: number } }) {
      const { data } = useQuery({
        queryKey: ['broker', 'proj-1', 'logs', { limit: filters.limit }],
        queryFn: () => queryFn(filters),
      });
      return <div>DATA:{JSON.stringify(data)}</div>;
    }

    function Harness() {
      const [version, setVersion] = useState(0);
      return (
        <>
          <button onClick={() => setVersion((v) => v + 1)}>RE_RENDER</button>
          <Component filters={{ limit: 50 + version * 0 }} />
        </>
      );
    }

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText(/DATA:/)).toBeInTheDocument());
    expect(queryFn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('RE_RENDER'));
    fireEvent.click(screen.getByText('RE_RENDER'));

    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
  });

  it('treats structurally-equal object keys as the same query', async () => {
    const queryFn = vi.fn().mockResolvedValue({ rows: [] });

    function Component({ filters }: { filters: { limit: number } }) {
       useQuery({
        queryKey: ['automation', 'proj-1', 'rules', { enabledOnly: filters.limit > 0 }],
        queryFn: () => queryFn(filters),
      });
      return <div>OK</div>;
    }

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <Component filters={{ limit: 10 }} />
      </QueryClientProvider>
    );

    rerender(
      <QueryClientProvider client={client}>
        <Component filters={{ limit: 10 }} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
  });

  it('fetches a different query when a serialized key value changes', async () => {
    const queryFn = vi.fn().mockResolvedValue({ rows: [] });

    function Component({ filters }: { filters: { limit: number } }) {
       useQuery({
        queryKey: ['broker', 'proj-1', 'logs', { limit: filters.limit }],
        queryFn: () => queryFn(filters),
      });
      return <div>OK</div>;
    }

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Component filters={{ limit: 10 }} />
      </QueryClientProvider>
    );

    render(
      <QueryClientProvider client={client}>
        <Component filters={{ limit: 99 }} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
  });
});
