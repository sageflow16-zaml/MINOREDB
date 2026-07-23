import { useRef, useCallback, type ReactNode } from 'react';
import { GripHorizontal, Minus, Maximize2, X } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';
import { cn } from '../../lib/utils';
import type { PanelId, WorkspacePanel } from './types';

interface PanelProps {
  panel: WorkspacePanel;
  children: ReactNode;
  toolbar?: ReactNode;
  onClose?: () => void;
}

export function Panel({ panel, children, toolbar, onClose }: PanelProps) {
  const { dispatch } = useWorkspace();
  const dragRef = useRef<HTMLDivElement>(null);

  const toggleMinimize = useCallback(() => {
    dispatch({ type: 'UPDATE_PANEL', panelId: panel.id, updates: { minimized: !panel.minimized } });
  }, [dispatch, panel.id, panel.minimized]);

  const handleFocus = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_PANEL', panelId: panel.id });
  }, [dispatch, panel.id]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border bg-card overflow-hidden',
        'transition-shadow duration-200',
      )}
      style={{ zIndex: panel.zIndex }}
      onClick={handleFocus}
    >
      <div
        ref={dragRef}
        className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <GripHorizontal className="w-3 h-3" />
          {panel.label}
        </div>
        <div className="flex items-center gap-0.5">
          {toolbar}
          <button onClick={toggleMinimize} className="p-0.5 rounded hover:bg-muted transition-colors">
            <Minus className="w-3 h-3 text-muted-foreground" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      <div className={cn('flex-1 overflow-hidden', panel.minimized && 'hidden')}>
        {children}
      </div>
    </div>
  );
}
