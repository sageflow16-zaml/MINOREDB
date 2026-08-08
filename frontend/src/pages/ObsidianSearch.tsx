import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/Feedback';
import { useObsidianSearch } from '../hooks/useObsidian';
import { Search, FileText, BarChart3, Lightbulb, BookOpen, Tag } from 'lucide-react';
import type { ObsidianSearchResult } from '../api/types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const typeIcon: Record<string, React.ElementType> = {
  note: FileText, trade: BarChart3, strategy: Lightbulb, journal: BookOpen, concept: Tag,
};
const typeColor: Record<string, string> = {
  note: 'info', trade: 'success', strategy: 'warning', journal: 'secondary', concept: 'destructive',
};

export default function ObsidianSearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [query, setQuery] = useState('');

  const search = useObsidianSearch(projectId!, query);
  const results = search.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader title="Unified Search" description="Search across Obsidian notes, trades, strategies, and knowledge" />
      </motion.div>

      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, trades, strategies, concepts..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors"
            autoFocus
          />
        </div>
      </motion.div>

      {query.length < 2 ? (
        <EmptyState message="Type at least 2 characters to search" />
      ) : search.isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Searching...</div>
      ) : results.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <p className="text-xs text-muted-foreground">{results.length} results found</p>
          {results.map((r: ObsidianSearchResult) => {
            const Icon = typeIcon[r.result_type] || FileText;
            return (
              <motion.div key={`${r.result_type}-${r.id}`} variants={item}>
                <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                  <CardContent className="flex items-start gap-3 p-4">
                    <Icon className="h-5 w-5 text-primary-text shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{r.title}</h4>
                        <Badge variant={(typeColor[r.result_type] || 'secondary') as 'info'} className="text-3xs">{r.result_type}</Badge>
                        <Badge variant="outline" className="text-3xs">{r.source}</Badge>
                      </div>
                      {r.snippet && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.snippet}</p>}
                      {r.path && <p className="text-xs text-muted-foreground font-mono mt-1">{r.path}</p>}
                      {r.tags && r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {r.tags.slice(0, 5).map((t) => <Badge key={t} variant="secondary" className="text-3xs">#{t}</Badge>)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState message={`No results for "${query}"`} />
      )}
    </motion.div>
  );
}
