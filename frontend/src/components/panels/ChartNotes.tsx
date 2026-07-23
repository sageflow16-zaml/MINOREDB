import { useState } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { StickyNote, Plus, Trash2, Pin } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ChartNotes() {
  const { state, dispatch } = useWorkspace();
  const [noteText, setNoteText] = useState('');

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    dispatch({
      type: 'ADD_NOTE',
      note: {
        id: crypto.randomUUID(),
        chartId: state.activePanel || 'chart-0',
        content: noteText,
        timestamp: Date.now(),
        tags: [],
      },
    });
    setNoteText('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <StickyNote className="w-3 h-3" /> Notes
        </h3>
      </div>

      {/* Add note */}
      <div className="flex gap-1 mb-2">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          placeholder="Add chart note..."
          className="flex-1 px-2 py-1 text-xs bg-muted/50 border border-border rounded-md outline-none focus:border-primary/50"
        />
        <Button size="sm" className="h-7 px-2" onClick={handleAddNote}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Note list */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {state.notes.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-4">No notes yet</p>
        )}
        {state.notes.map((note) => (
          <div key={note.id} className="px-2 py-1.5 rounded border bg-card/50 group">
            <div className="flex items-start justify-between gap-1">
              <p className="text-[11px] flex-1">{note.content}</p>
              <button
                onClick={() => dispatch({ type: 'REMOVE_NOTE', noteId: note.id })}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {new Date(note.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
