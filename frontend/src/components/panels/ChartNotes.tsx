import { useState } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { StickyNote, Plus, Trash2 } from 'lucide-react';

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
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <StickyNote className="w-3.5 h-3.5" /> Notes
      </h3>

      {/* Add note */}
      <div className="flex gap-1 mb-2">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          placeholder="Add a note..."
          className="flex-1 px-2 py-1 text-xs bg-muted/50 border border-border rounded-md outline-none focus:border-primary/50"
        />
        <button
          onClick={handleAddNote}
          disabled={!noteText.trim()}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Note list */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {state.notes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-4 px-2">
            <StickyNote className="w-6 h-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground text-center">No notes yet. Write your first research note above.</p>
          </div>
        )}
        {state.notes.map((note) => (
          <div key={note.id} className="px-2 py-1.5 rounded border bg-card/50 group">
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs flex-1 leading-relaxed">{note.content}</p>
              <button
                onClick={() => dispatch({ type: 'REMOVE_NOTE', noteId: note.id })}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted/50 shrink-0"
              >
                <Trash2 className="w-3 h-3 text-destructive/70" />
              </button>
            </div>
            <div className="text-3xs text-muted-foreground mt-0.5">
              {new Date(note.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
