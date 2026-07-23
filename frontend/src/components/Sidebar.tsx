import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../lib/animate';
import {
  LayoutDashboard, BarChart3, BookOpen, Brain, Database, Settings,
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
import { useNavigate as useNavigate_ } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { clearAllTokens } from '../auth/tokenStorage';
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
    items: [{ name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Trading',
    icon: BarChart3,
    items: [
      { name: 'Trades', path: 'trades', icon: BarChart3 },
      { name: 'Workspace', path: 'workspace', icon: Monitor },
      { name: 'Journal', path: 'learning', icon: Notebook },
      { name: 'Strategies', path: 'strategies', icon: Lightbulb },
      { name: 'Replay', path: 'replay', icon: RefreshCw },
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
      { name: 'Sources', path: 'sources', icon: FileText },
      { name: 'Claims', path: 'claims', icon: Layers },
      { name: 'Interpretations', path: 'interpretations', icon: MessageSquare },
      { name: 'Conflicts & RQs', path: 'conflicts', icon: AlertTriangle },
      { name: 'Hypotheses', path: 'hypotheses', icon: Lightbulb },
      { name: 'Knowledge Center', path: 'knowledge-center', icon: Library },
      { name: 'Trader Intelligence', path: 'trader-intelligence', icon: Zap },
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
  const { user } = useAuth();
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
  const [recentItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-recent');
    return saved ? JSON.parse(saved) : [];
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

  const currentPath = '/' + location.pathname.split('/').slice(3).join('/');

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

  const recentItemsFiltered = useMemo(
    () => recentItems
      .map((p) => allNavItems.find((item) => item.path === p))
      .filter(Boolean) as NavItem[],
    [recentItems]
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-spring',
          collapsed ? 'w-[68px]' : 'w-64',
          'lg:static',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className={cn(
          'flex h-14 items-center shrink-0 border-b border-sidebar-muted/20',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}>
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/25">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/25">
                  <Layers className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-semibold tracking-tight">Minore</span>
                  <p className="text-[10px] text-sidebar-foreground/40 leading-tight">Trading OS</p>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-sidebar-foreground/30 hover:text-sidebar-foreground/70 transition-colors"
                aria-label="Toggle sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 text-sidebar-foreground/30 hover:text-sidebar-foreground/70 transition-colors shrink-0"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {/* Project Selector */}
        {!collapsed && (
          <div className="px-3 py-3 shrink-0">
            <select
              value={projectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full rounded-lg border border-sidebar-muted/20 bg-sidebar-muted/10 px-3 py-2 text-xs text-sidebar-foreground/80 outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Favorites (expanded) */}
        {!collapsed && favoritedItems.length > 0 && (
          <>
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-semibold tracking-wider text-sidebar-foreground/30 uppercase">Favorites</p>
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
                          'group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all',
                          active
                            ? 'bg-sidebar-active/10 text-sidebar-active font-medium'
                            : 'text-sidebar-foreground/50 hover:bg-sidebar-muted/15 hover:text-sidebar-foreground/80'
                        )
                      }
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate text-xs">{item.name}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.path); }}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-sidebar-foreground/20 hover:text-warning transition-all"
                        aria-label="Remove from favorites"
                      >
                        <Star className="h-3 w-3 fill-warning text-warning" />
                      </button>
                    </NavLink>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-sidebar-muted/10 mx-3" />
          </>
        )}

        {!collapsed && <div className="border-t border-sidebar-muted/20 shrink-0" />}

        {/* Navigation */}
        <ScrollArea className={cn('flex-1', collapsed ? 'px-2 py-2' : 'px-3 py-2')}>
          <nav className="flex flex-col gap-0.5">
            {projectId
              ? navSections.map((section) => (
                  <div key={section.title}>
                    {collapsed ? (
                      <div className="flex flex-col items-center gap-1 py-2">
                        {section.items.slice(0, 1).map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={`/projects/${projectId}/${item.path}`}
                              onClick={onClose}
                              className={({ isActive: active }) =>
                                cn(
                                  'relative flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                                  active
                                    ? 'bg-sidebar-active/15 text-sidebar-active'
                                    : 'text-sidebar-foreground/40 hover:bg-sidebar-muted/20 hover:text-sidebar-foreground/70'
                                )
                              }
                              title={section.title}
                            >
                              <Icon className="h-5 w-5" />
                              {isActive(item.path) && currentSection === section && (
                                <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-sidebar-active" />
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
                            'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors group'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <section.icon className="h-3.5 w-3.5" />
                            <span>{section.title}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 transition-transform text-sidebar-foreground/20',
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
                              transition={prefersReduced ? { duration: 0.1 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-0.5 pb-1 pl-2">
                                {section.items.map((item) => {
                                  const Icon = item.icon;
                                  const isFav = favorites.includes(item.path);
                                  return (
                                    <NavLink
                                      key={item.path}
                                      to={`/projects/${projectId}/${item.path}`}
                                      onClick={onClose}
                                      className={({ isActive: active }) =>
                                        cn(
                                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                                          active
                                            ? 'bg-sidebar-active/10 text-sidebar-active font-medium'
                                            : 'text-sidebar-foreground/50 hover:bg-sidebar-muted/15 hover:text-sidebar-foreground/80'
                                        )
                                      }
                                    >
                                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                      <span className="truncate text-xs flex-1">{item.name}</span>
                                      {item.badge && (
                                        <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                          {item.badge}
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.path); }}
                                        className={cn(
                                          'opacity-0 group-hover:opacity-100 transition-all shrink-0',
                                          isFav ? 'text-warning opacity-100' : 'text-sidebar-foreground/20 hover:text-warning'
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
                    <FolderOpen className="h-8 w-8 text-sidebar-foreground/20" />
                    <p className="text-xs text-sidebar-foreground/40">Select a project to begin</p>
                  </div>
                )}
          </nav>
        </ScrollArea>

        {/* Bottom — User Profile */}
        <div className={cn(
          'border-t border-sidebar-muted/20 shrink-0',
          collapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
        )}>
          {collapsed ? (
            <>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-muted/20 hover:text-sidebar-foreground/70 transition-all"
                aria-label="Search"
                onClick={() => {
                  const e = new KeyboardEvent('keydown', { metaKey: true, key: 'k' });
                  window.dispatchEvent(e);
                }}
              >
                <Search className="h-4 w-4" />
              </button>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold" title={displayName}>
                {initials}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sidebar-muted/10 transition-colors group">
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-muted/20">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground/80 truncate">{displayName}</p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate">
                  {user?.email || 'View profile'}
                </p>
              </div>
              <button
                className="text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Logout"
                onClick={() => {
                  clearAllTokens();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
});
