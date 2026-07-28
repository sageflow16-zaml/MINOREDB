import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { CommandPalette } from '../components/ui/CommandPalette';
import { Toaster } from '../components/ui/toast';
import { ErrorFallback } from '../components/ui/ErrorFallback';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard, BarChart3, TrendingUp, Notebook, Plus, Sparkles,
  Search, CandlestickChart, LineChart, Target, Network,
  Layers, MessageSquare, AlertTriangle, Lightbulb, PieChart, Globe, Zap,
  Database, Settings as SettingsIcon, Activity, FileText, RefreshCw,
  Library,
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

interface NavEntry {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
}

const allPageRoutes: { section: string; items: { label: string; path: string; icon: LucideIcon; shortcut?: string }[] }[] = [
  {
    section: 'Workspace',
    items: [{ label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard, shortcut: 'D' }],
  },
  {
    section: 'Trading',
    items: [
      { label: 'Trades', path: 'trades', icon: BarChart3, shortcut: 'T' },
      { label: 'Journal', path: 'learning', icon: Notebook, shortcut: 'G J' },
      { label: 'Strategies', path: 'strategies', icon: Lightbulb },
      { label: 'Replay', path: 'replay', icon: RefreshCw },
    ],
  },
  {
    section: 'Research',
    items: [
      { label: 'Market Structure', path: 'market-structure', icon: CandlestickChart },
      { label: 'AI Analyst', path: 'analyst', icon: Sparkles, shortcut: 'A' },
      { label: 'Research Engine', path: 'research', icon: Search },
      { label: 'Similarity', path: 'similarity', icon: LineChart },
      { label: 'Decision Support', path: 'decision', icon: Target },
      { label: 'Knowledge Graph', path: 'knowledge-graph', icon: Network },
    ],
  },
  {
    section: 'Knowledge',
    items: [
      { label: 'Sources', path: 'sources', icon: FileText },
      { label: 'Claims', path: 'claims', icon: Layers },
      { label: 'Interpretations', path: 'interpretations', icon: MessageSquare },
      { label: 'Conflicts', path: 'conflicts', icon: AlertTriangle },
      { label: 'Hypotheses', path: 'hypotheses', icon: Lightbulb },
      { label: 'Knowledge Center', path: 'knowledge-center', icon: Library },
      { label: 'Trader Intelligence', path: 'trader-intelligence', icon: Zap },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { label: 'Statistics', path: 'statistics', icon: PieChart, shortcut: 'G S' },
      { label: 'Analytics', path: 'analytics', icon: Activity },
      { label: 'Macro', path: 'macro', icon: Globe },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Settings', path: 'settings', icon: SettingsIcon },
      { label: 'Integrations (MT5)', path: 'mt5', icon: Database },
      { label: 'Global Search', path: 'search', icon: Search },
      { label: 'Collectors', path: 'collectors', icon: Zap },
    ],
  },
];

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { projectId } = useProject();
  const navigate = useNavigate();

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

  const quickActions = useMemo<QuickAction[]>(() => [
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
  ], [go]);

  const commandGroups = useMemo(() => projectId
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
        ...allPageRoutes.map((section) => ({
          label: section.section,
          items: section.items.map((item) => ({
            id: `nav-${item.path}`,
            label: item.label,
            description: `Navigate to ${item.label}`,
            icon: item.icon,
            shortcut: item.shortcut,
            onSelect: () => go(item.path),
          })),
        })),
      ]
    : [], [projectId, go]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      if (!projectId) return;

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
    <div className="flex h-screen overflow-hidden bg-[#09090B]">
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

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        groups={commandGroups}
      />

      <Toaster />

      {projectId && (
        <div className="fixed bottom-6 right-6 z-fixed lg:hidden">
          <button
            onClick={() => go('trades')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4F46E5] text-[#FAFAFA] shadow-lg shadow-[#4F46E5]/30 hover:bg-[#4F46E5]/90 active:scale-95 transition-all"
            aria-label="Quick trade"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export { PageLoader } from '../components/ui/Spinner';
