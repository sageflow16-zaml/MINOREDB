import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command as CommandIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandGroup {
  label: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  groups: CommandGroup[];
}

export function CommandPalette({ open, onClose, groups }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatItems = useMemo(() => {
    const items: ({ groupIndex: number } & CommandItem)[] = [];
    groups.forEach((g, gi) => {
      g.items.forEach((item) => {
        items.push({ ...item, groupIndex: gi });
      });
    });
    return items;
  }, [groups]);

  const filtered = useMemo(() => {
    if (!query) return flatItems;
    const q = query.toLowerCase();
    return flatItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [flatItems, query]);

  const handleSelect = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (item) {
        item.onSelect();
        onClose();
      }
    },
    [filtered, onClose]
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(selectedIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selectedIndex, handleSelect, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, actions, or anything..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                <CommandIcon className="h-2.5 w-2.5" />K
              </kbd>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No results found.
                </p>
              )}

              {groups.map((group, gi) => {
                const groupItems = filtered.filter((item) => item.groupIndex === gi);
                if (groupItems.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </p>
                    {groupItems.map((item, ii) => {
                      const flatIndex = filtered.indexOf(item);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(flatIndex)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                            flatIndex === selectedIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'text-foreground hover:bg-accent/50'
                          )}
                        >
                          {Icon && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{item.label}</p>
                            {item.description && (
                              <p className="truncate text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}
