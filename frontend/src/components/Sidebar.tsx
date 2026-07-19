import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  CandlestickChart,
  BookOpen,
  Brain,
  Search,
  Settings,
  ChevronDown,
  Layers,
  LineChart,
  TrendingUp,
  PieChart,
  Calendar,
  Target,
  ListChecks,
  MessageSquare,
  Sparkles,
  Globe,
  Eye,
  User,
  Keyboard,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useProjects } from '../hooks/useProjects';
import { cn } from '../lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  title: string;
  icon?: LucideIcon;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
      { name: 'Projects', path: 'projects', icon: FolderOpen },
      { name: 'Analytics', path: 'analytics', icon: TrendingUp },
    ],
  },
  {
    title: 'Trading',
    icon: BarChart3,
    items: [
      { name: 'Trades', path: 'trades', icon: BarChart3 },
      { name: 'Journal', path: 'journal', icon: BookOpen },
      { name: 'Statistics', path: 'statistics', icon: PieChart },
      { name: 'Market Structure', path: 'market-structure', icon: CandlestickChart },
      { name: 'Trade Memory', path: 'memories', icon: Brain },
      { name: 'Similarity', path: 'similarity', icon: LineChart },
    ],
  },
  {
    title: 'Intelligence',
    icon: Sparkles,
    items: [
      { name: 'AI Analyst', path: 'analyst', icon: Sparkles },
      { name: 'Trader Intelligence', path: 'trader-intelligence', icon: Brain },
      { name: 'Decision Support', path: 'decision', icon: LineChart },
      { name: 'Learning', path: 'learning', icon: Layers },
    ],
  },
  {
    title: 'Research',
    icon: Search,
    items: [
      { name: 'Sources', path: 'sources', icon: BookOpen },
      { name: 'Concepts', path: 'concepts', icon: Layers },
      { name: 'Hypotheses', path: 'hypotheses', icon: TrendingUp },
      { name: 'Questions', path: 'questions', icon: MessageSquare },
      { name: 'Knowledge', path: 'knowledge', icon: BookOpen },
      { name: 'Knowledge Graph', path: 'knowledge-graph', icon: Eye },
      { name: 'Research Engine', path: 'research', icon: Search },
    ],
  },
  {
    title: 'Data',
    icon: Globe,
    items: [
      { name: 'Macro', path: 'macro', icon: Globe },
      { name: 'TradingView', path: 'tradingview', icon: CandlestickChart },
      { name: 'MT5', path: 'mt5', icon: BarChart3 },
      { name: 'Collectors', path: 'collectors', icon: Layers },
      { name: 'Replay', path: 'replay', icon: Eye },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    items: [
      { name: 'Search', path: 'search', icon: Search },
      { name: 'Settings', path: 'settings', icon: Settings },
    ],
  },
];

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { projectId, setProjectId } = useProject();
  const { data: projects = [] } = useProjects();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const saved: Record<string, boolean> = {};
    navSections.forEach((s) => { saved[s.title] = true; });
    return saved;
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const currentPath = location.pathname.split('/').slice(3).join('/');
    navigate(`/projects/${id}/${currentPath || 'dashboard'}`);
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) onClose();
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'lg:static',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className={cn(
          'flex h-16 items-center border-b border-sidebar-muted/20',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}>
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
                  <Layers className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight">Project Minore</span>
                  <p className="text-[10px] text-sidebar-foreground/40">Trading OS</p>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Collapse expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {/* Project Selector */}
        {!collapsed && (
          <div className="px-3 py-3">
            <select
              value={projectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full rounded-lg border border-sidebar-muted/20 bg-sidebar-muted/10 px-3 py-2 text-sm text-sidebar-foreground outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: 'none' }}
            >
              <option value="" disabled>Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {!collapsed && <Separator className="bg-sidebar-muted/20" />}

        {/* Navigation */}
        <ScrollArea className={cn('flex-1', collapsed ? 'px-2 py-2' : 'px-3 py-2')}>
          <nav className="flex flex-col gap-1">
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
                              className={({ isActive }) =>
                                cn(
                                  'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                                  isActive
                                    ? 'bg-sidebar-active/15 text-sidebar-active'
                                    : 'text-sidebar-foreground/50 hover:bg-sidebar-muted/20 hover:text-sidebar-foreground'
                                )
                              }
                            >
                              <Icon className="h-5 w-5" />
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleSection(section.title)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                        >
                          <span>{section.title}</span>
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 transition-transform',
                              expandedSections[section.title] ? 'rotate-0' : '-rotate-90'
                            )}
                          />
                        </button>
                        <AnimatePresence>
                          {expandedSections[section.title] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-0.5 pb-1">
                                {section.items.map((item) => {
                                  const Icon = item.icon;
                                  return (
                                    <NavLink
                                      key={item.path}
                                      to={`/projects/${projectId}/${item.path}`}
                                      onClick={onClose}
                                      className={({ isActive }) =>
                                        cn(
                                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                                          isActive
                                            ? 'bg-sidebar-active/10 text-sidebar-active font-medium'
                                            : 'text-sidebar-foreground/60 hover:bg-sidebar-muted/15 hover:text-sidebar-foreground'
                                        )
                                      }
                                    >
                                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                      <span className="truncate">{item.name}</span>
                                      {item.badge && (
                                        <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                          {item.badge}
                                        </span>
                                      )}
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
                    <p className="text-sm text-sidebar-foreground/40">Select a project to begin</p>
                  </div>
                )}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        {!collapsed && <Separator className="bg-sidebar-muted/20" />}
        <div className={cn(
          'border-t border-sidebar-muted/20 p-3',
          collapsed && 'flex flex-col items-center gap-2'
        )}>
          {collapsed ? (
            <>
              <button className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-muted/20 hover:text-sidebar-foreground transition-all" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-muted/20 hover:text-sidebar-foreground transition-all" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sidebar-muted/10 transition-colors cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">User</p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate">View profile</p>
              </div>
              <button
                className="text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors"
                aria-label="Logout"
                onClick={() => {
                  localStorage.clear();
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
};
