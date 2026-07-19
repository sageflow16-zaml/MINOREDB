import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { CommandPalette } from '../components/ui/CommandPalette';
import { Toaster } from '../components/ui/toast';
import { ErrorFallback } from '../components/ui/ErrorFallback';
import { PageLoader } from '../components/ui/Spinner';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Notebook,
  Plus,
  Sparkles,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  shortcut: string;
  action: () => void;
}

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { projectId } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  const go = useCallback(
    (path: string) => {
      if (projectId) {
        navigate(`/projects/${projectId}/${path}`);
      } else {
        navigate('/projects');
      }
    },
    [projectId, navigate]
  );

  const quickActions: QuickAction[] = [
    {
      id: 'new-trade',
      label: 'New Trade',
      description: 'Record a trade in the journal',
      icon: Plus,
      shortcut: 'T',
      action: () => go('trades'),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Go to project dashboard',
      icon: LayoutDashboard,
      shortcut: 'D',
      action: () => go('dashboard'),
    },
    {
      id: 'trades',
      label: 'Trades',
      description: 'View trading journal',
      icon: BarChart3,
      shortcut: 'G T',
      action: () => go('trades'),
    },
    {
      id: 'journal',
      label: 'Journal',
      description: 'View learning journal',
      icon: Notebook,
      shortcut: 'G J',
      action: () => go('learning'),
    },
    {
      id: 'analyst',
      label: 'AI Analyst',
      description: 'Ask the AI analyst a question',
      icon: Sparkles,
      shortcut: 'A',
      action: () => go('analyst'),
    },
    {
      id: 'statistics',
      label: 'Statistics',
      description: 'View trading performance metrics',
      icon: TrendingUp,
      shortcut: 'G S',
      action: () => go('statistics'),
    },
  ];

  const commandGroups = projectId
    ? [
        {
          label: 'Quick Actions',
          items: quickActions.map((a) => ({
            id: a.id,
            label: a.label,
            description: a.description,
            icon: a.icon,
            shortcut: a.shortcut,
            onSelect: a.action,
          })),
        },
        {
          label: 'Navigate',
          items: [
            { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, onSelect: () => go('dashboard') },
            { id: 'nav-trades', label: 'Trades', icon: BarChart3, onSelect: () => go('trades') },
            { id: 'nav-journal', label: 'Journal', icon: Notebook, onSelect: () => go('learning') },
            { id: 'nav-analyst', label: 'AI Analyst', icon: Sparkles, onSelect: () => go('analyst') },
            { id: 'nav-statistics', label: 'Statistics', icon: TrendingUp, onSelect: () => go('statistics') },
            { id: 'nav-search', label: 'Search', icon: Search, onSelect: () => go('search') },
          ],
        },
      ]
    : [];

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // ⌘K / Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      if (!projectId) return;

      // Single-key shortcuts (not typing in inputs)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            go('dashboard');
            break;
          case 't':
            e.preventDefault();
            go('trades');
            break;
          case 'a':
            e.preventDefault();
            go('analyst');
            break;
          case '?':
            e.preventDefault();
            setPaletteOpen(true);
            break;
        }
      }

      // ⌘1-9 → project routes
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const routes = ['dashboard', 'trades', 'learning', 'analyst', 'statistics', 'market-structure', 'sources', 'knowledge-graph', 'settings'];
        const idx = parseInt(e.key) - 1;
        if (idx < routes.length) go(routes[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [projectId, go]);

  return (
    <div className="flex h-screen overflow-hidden bg-background select-none">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onCommandPalette={() => setPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
              <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
            )}
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        groups={commandGroups}
      />

      {/* Toast Container */}
      <Toaster />

      {/* Quick Action FAB (mobile) */}
      {projectId && (
        <div className="fixed bottom-6 right-6 z-40 lg:hidden">
          <button
            onClick={() => go('trades')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
            aria-label="Quick trade"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export { PageLoader };
