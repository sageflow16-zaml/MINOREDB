import { useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { Badge } from '../ui/badge';
import {
  Focus, Eye, EyeOff, Layout, Save, Download, Upload, Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ChartLayout } from './types';

const LAYOUT_OPTIONS: ChartLayout[] = ['1', '2', '4', '6', '8'];

export function WorkspaceToolbar() {
  const { state, dispatch } = useWorkspace();
  const { layout } = state;
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [showLayouts, setShowLayouts] = useState(false);

  const handleSave = () => {
    if (!layoutName.trim()) return;
    dispatch({ type: 'SAVE_LAYOUT', name: layoutName.trim() });
    setLayoutName('');
    setShowSaveDialog(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout-${layout.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          dispatch({ type: 'LOAD_LAYOUT', layoutId: imported.id });
        } catch {}
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/20">
      <span className="text-sm font-semibold mr-2">Research Workspace</span>

      {/* Layout switcher */}
      <div className="flex items-center gap-0.5 border-r border-border pr-2">
        {LAYOUT_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => dispatch({ type: 'SET_LAYOUT', layout: opt })}
            className={cn(
              'px-1.5 py-0.5 text-xs rounded transition-colors',
              layout.chartLayout === opt
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title={`${opt} Charts`}
          >
            {opt}
          </button>
        ))}
        <Layout className="w-3 h-3 ml-1 text-muted-foreground" />
      </div>

      {/* View toggles */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
          className={cn('p-1 rounded hover:bg-muted transition-colors', layout.focusMode && 'bg-muted text-primary')}
          title="Focus Mode"
        >
          <Focus className="w-4 h-4" />
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW_MODE' })}
          className={cn('p-1 rounded hover:bg-muted transition-colors', layout.previewMode && 'bg-muted text-warning')}
          title={layout.previewMode ? 'Preview Mode On' : 'Preview Mode Off'}
        >
          {layout.previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Save / Load / Import / Export */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Save Layout"
        >
          <Save className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowLayouts(!showLayouts)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Load Layout"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          {showLayouts && state.savedLayouts.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-border bg-card shadow-xl z-50 py-1">
              {state.savedLayouts.map((saved) => (
                <div key={saved.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50">
                  <button
                    onClick={() => { dispatch({ type: 'LOAD_LAYOUT', layoutId: saved.id }); setShowLayouts(false); }}
                    className="text-xs text-left flex-1 truncate"
                  >
                    {saved.name}
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_LAYOUT', layoutId: saved.id })}
                    className="p-0.5 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleExport}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Export Layout"
        >
          <Upload className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleImport}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Import Layout"
        >
          <Download className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {layout.focusMode && <Badge variant="secondary" className="text-3xs">Focus</Badge>}
        {layout.previewMode && <Badge variant="outline" className="text-3xs border-warning/30 text-warning">Preview</Badge>}
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Save Layout</h3>
            <input
              placeholder="Layout name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!layoutName.trim()} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Click away for layouts dropdown */}
      {showLayouts && (
        <div className="fixed inset-0 z-40" onClick={() => setShowLayouts(false)} />
      )}
    </div>
  );
}
