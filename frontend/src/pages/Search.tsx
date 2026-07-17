import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { SearchResult } from '../types';
import { PageHeader } from '../components/PageHeader';

export default function SearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [query, setQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');
  const { data, isLoading } = useSearch(projectId!, searchTrigger);

  return (
    <div>
      <PageHeader title="Search Knowledge Graph">
        <input 
          className="border p-2 rounded" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Enter term..."
        />
        <button onClick={() => setSearchTrigger(query)} className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
      </PageHeader>
      {isLoading && <div>Searching...</div>}
      {data && (
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-slate-500">No results found.</p>
          ) : (
            <pre className="rounded bg-slate-100 p-4 dark:bg-slate-800">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
