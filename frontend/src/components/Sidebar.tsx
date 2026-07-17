import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X,
  Layers,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  MessageSquare,
  Puzzle,
  Eye,
  AlertTriangle,
  HelpCircle,
  FlaskConical,
  Search,
  Settings,
  BarChart3,
  CandlestickChart,
  Database,
  BarChart2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useProjects } from '../hooks/useProjects';
import { cn } from '../lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
  { name: 'Projects', path: 'projects', icon: FolderOpen },
  { name: 'Sources', path: 'sources', icon: BookOpen },
  { name: 'Claims', path: 'claims', icon: MessageSquare },
  { name: 'Concepts', path: 'concepts', icon: Puzzle },
  { name: 'Associations', path: 'associations', icon: Eye },
  { name: 'Trading Journal', path: 'trades', icon: BarChart3 },
  { name: 'Market Structure', path: 'market-structure', icon: CandlestickChart },
  { name: 'Statistics', path: 'statistics', icon: BarChart2 },
  { name: 'Similarity', path: 'similarity', icon: CandlestickChart },
  { name: 'Decision Support', path: 'decision', icon: FlaskConical },
  { name: 'Continuous Learning', path: 'learning', icon: Layers },
  { name: 'Macro Intelligence', path: 'macro', icon: CandlestickChart },
  { name: 'MT5 Integration', path: 'mt5', icon: Database },
  { name: 'TradingView', path: 'tradingview', icon: BarChart3 },
  { name: 'Data Collectors', path: 'collectors', icon: Database },
  { name: 'Conflicts', path: 'conflicts', icon: AlertTriangle },
  { name: 'Interpretations', path: 'interpretations', icon: Eye },
  { name: 'Research Questions', path: 'questions', icon: HelpCircle },
  { name: 'Hypotheses', path: 'hypotheses', icon: FlaskConical },
  { name: 'Search', path: 'search', icon: Search },
  { name: 'Settings', path: 'settings', icon: Settings },
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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 p-4 text-white transition-transform duration-200',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Layers className="h-6 w-6 text-brand-400" />
            Project Minore
          </div>
          <button className="lg:hidden" onClick={onClose} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <select
          value={projectId || ''}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="mb-4 rounded bg-slate-800 p-2 text-sm text-white outline-none"
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {projectId &&
            navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={`/projects/${projectId}/${item.path}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded px-4 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </NavLink>
              );
            })}
        </nav>

        <motion.div
          className="mt-auto pt-4 text-xs text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Research Osmosis Platform
        </motion.div>
      </aside>
    </>
  );
};
