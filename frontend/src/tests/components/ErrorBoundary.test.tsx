import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary as RQErrorBoundary } from 'react-error-boundary';
import { ErrorBoundary as AppErrorBoundary } from '../../components/ErrorBoundary';
import { useState } from 'react';

const Boom = ({ onCrash }: { onCrash?: () => void }) => {
  onCrash?.();
  throw new Error('boom');
};

const Stable = () => <div>STABLE_PAGE</div>;

const Fallback = ({ resetErrorBoundary }: { resetErrorBoundary?: () => void }) => (
  <div>
    FALLBACK
    {resetErrorBoundary && <button onClick={resetErrorBoundary}>TRY_AGAIN</button>}
  </div>
);

const TestApp = () => {
  const location = useLocation();
  return (
    <RQErrorBoundary resetKeys={[location.pathname]} FallbackComponent={Fallback}>
      <Routes>
        <Route path="/broken" element={<Boom />} />
        <Route path="/fine" element={<Stable />} />
      </Routes>
    </RQErrorBoundary>
  );
};

const NavApp = () => {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/broken')}>GO_BROKEN</button>
      <button onClick={() => navigate('/fine')}>GO_FINE</button>
      <TestApp />
    </>
  );
};

describe('MainLayout error boundary pattern (resetKeys on pathname)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows the fallback when a page crashes', () => {
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <NavApp />
      </MemoryRouter>
    );
    expect(screen.getByText('FALLBACK')).toBeInTheDocument();
  });

  it('resets automatically when the user navigates away from the crashed page', () => {
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <NavApp />
      </MemoryRouter>
    );
    expect(screen.getByText('FALLBACK')).toBeInTheDocument();

    fireEvent.click(screen.getByText('GO_FINE'));

    expect(screen.getByText('STABLE_PAGE')).toBeInTheDocument();
    expect(screen.queryByText('FALLBACK')).not.toBeInTheDocument();
  });

  it('does not reset without a navigation (crash state persists until retry)', () => {
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <NavApp />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('TRY_AGAIN'));
    expect(screen.getByText('FALLBACK')).toBeInTheDocument();
  });
});

describe('App-level ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const CrashToggle = () => {
    const [crash, setCrash] = useState(false);
    let attempts = 0;
    // Simulates a transient failure (e.g. a one-off lazy chunk load error):
    // the component throws once, then renders fine on the next attempt.
    const Flaky = () => {
      attempts += 1;
      if (attempts === 1) throw new Error('transient');
      return <div>RECOVERED</div>;
    };
    return (
      <AppErrorBoundary>
        {crash ? <Flaky /> : (
          <button onClick={() => setCrash(true)}>CRASH</button>
        )}
      </AppErrorBoundary>
    );
  };

  it('recovers via Try again without a page reload', () => {
    render(<CrashToggle />);
    fireEvent.click(screen.getByText('CRASH'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('RECOVERED')).toBeInTheDocument();
  });
});
