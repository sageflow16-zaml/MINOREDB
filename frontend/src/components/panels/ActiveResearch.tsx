import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Search, FolderOpen, BarChart3 } from 'lucide-react';

export function ActiveResearch() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <BookOpen className="w-3.5 h-3.5" /> Active Research
      </h3>
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 border border-dashed border-border rounded-lg bg-muted/20">
        <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[240px]">
          {!projectId
            ? 'No active project selected. Open the Library to select a project and begin research.'
            : 'Begin your research by analyzing market structure, reviewing trades, or exploring knowledge graphs.'}
        </p>
        <div className="flex gap-2">
          {!projectId ? (
            <>
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Open Library
              </button>
              <button
                onClick={() => navigate('/research')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Open Research
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(`/projects/${projectId}/research`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Open Research
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}/market-structure`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted/50 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Market Structure
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
