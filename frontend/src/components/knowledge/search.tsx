import { useState, useRef, useEffect } from 'react';
import { Search, X, FileText, BookOpen, BarChart3, Target, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { KnowledgeSearchResult, ENTITY_LABELS } from './types';

interface KnowledgeSearchProps {
  onSearch: (query: string) => void;
  results: KnowledgeSearchResult[];
  searching: boolean;
  onSelect: (result: KnowledgeSearchResult) => void;
}

function getResultIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    document: <FileText className="h-3.5 w-3.5" />,
    journal_entry: <BookOpen className="h-3.5 w-3.5" />,
    backtest: <BarChart3 className="h-3.5 w-3.5" />,
    strategy: <Target className="h-3.5 w-3.5" />,
    concept: <Brain className="h-3.5 w-3.5" />,
    pattern: <TrendingUp className="h-3.5 w-3.5" />,
    mistake: <AlertTriangle className="h-3.5 w-3.5" />,
  };
  return icons[type] || <Search className="h-3.5 w-3.5" />;
}

export function KnowledgeSearch({ onSearch, results, searching, onSelect }: KnowledgeSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleChange = (v: string) => {
    setQuery(v);
    if (v.length >= 2) onSearch(v);
  };

  return (
    <div ref={panelRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search knowledge..."
          className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-7 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-surface shadow-lg max-h-72 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">No results found</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.entity.id}-${i}`}
                onClick={() => { onSelect(r); setIsOpen(false); }}
                className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-background transition-colors"
              >
                <span className="mt-0.5 text-muted-foreground">{getResultIcon(r.entity.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-foreground truncate">{r.entity.title}</span>
                    <span className="text-3xs text-muted-foreground shrink-0">{ENTITY_LABELS[r.entity.type]}</span>
                  </div>
                  <p className="text-3xs text-muted line-clamp-1">{r.matchContext}</p>
                </div>
                <span className="text-3xs text-muted-foreground shrink-0">
                  {r.connections} conn{r.connections !== 1 ? 's' : ''}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
