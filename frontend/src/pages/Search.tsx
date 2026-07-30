import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSearch } from '../hooks/useSearch';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { ErrorState, EmptyState } from '../components/ui/Feedback';
import { Search as SearchIcon, FileText, MessageCircle, TrendingUp, Tag, Globe, BookOpen, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const TYPE_ICONS: Record<string, LucideIcon> = {
  source: FileText, claim: MessageCircle, trade: TrendingUp, concept: Tag,
  interpretation: Globe, document: BookOpen, rule: BookOpen, pattern: TrendingUp,
};

function guessType(result: Record<string, unknown>): string {
  return (result.type as string) || (result.entity_type as string) || (result.kind as string) || 'unknown';
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

const KNOWN_META_KEYS = new Set(['id', 'project_id', 'created_at', 'updated_at', 'type', 'entity_type', 'kind', 'score', 'rank', 'similarity']);

export default function SearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [query, setQuery] = useState('');
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
          description="Find concepts, claims, sources, and relationships"
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

      {!searchTrigger && !data && (
        <motion.div variants={item}>
          <EmptyState
            icon={<SearchIcon className="h-6 w-6" />}
            title="Search the knowledge graph"
            description="Enter a term above and press Search to find related concepts, claims, and sources."
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
                  const metaKeys = Object.keys(r).filter(k => !KNOWN_META_KEYS.has(k) && k !== 'content' && k !== 'text' && k !== 'description' && k !== 'verbatim_text' && k !== 'name' && k !== 'title');
                  return (
                    <motion.div key={'result-' + i} variants={item}>
                      <Card className="transition-all hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-3xs font-medium uppercase tracking-wider text-muted-foreground">{type}</span>
                                {r.score != null && (
                                  <span className="text-3xs text-muted-foreground">Score: {Number(r.score).toFixed(2)}</span>
                                )}
                              </div>
                              {content && (
                                <p className="text-xs text-foreground leading-relaxed">{content}</p>
                              )}
                              {metaKeys.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {metaKeys.slice(0, 4).map((k) => {
                                    const v = renderValue(r[k]);
                                    if (!v) return null;
                                    return (
                                      <span key={k} className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5 text-3xs text-muted-foreground">
                                        <Tag className="w-2.5 h-2.5" />
                                        {k}: {v.length > 60 ? v.slice(0, 60) + '...' : v}
                                      </span>
                                    );
                                  })}
                                </div>
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
