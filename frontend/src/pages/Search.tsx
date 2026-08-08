import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSearch } from '../hooks/useSearch';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ErrorState, EmptyState } from '../components/ui/Feedback';
import { Search as SearchIcon, FileText, MessageCircle, TrendingUp, Tag, Globe, BookOpen, Layers, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const TYPE_ICONS: Record<string, LucideIcon> = {
  source: FileText, claim: MessageCircle, trade: TrendingUp, concept: Tag,
  interpretation: Globe, document: BookOpen, rule: BookOpen, pattern: TrendingUp,
  document_chunk: Layers,
};

const ENTITY_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Sources', value: 'source' },
  { label: 'Claims', value: 'claim' },
  { label: 'Concepts', value: 'concept' },
  { label: 'Trades', value: 'trade' },
  { label: 'Chunks', value: 'document_chunk' },
];

function guessType(result: Record<string, unknown>): string {
  return (result.type as string) || (result.entity_type as string) || (result.kind as string) || 'unknown';
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

export default function SearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');
  const { data, isLoading, error, refetch } = useSearch(projectId!, searchTrigger);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTrigger(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Search Knowledge Graph"
          description="Find concepts, claims, sources, trades, and document chunks"
          actions={
            <div className="flex gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-9 w-72 rounded-lg border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter search term..."
                />
              </div>
              <Button onClick={handleSearch} disabled={!query.trim() || isLoading} size="sm">
                <SearchIcon className="mr-1.5 h-3.5 w-3.5" /> {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {ENTITY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              typeFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            )}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {!searchTrigger && !data && (
        <motion.div variants={item}>
          <EmptyState
            icon={<SearchIcon className="h-6 w-6" />}
            title="Search the knowledge graph"
            description="Enter a term above and press Search to find related concepts, claims, trades, and sources."
          />
        </motion.div>
      )}

      {error && <motion.div variants={item}><ErrorState message="Search failed. Please try again." onRetry={refetch} /></motion.div>}

      {isLoading && (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </motion.div>
      )}

      {data && !isLoading && !error && (
        <motion.div variants={item} className="space-y-4">
          {data.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="h-6 w-6" />}
              title="No results found"
              description={`No matches for "${searchTrigger}". Try a different term.`}
            />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{data.length} result{data.length !== 1 ? 's' : ''} found</p>
              <div className="space-y-3">
                {data.map((result, i) => {
                  const r = result as Record<string, unknown>;
                  const type = guessType(r);
                  const Icon = TYPE_ICONS[type] || SearchIcon;
                  const content = renderValue(r.content || r.text || r.description || r.verbatim_text || r.name || r.title || '');
                  const similarity = r.similarity as number | undefined;
                  return (
                    <motion.div key={'result-' + i} variants={item}>
                      <Card className="transition-all hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="h-4 w-4 text-primary-text" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-3xs font-medium uppercase tracking-wider text-muted-foreground">{type}</span>
                                {similarity != null && (
                                  <Badge variant="outline" size="sm">
                                    {(similarity * 100).toFixed(0)}% match
                                  </Badge>
                                )}
                                {(r as any).filename && (
                                  <span className="text-3xs text-muted-foreground">{(r as any).filename}</span>
                                )}
                                {(r as any).page != null && (
                                  <span className="text-3xs text-muted-foreground">p.{(r as any).page}</span>
                                )}
                                {(r as any).result && (
                                  <Badge variant={(r as any).result === 'WIN' ? 'success' : (r as any).result === 'LOSS' ? 'danger' : 'default'} size="sm">
                                    {(r as any).result}
                                  </Badge>
                                )}
                                {(r as any).pnl != null && (
                                  <span className={cn('text-3xs font-mono', (r as any).pnl >= 0 ? 'text-success' : 'text-danger-text')}>
                                    {(r as any).pnl >= 0 ? '+' : ''}{Number((r as any).pnl).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {content && (
                                <p className="text-xs text-foreground leading-relaxed">{content}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
