import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User, Search as SearchIcon, Command, Bell, Settings, Plus, Keyboard, LayoutDashboard, BarChart3, Notebook, Sparkles } from 'lucide-react';
import { Breadcrumb } from './ui/Breadcrumb';
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
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useProjects } from '../hooks/useProjects';
import { cn } from '../lib/utils';

interface TopbarProps {
  onToggleSidebar: () => void;
  onCommandPalette?: () => void;
}

export const Topbar = React.memo(({ onToggleSidebar, onCommandPalette }: TopbarProps) => {
  const { theme, toggleTheme } = useTheme();
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
    knowledge: 'Strategies',
    'market-structure': 'Market Structure',
    analyst: 'AI Analyst',
    research: 'Research',
    similarity: 'Similarity',
    decision: 'Decision Support',
    'knowledge-graph': 'Knowledge Graph',
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

  const quickActions = [
    { label: 'New Trade', icon: Plus, path: 'trades', shortcut: 'T' },
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', shortcut: 'D' },
    { label: 'Journal', icon: Notebook, path: 'learning', shortcut: 'G J' },
    { label: 'AI Analyst', icon: Sparkles, path: 'analyst', shortcut: 'A' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-foreground"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Project context breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {currentProject && (
            <>
              <span className="hidden sm:inline text-xs font-medium text-muted-foreground/60 truncate max-w-[120px]">
                {currentProject.name}
              </span>
              <span className="hidden sm:inline text-muted-foreground/20">/</span>
            </>
          )}
          <span className="text-sm font-medium text-foreground truncate">
            {pageLabels[currentPage] || 'Minore'}
          </span>
        </div>

        <Breadcrumb />
      </div>

      <div className="flex items-center gap-1">
        {/* Command Palette Trigger */}
        <button
          onClick={onCommandPalette}
          aria-label="Open command palette"
          className="hidden md:flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50 transition-all min-w-[180px] group"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search pages...</span>
          <kbd className="flex items-center gap-0.5 rounded border border-border/40 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50 shadow-xs group-hover:bg-muted/30 transition-colors">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Mobile search trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground/70 hover:text-foreground"
          onClick={onCommandPalette}
          aria-label="Search"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>

        {/* Quick Actions (desktop) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground/70 hover:text-foreground" aria-label="Quick actions">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-1">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Quick Actions</DropdownMenuLabel>
            {quickActions.map((action) => (
              <DropdownMenuItem key={action.path} onClick={() => go(action.path)}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
                <kbd className="ml-auto text-[10px] text-muted-foreground/50">{action.shortcut}</kbd>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground/70 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-xs shadow-primary/50 animate-pulse-subtle" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-muted-foreground/70 hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ml-1">
              <Avatar className="h-7 w-7 ring-2 ring-border/40 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                {user?.email && (
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
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
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
