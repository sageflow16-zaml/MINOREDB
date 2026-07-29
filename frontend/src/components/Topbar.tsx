import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search as SearchIcon, Command, Bell, LogOut, User, Settings, Keyboard, Plus, LayoutDashboard, Notebook, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../auth/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useProjects } from '../hooks/useProjects';

interface TopbarProps {
  onToggleSidebar: () => void;
  onCommandPalette?: () => void;
}

export const Topbar = React.memo(({ onToggleSidebar, onCommandPalette }: TopbarProps) => {
  const { user, logout } = useAuth();
  const { projectId } = useProject();
  const { data: projects = [] } = useProjects();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = user?.name || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const currentProject = projects.find((p) => p.id === projectId);
  const pathSegment = location.pathname.split('/').filter(Boolean);
  const currentPage = pathSegment[2] || '';

  const pageLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    trades: 'Trades',
    learning: 'Journal',
    strategies: 'Strategies',
    'market-structure': 'Market Structure',
    analyst: 'AI Analyst',
    ict: 'ICT Engine',
    research: 'Research',
    similarity: 'Similarity',
    decision: 'Decision Support',
    'knowledge-graph': 'Knowledge Graph',
    'knowledge-engine': 'Knowledge Engine',
    sources: 'Sources',
    claims: 'Claims',
    interpretations: 'Interpretations',
    conflicts: 'Conflicts & RQs',
    hypotheses: 'Hypotheses',
    'knowledge-center': 'Knowledge Center',
    'trader-intelligence': 'Trader Intelligence',
    statistics: 'Statistics',
    analytics: 'Analytics',
    macro: 'Macro Intelligence',
    settings: 'Settings',
    mt5: 'MT5 Integration',
    search: 'Search',
    collectors: 'Collectors',
    replay: 'Replay',
    projects: 'Projects',
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const go = (path: string) => {
    if (projectId) {
      navigate(`/projects/${projectId}/${path}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted hover:text-foreground"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {currentProject && (
            <>
              <span className="hidden sm:inline text-xs font-medium text-muted truncate max-w-[120px]">
                {currentProject.name}
              </span>
              <ChevronRight className="hidden sm:inline h-3 w-3 text-muted shrink-0" />
            </>
          )}
          <span className="text-sm font-medium text-foreground truncate">
            {pageLabels[currentPage] || 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Command Palette Trigger */}
        <button
          onClick={onCommandPalette}
          aria-label="Open command palette"
          className="hidden md:flex items-center gap-2 rounded border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-secondary hover:border-border/80 transition-all min-w-[160px] group"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search pages...</span>
          <kbd>
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Mobile search trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted hover:text-foreground"
          onClick={onCommandPalette}
          aria-label="Search"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:flex text-muted hover:text-foreground" aria-label="Quick actions">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => go('trades')}>
              <Plus className="mr-2 h-4 w-4 text-primary" />
              New Trade
              <kbd className="ml-auto">T</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => go('dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
              Dashboard
              <kbd className="ml-auto">D</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => go('learning')}>
              <Notebook className="mr-2 h-4 w-4 text-primary" />
              Journal
              <kbd className="ml-auto">G J</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => go('analyst')}>
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              AI Analyst
              <kbd className="ml-auto">A</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ml-1">
              <Avatar className="h-7 w-7 ring-2 ring-border ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{displayName}</span>
                {user?.email && (
                  <span className="text-xs font-normal text-muted">{user.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/projects')}>
              <User className="mr-2 h-4 w-4" />
              Projects
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => projectId && navigate(`/projects/${projectId}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCommandPalette}>
              <Keyboard className="mr-2 h-4 w-4" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-danger hover:text-danger hover:bg-danger/10 focus:bg-danger/10 focus:text-danger">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
