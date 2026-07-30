import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../lib/animate';
import {
  LayoutDashboard, BarChart3,   BookOpen, BookTemplate, Brain, Database, Settings,
  ChevronDown, Search, LogOut, PanelLeftClose, PanelLeft, Activity,
  CandlestickChart, Sparkles, LineChart, Target, Network, Layers,
  MessageSquare, AlertTriangle, Lightbulb, PieChart, Globe, Zap,
  RefreshCw, Library, ScrollText, GraduationCap, Notebook, UserCircle2,
  FolderOpen, FileText, Star, Clock, MoreHorizontal, Shield, Calendar, Bot, BookMarked,
  Radar, Bell, Link2, FlaskConical, Beaker, Dices, Heart,
  Workflow, GitBranch, BellRing, DollarSign, TrendingUp, Repeat, Briefcase,
  Wifi, TestTube, ExternalLink, Monitor, Cpu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useProjects } from '../hooks/useProjects';
import { cn } from '../lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuth } from '../auth/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Workspace',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
      { name: 'Timeline', path: 'timeline', icon: Clock },
    ],
  },
  {
    title: 'Trading',
    icon: BarChart3,
    items: [
      { name: 'Trades', path: 'trades', icon: BarChart3 },
      { name: 'Workspace', path: 'workspace', icon: Monitor },
      { name: 'Journal', path: 'learning', icon: Notebook },
      { name: 'Strategies', path: 'strategies', icon: Lightbulb },
      { name: 'Playbooks', path: 'playbooks', icon: BookTemplate },
      // Replay hidden behind feature flag — not yet implemented
      { name: 'Planning', path: 'planning', icon: Calendar },
    ],
  },
  {
    title: 'Research',
    icon: Brain,
    items: [
      { name: 'Market Structure', path: 'market-structure', icon: CandlestickChart },
      { name: 'AI Analyst', path: 'analyst', icon: Sparkles },
      { name: 'ICT Engine', path: 'ict', icon: Brain },
      { name: 'Research Engine', path: 'research', icon: Search },
      { name: 'Similarity', path: 'similarity', icon: LineChart },
      { name: 'Decision Support', path: 'decision', icon: Target },
      { name: 'Knowledge Graph', path: 'knowledge-graph', icon: Network },
      { name: 'Knowledge Engine', path: 'knowledge-engine', icon: Network },
    ],
  },
  {
    title: 'Trading Brain',
    icon: Brain,
    items: [
      { name: 'Brain Dashboard', path: 'brain', icon: Brain },
      { name: 'Personal DNA', path: 'brain', icon: UserCircle2 },
    ],
  },
  {
    title: 'Intelligence OS',
    icon: Cpu,
    items: [
      { name: 'Agent Fleet', path: 'intelligence', icon: Cpu },
    ],
  },
  {
    title: 'Knowledge',
    icon: BookOpen,
    items: [
      { name: 'Library', path: 'sources', icon: Library },
      { name: 'Research', path: 'research', icon: Brain },
      { name: 'Collections', path: 'collections', icon: FolderOpen },
      { name: 'Notes', path: 'notes', icon: FileText },
      { name: 'Bookmarks', path: 'bookmarks', icon: BookMarked },
      { name: 'Graph', path: 'graph', icon: Network },
    ],
  },
  {
    title: 'Analytics',
    icon: Activity,
    items: [
      { name: 'Statistics', path: 'statistics', icon: PieChart },
      { name: 'Performance', path: 'performance', icon: BarChart3 },
      { name: 'Risk', path: 'risk', icon: Shield },
      { name: 'Analytics', path: 'analytics', icon: Activity },
      { name: 'Macro', path: 'macro', icon: Globe },
    ],
  },
  {
    title: 'Portfolio',
    icon: Briefcase,
    items: [
      { name: 'Dashboard', path: 'portfolio', icon: LayoutDashboard },
      { name: 'Accounts', path: 'portfolio/accounts', icon: DollarSign },
      { name: 'Brokers', path: 'portfolio/brokers', icon: Globe },
      { name: 'Analytics', path: 'portfolio/analytics', icon: TrendingUp },
      { name: 'Risk', path: 'portfolio/risk', icon: Shield },
      { name: 'Allocations', path: 'portfolio/allocations', icon: PieChart },
      { name: 'Transfers', path: 'portfolio/transfers', icon: Repeat },
      { name: 'Goals', path: 'portfolio/goals', icon: Target },
      { name: 'Reports', path: 'portfolio/reports', icon: FileText },
    ],
  },
  {
    title: 'AI Coach',
    icon: Bot,
    items: [
      { name: 'Dashboard', path: 'ai', icon: BarChart3 },
      { name: 'Coach', path: 'ai/coach', icon: Sparkles },
      { name: 'Profile', path: 'ai/profile', icon: Brain },
      { name: 'Knowledge', path: 'ai/knowledge', icon: Network },
      { name: 'Copilot', path: 'copilot', icon: Sparkles },
    ],
  },
  {
    title: 'Automation',
    icon: Workflow,
    items: [
      { name: 'Dashboard', path: 'automation', icon: LayoutDashboard },
      { name: 'Workflows', path: 'automation/workflows', icon: GitBranch },
      { name: 'Rules', path: 'automation/rules', icon: Shield },
      { name: 'Scheduler', path: 'automation/jobs', icon: Clock },
      { name: 'Notifications', path: 'automation/notifications', icon: BellRing },
      { name: 'Templates', path: 'automation/templates', icon: Layers },
      { name: 'Connectors', path: 'automation/connectors', icon: Globe },
      { name: 'Reports', path: 'automation/reports', icon: BarChart3 },
      { name: 'Audit Log', path: 'automation/audit', icon: Activity },
    ],
  },
  {
    title: 'Broker Hub',
    icon: Wifi,
    items: [
      { name: 'Dashboard', path: 'broker', icon: LayoutDashboard },
      { name: 'Analytics', path: 'broker/analytics', icon: BarChart3 },
      { name: 'New Connection', path: 'broker/setup', icon: TestTube },
    ],
  },
  {
    title: 'Research Lab',
    icon: FlaskConical,
    items: [
      { name: 'Dashboard', path: 'quant-research', icon: Beaker },
      { name: 'Experiments', path: 'quant-research/experiments', icon: FlaskConical },
      { name: 'Backtest Lab', path: 'quant-research/backtests', icon: BarChart3 },
      { name: 'Simulations', path: 'quant-research/simulations', icon: Dices },
      { name: 'Walk-Forward', path: 'quant-research/walkforward', icon: Activity },
      { name: 'Optimization', path: 'quant-research/optimization', icon: Layers },
      { name: 'Edge Health', path: 'quant-research/edge-health', icon: Heart },
      { name: 'Notebook', path: 'quant-research/notebooks', icon: BookOpen },
    ],
  },
  {
    title: 'Obsidian',
    icon: BookMarked,
    items: [
      { name: 'Vaults', path: 'obsidian/vaults', icon: Database },
      { name: 'Sync', path: 'obsidian/sync', icon: RefreshCw },
      { name: 'Notes', path: 'obsidian/notes', icon: FileText },
      { name: 'Templates', path: 'obsidian/templates', icon: ScrollText },
      { name: 'Search', path: 'obsidian/search', icon: Search },
    ],
  },
  {
    title: 'Market Intel',
    icon: Radar,
    items: [
      { name: 'Dashboard', path: 'market-intel', icon: LayoutDashboard },
      { name: 'Calendar', path: 'market-intel/calendar', icon: Calendar },
      { name: 'Correlations', path: 'market-intel/correlations', icon: Link2 },
      { name: 'Liquidity', path: 'market-intel/liquidity', icon: Layers },
      { name: 'Watchlist', path: 'market-intel/watchlist', icon: Star },
      { name: 'Sessions', path: 'market-intel/sessions', icon: Clock },
      { name: 'Timeline', path: 'market-intel/timeline', icon: LineChart },
      { name: 'Alerts', path: 'market-intel/alerts', icon: Bell },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    items: [
      { name: 'Settings', path: 'settings', icon: Settings },
      { name: 'Integrations', path: 'mt5', icon: Database },
      { name: 'Search', path: 'search', icon: Search },
      { name: 'Collectors', path: 'collectors', icon: Zap },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

export const Sidebar = React.memo(({ open, onClose }: SidebarProps) => {
  const prefersReduced = useReducedMotion();
  const { projectId, setProjectId } = useProject();
  const { data: projects = [] } = useProjects();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const saved: Record<string, boolean> = {};
    navSections.forEach((s) => { saved[s.title] = true; });
    return saved;
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const displayName = user?.name || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const isActive = (path: string) => location.pathname.includes(`/${path}`);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    navigate(`/projects/${id}/dashboard`);
  };

  const toggleFavorite = (path: string) => {
    setFavorites((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) onClose();
  }, [location.pathname]);

  const currentSection = useMemo(() => {
    for (const section of navSections) {
      if (section.items.some((item) => isActive(item.path))) return section;
    }
    return null;
  }, [location.pathname]);

  const favoritedItems = useMemo(
    () => allNavItems.filter((item) => favorites.includes(item.path)),
    [favorites]
  );

  const handleAutoCollapse = () => {
    if (window.innerWidth >= 1280) {
      setCollapsed(false);
    }
  };

  useEffect(() => {
    handleAutoCollapse();
    window.addEventListener('resize', handleAutoCollapse);
    return () => window.removeEventListener('resize', handleAutoCollapse);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border',
          'bg-background text-foreground',
          'transition-all duration-300 ease-out',
          collapsed ? 'w-[60px]' : 'w-60',
          'lg:static',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className={cn(
          'flex h-14 items-center shrink-0 border-b border-border',
          collapsed ? 'justify-center' : 'justify-between px-4'
        )}>
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                  <Layers className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="leading-tight">
                  <span className="text-sm font-semibold tracking-tight text-foreground">Minore</span>
                  <p className="text-3xs text-muted leading-none mt-0.5">Trading OS</p>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-muted hover:text-secondary transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2.5 text-muted hover:text-secondary transition-colors shrink-0"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Project Selector */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <select
              value={projectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-secondary outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Favorites */}
        {!collapsed && favoritedItems.length > 0 && (
          <>
            <div className="px-3 pt-3 pb-1">
              <p className="text-3xs font-semibold tracking-widest text-muted uppercase">Favorites</p>
              <div className="mt-1 flex flex-col gap-0.5">
                {favoritedItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={`/projects/${projectId}/${item.path}`}
                      onClick={onClose}
                      className={({ isActive: active }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs transition-all',
                          active
                            ? 'bg-primary/10 text-foreground font-medium'
                            : 'text-muted hover:bg-surface hover:text-secondary'
                        )
                      }
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate flex-1">{item.name}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.path); }}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-warning transition-all"
                        aria-label="Remove from favorites"
                      >
                        <Star className="h-3 w-3 fill-warning text-warning" />
                      </button>
                    </NavLink>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border mx-3" />
          </>
        )}

        {!collapsed && <div className="border-t border-border/50 shrink-0" />}

        {/* Navigation */}
        <ScrollArea className={cn('flex-1', collapsed ? 'px-1.5 py-2' : 'px-2 py-2')}>
          <nav className="flex flex-col gap-0.5">
            {projectId
              ? navSections.map((section) => (
                  <div key={section.title}>
                    {collapsed ? (
                      <div className="flex flex-col items-center gap-0.5 py-1">
                        {section.items.slice(0, 1).map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={`/projects/${projectId}/${item.path}`}
                              onClick={onClose}
                              className={({ isActive: active }) =>
                                cn(
                                  'relative flex h-9 w-9 items-center justify-center rounded transition-all',
                                  active
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted hover:bg-surface hover:text-secondary'
                                )
                              }
                              title={section.title}
                            >
                              <Icon className="h-4 w-4" />
                              {isActive(item.path) && currentSection === section && (
                                <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3.5 w-0.5 rounded-full bg-primary" />
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleSection(section.title)}
                          className={cn(
                            'flex w-full items-center justify-between rounded px-2.5 py-1.5 transition-colors',
                            'text-3xs font-semibold tracking-widest text-muted hover:text-secondary group'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <section.icon className="h-3 w-3" />
                            <span className="uppercase">{section.title}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 transition-transform text-muted',
                              expandedSections[section.title] ? 'rotate-0' : '-rotate-90'
                            )}
                          />
                        </button>
                        <AnimatePresence>
                          {expandedSections[section.title] && (
                            <motion.div
                              initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              animate={prefersReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                              exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              transition={prefersReduced ? { duration: 0.1 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-0.5 pb-1 pl-1">
                                {section.items.map((item) => {
                                  const Icon = item.icon;
                                  const isFav = favorites.includes(item.path);
                                  const active = isActive(item.path);
                                  return (
                                    <NavLink
                                      key={item.path}
                                      to={`/projects/${projectId}/${item.path}`}
                                      onClick={onClose}
                                      className={cn(
                                        'group relative flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs transition-all',
                                        active
                                          ? 'bg-primary/10 text-foreground font-medium'
                                          : 'text-muted hover:bg-surface hover:text-secondary'
                                      )}
                                    >
                                      {active && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary" />
                                      )}
                                      <Icon className="h-3.5 w-3.5 shrink-0 ml-1" aria-hidden="true" />
                                      <span className="truncate flex-1">{item.name}</span>
                                      {item.badge && (
                                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-3xs font-medium text-primary">
                                          {item.badge}
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.path); }}
                                        className={cn(
                                          'transition-all shrink-0',
                                          isFav
                                            ? 'text-warning opacity-100'
                                            : 'opacity-0 group-hover:opacity-100 text-muted hover:text-warning'
                                        )}
                                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                      >
                                        <Star className={cn('h-3 w-3', isFav && 'fill-warning')} />
                                      </button>
                                    </NavLink>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                ))
              : !collapsed && (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <FolderOpen className="h-8 w-8 text-muted" />
                    <p className="text-xs text-muted">Select a project to begin</p>
                  </div>
                )}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className={cn(
          'border-t border-border shrink-0',
          collapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-2.5'
        )}>
          {collapsed ? (
            <>
              <button
                className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-secondary transition-all"
                aria-label="Search"
                onClick={() => {
                  const e = new KeyboardEvent('keydown', { metaKey: true, key: 'k' });
                  window.dispatchEvent(e);
                }}
              >
                <Search className="h-3.5 w-3.5" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-3xs font-bold" title={displayName}>
                {initials}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 rounded px-2 py-1.5 hover:bg-surface transition-colors group cursor-pointer">
              <Avatar className="h-7 w-7 shrink-0 ring-2 ring-border">
                <AvatarFallback className="bg-primary/20 text-primary text-3xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-secondary truncate leading-tight">{displayName}</p>
                <p className="text-3xs text-muted truncate leading-tight mt-0.5">
                  {user?.email || ''}
                </p>
              </div>
              <button
                className="text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Logout"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
});
