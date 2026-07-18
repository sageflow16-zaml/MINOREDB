import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  MessageSquare,
  Puzzle,
  BarChart3,
  CandlestickChart,
  BarChart2,
  Brain,
  GitBranch,
  Search,
  FlaskConical,
  PlayCircle,
  BrainCircuit,
  Layers,
  AlertTriangle,
  HelpCircle,
  Eye,
  Database,
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  LineChart,
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
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
      { name: 'Projects', path: 'projects', icon: FolderOpen },
    ],
  },
  {
    title: 'Research',
    items: [
      { name: 'Sources', path: 'sources', icon: BookOpen },
      { name: 'Claims', path: 'claims', icon: MessageSquare },
      { name: 'Concepts', path: 'concepts', icon: Puzzle },
      { name: 'Conflicts', path: 'conflicts', icon: AlertTriangle },
      { name: 'Questions', path: 'questions', icon: HelpCircle },
      { name: 'Hypotheses', path: 'hypotheses', icon: FlaskConical },
    ],
  },
  {
    title: 'Trading',
    items: [
      { name: 'Journal', path: 'trades', icon: BarChart3 },
      { name: 'Market Structure', path: 'market-structure', icon: CandlestickChart },
      { name: 'Statistics', path: 'statistics', icon: BarChart2 },
      { name: 'Memory Engine', path: 'memories', icon: Brain },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { name: 'Knowledge', path: 'knowledge', icon: BookOpen },
      { name: 'Knowledge Graph', path: 'knowledge-graph', icon: GitBranch },
      { name: 'AI Analyst', path: 'analyst', icon: Search },
      { name: 'Research Engine', path: 'research', icon: FlaskConical },
      { name: 'Trader Intelligence', path: 'trader-intelligence', icon: BrainCircuit },
      { name: 'Similarity', path: 'similarity', icon: TrendingUp },
      { name: 'Decision Support', path: 'decision', icon: LineChart },
      { name: 'Learning', path: 'learning', icon: Layers },
    ],
  },
  {
    title: 'Data',
    items: [
      { name: 'Macro', path: 'macro', icon: CandlestickChart },
      { name: 'MT5', path: 'mt5', icon: Database },
      { name: 'TradingView', path: 'tradingview', icon: BarChart3 },
      { name: 'Collectors', path: 'collectors', icon: Database },
      { name: 'Replay', path: 'replay', icon: PlayCircle },
    ],
  },
  {
    title: 'System',
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

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    navigate(`/projects/${id}/dashboard`);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-muted/50 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Minore</span>
          </div>
          <button className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={onClose} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Project Selector */}
        <div className="px-3 py-3">
          <select
            value={projectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full rounded-lg border border-sidebar-muted/30 bg-sidebar-muted/20 px-3 py-2 text-sm text-sidebar-foreground outline-none focus:border-primary/50 transition-colors"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <Separator className="bg-sidebar-muted/30" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="flex flex-col gap-4">
            {projectId
              ? navSections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                      {section.title}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.path}
                            to={`/projects/${projectId}/${item.path}`}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all',
                                isActive
                                  ? 'bg-sidebar-active/15 text-sidebar-active font-medium'
                                  : 'text-sidebar-foreground/60 hover:bg-sidebar-muted/30 hover:text-sidebar-foreground'
                              )
                            }
                          >
                            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            {item.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))
              : null}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-muted/30 px-4 py-3">
          <p className="text-[11px] text-sidebar-foreground/30">
            Project Minore v0.1
          </p>
        </div>
      </aside>
    </>
  );
};
