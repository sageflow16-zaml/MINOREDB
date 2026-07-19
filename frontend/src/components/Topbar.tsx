import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User, Search as SearchIcon, Command, Bell } from 'lucide-react';
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

interface TopbarProps {
  onToggleSidebar: () => void;
  onCommandPalette?: () => void;
}

export const Topbar = ({ onToggleSidebar, onCommandPalette }: TopbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-foreground"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-1.5">
        {/* Command palette trigger */}
        <button
          onClick={onCommandPalette}
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
        >
          <SearchIcon className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 flex items-center gap-0.5 rounded-md border border-border/50 bg-background/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 shadow-sm">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ml-1">
              <Avatar className="h-7 w-7 ring-2 ring-border/50 ring-offset-2 ring-offset-background">
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
};
