import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Search, FolderOpen, BarChart3 } from 'lucide-react';

export function ActiveResearch() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Research</h3>
        <div className="flex flex-col items-center justify-center gap-2 py-4 px-2 border border-dashed border-border rounded-lg bg-muted/20">
          <FolderOpen className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-2xs text-muted-foreground text-center">No active project selected.</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-2xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              Open Library
            </button>
            <button
              onClick={() => navigate('/research')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-2xs font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
            >
              <Search className="w-3 h-3" />
              Open Research
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Research</h3>
      <div className="flex flex-col items-center justify-center gap-2 py-4 px-2 border border-dashed border-border rounded-lg bg-muted/20">
        <BookOpen className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-2xs text-muted-foreground text-center leading-relaxed">
          Begin your research by analyzing market structure, reviewing trades, or exploring knowledge graphs.
        </p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => navigate(`/projects/${projectId}/research`)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-2xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Search className="w-3 h-3" />
            Open Research
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/market-structure`)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-2xs font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <BarChart3 className="w-3 h-3" />
            Market Structure
          </button>
        </div>
      </div>
    </div>
  );
}
