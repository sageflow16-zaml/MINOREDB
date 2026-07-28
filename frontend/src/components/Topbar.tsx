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
import { useTheme } from '../theme/ThemeProvider';
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
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[#27272A] bg-[#09090B]/80 px-4 backdrop-blur-xl md:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[#71717A] hover:text-[#FAFAFA]"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {currentProject && (
            <>
              <span className="hidden sm:inline text-xs font-medium text-[#71717A] truncate max-w-[120px]">
                {currentProject.name}
              </span>
              <ChevronRight className="hidden sm:inline h-3 w-3 text-[#71717A] shrink-0" />
            </>
          )}
          <span className="text-sm font-medium text-[#FAFAFA] truncate">
            {pageLabels[currentPage] || 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Command Palette Trigger */}
        <button
          onClick={onCommandPalette}
          aria-label="Open command palette"
          className="hidden md:flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#111113] px-3 py-1.5 text-xs text-[#71717A] hover:text-[#A1A1AA] hover:border-[#27272A]/80 transition-all min-w-[160px] group"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search pages...</span>
          <kbd className="flex items-center gap-0.5 rounded border border-[#27272A] bg-[#09090B] px-1.5 py-0.5 text-[10px] font-medium text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Mobile search trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-[#71717A] hover:text-[#FAFAFA]"
          onClick={onCommandPalette}
          aria-label="Search"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:flex text-[#71717A] hover:text-[#FAFAFA]" aria-label="Quick actions">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-1 border-[#27272A] bg-[#111113]">
            <DropdownMenuLabel className="text-xs text-[#71717A] font-normal">Quick Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => go('trades')} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] focus:bg-[#27272A] focus:text-[#FAFAFA]">
              <Plus className="mr-2 h-4 w-4 text-[#4F46E5]" />
              New Trade
              <kbd className="ml-auto text-[10px] text-[#71717A]">T</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => go('dashboard')} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] focus:bg-[#27272A] focus:text-[#FAFAFA]">
              <LayoutDashboard className="mr-2 h-4 w-4 text-[#4F46E5]" />
              Dashboard
              <kbd className="ml-auto text-[10px] text-[#71717A]">D</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => go('learning')} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] focus:bg-[#27272A] focus:text-[#FAFAFA]">
              <Notebook className="mr-2 h-4 w-4 text-[#4F46E5]" />
              Journal
              <kbd className="ml-auto text-[10px] text-[#71717A]">G J</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => go('analyst')} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] focus:bg-[#27272A] focus:text-[#FAFAFA]">
              <Sparkles className="mr-2 h-4 w-4 text-[#4F46E5]" />
              AI Analyst
              <kbd className="ml-auto text-[10px] text-[#71717A]">A</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#71717A] hover:text-[#FAFAFA]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#4F46E5] shadow-[0_0_6px_rgba(79,70,229,0.4)]" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ml-1">
              <Avatar className="h-7 w-7 ring-2 ring-[#27272A] ring-offset-2 ring-offset-[#09090B]">
                <AvatarFallback className="bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1 border-[#27272A] bg-[#111113]">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#FAFAFA]">{displayName}</span>
                {user?.email && (
                  <span className="text-xs font-normal text-[#71717A]">{user.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#27272A]" />
            <DropdownMenuItem onClick={() => navigate('/projects')} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] focus:bg-[#27272A] focus:text-[#FAFAFA]">
              <User className="mr-2 h-4 w-4" />
              Projects
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => projectId && navigate(`/projects/${projectId}/settings`)} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] focus:bg-[#27272A] focus:text-[#FAFAFA]">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCommandPalette} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] focus:bg-[#27272A] focus:text-[#FAFAFA]">
              <Keyboard className="mr-2 h-4 w-4" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#27272A]" />
            <DropdownMenuItem onClick={handleLogout} className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10 focus:bg-[#EF4444]/10 focus:text-[#EF4444]">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
