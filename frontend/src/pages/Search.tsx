import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Search as SearchIcon } from 'lucide-react';

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
    <div className="space-y-6">
      <PageHeader title="Search Knowledge Graph">
        <div className="flex gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-80 rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter search term..."
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </PageHeader>

      {!searchTrigger && !data && (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="Search the knowledge graph"
          description="Enter a term above and press Search to find related concepts, claims, and sources."
        />
      )}

      {error && <ErrorState message="Search failed. Please try again." onRetry={refetch} />}

      {isLoading && <LoadingSpinner message="Searching knowledge graph..." />}

      {data && !isLoading && !error && (
        <div className="space-y-4">
          {data.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="h-6 w-6" />}
              title="No results found"
              description={`No matches for "${searchTrigger}". Try a different term.`}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{data.length} result{data.length !== 1 ? 's' : ''} found</p>
              <div className="space-y-3">
                {data.map((result, i) => (
                  <div key={'result-' + i} className="rounded-lg border bg-card p-4 shadow-sm">
                    <pre className="text-sm text-card-foreground whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}