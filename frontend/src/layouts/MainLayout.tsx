import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { ErrorFallback } from '../components/ui/ErrorFallback';
import { PageLoader } from '../components/ui/Spinner';

/**
 * Application shell: responsive sidebar + topbar wrapping the routed content.
 * Provides global error and loading UI for the authenticated area.
 */
export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile sidebar on viewport resize to desktop.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
              <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
            )}
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export { PageLoader };