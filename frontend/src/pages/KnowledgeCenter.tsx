import { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { knowledgeService, type KnowledgeCategory, type KnowledgeConcept, type KnowledgeConceptDetail, type KnowledgeRelationship, type KnowledgeTag, type KnowledgeStats } from '../api/knowledge';

type Tab = 'dashboard' | 'categories' | 'concepts' | 'relationships' | 'search';

const DIFFICULTY_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  beginner: 'success', intermediate: 'warning', advanced: 'destructive', expert: 'default',
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function CategoryCard({ cat, onClick }: { cat: KnowledgeCategory; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm">{cat.icon || '📚'}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{cat.name}</p>
          {cat.description && <p className="text-[10px] text-muted-foreground truncate">{cat.description}</p>}
        </div>
      </div>
    </button>
  );
}

function ConceptCard({ concept, onClick }: { concept: KnowledgeConcept; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-xl border border-border bg-card p-3 text-left transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{concept.title}</p>
          {concept.summary && <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{concept.summary}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {concept.difficulty && (
            <Badge variant={DIFFICULTY_VARIANT[concept.difficulty] || 'default'} size="sm">{concept.difficulty}</Badge>
          )}
          <Badge variant={concept.status === 'published' ? 'success' : 'secondary'} size="sm">{concept.status}</Badge>
        </div>
      </div>
    </button>
  );
}

function ConceptDetailView({ conceptId, onBack }: { conceptId: string; onBack: () => void }) {
  const [concept, setConcept] = useState<KnowledgeConceptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    knowledgeService.getConcept(conceptId).then(setConcept).finally(() => setLoading(false));
  }, [conceptId]);

  if (loading) return <LoadingSpinner />;
  if (!concept) return <p className="text-sm text-slate-500">Concept not found.</p>;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
    if (!children) return null;
    return (
      <div className="mb-4">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
        <div className="text-sm text-slate-700 dark:text-slate-300">{children}</div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="mb-2 text-xs text-indigo-500 hover:text-indigo-700">&larr; Back to concepts</button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{concept.title}</h2>
          {concept.category && <p className="text-xs text-slate-400">{concept.category.name}</p>}
        </div>
        <div className="flex gap-2">
          {concept.tags.map(t => (
            <span key={t.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{t.name}</span>
          ))}
        </div>
      </div>

      <Section title="Summary">{concept.summary}</Section>
      <Section title="Definition">{concept.definition}</Section>
      <Section title="Purpose">{concept.purpose}</Section>
      <Section title="Market Context">{concept.market_context}</Section>

      {concept.rules && (
        <Section title="Rules">
          <pre className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs dark:bg-slate-900">{JSON.stringify(concept.rules, null, 2)}</pre>
        </Section>
      )}

      <Section title="Conditions">{concept.conditions}</Section>
      <Section title="Confirmations">{concept.confirmations}</Section>
      <Section title="Invalidations">{concept.invalidations}</Section>
      <Section title="Common Mistakes">{concept.common_mistakes}</Section>
      <Section title="Best Practices">{concept.best_practices}</Section>

      {concept.examples && concept.examples.length > 0 && (
        <Section title={`Examples (${concept.examples.length})`}>
          {concept.examples.map((e: any) => (
            <div key={e.id} className="mb-2 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
              <p className="font-medium text-xs">{e.title}</p>
              {(e.pair || e.timeframe) && <p className="text-xs text-slate-400">{e.pair} {e.timeframe}</p>}
              {e.description && <p className="mt-1 text-xs text-slate-500">{e.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {concept.references && concept.references.length > 0 && (
        <Section title={`References (${concept.references.length})`}>
          {concept.references.map((r: any) => (
            <div key={r.id} className="mb-1 text-xs text-slate-500">
              {r.title} {r.author && `by ${r.author}`} {r.source_type && `(${r.source_type})`}
            </div>
          ))}
        </Section>
      )}

      {(concept.relationships_outgoing?.length > 0 || concept.relationships_incoming?.length > 0) && (
        <Section title={`Relationships (${(concept.relationships_outgoing?.length || 0) + (concept.relationships_incoming?.length || 0)})`}>
          {concept.relationships_outgoing?.map((r: any) => (
            <div key={r.id} className="mb-1 text-xs">
              <span className="text-indigo-500 font-medium">{concept.title}</span>
              <span className="text-slate-400"> --[{r.relationship_type}]--&gt; </span>
              <span className="text-indigo-500 font-medium">{r.target_concept?.title || r.target_concept_id}</span>
            </div>
          ))}
          {concept.relationships_incoming?.map((r: any) => (
            <div key={r.id} className="mb-1 text-xs">
              <span className="text-indigo-500 font-medium">{r.source_concept?.title || r.source_concept_id}</span>
              <span className="text-slate-400"> --[{r.relationship_type}]--&gt; </span>
              <span className="text-indigo-500 font-medium">{concept.title}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

export default function KnowledgeCenter() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [concepts, setConcepts] = useState<KnowledgeConcept[]>([]);
  const [relationships, setRelationships] = useState<KnowledgeRelationship[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      knowledgeService.getStats(),
      knowledgeService.getCategories(),
      knowledgeService.getConcepts(),
      knowledgeService.getRelationships(),
    ]).then(([s, cats, cons, rels]) => {
      setStats(s);
      setCategories(cats);
      setConcepts(cons);
      setRelationships(rels);
    }).catch(() => setError('Failed to load knowledge library data.'))
    .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    knowledgeService.search(searchQuery.trim(), selectedCategory || undefined).then(setSearchResults).catch(() => {});
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'categories', label: 'Categories' },
    { key: 'concepts', label: 'Concepts' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'search', label: 'Search' },
  ];

  const filteredConcepts = selectedCategory
    ? concepts.filter(c => c.category_id === selectedCategory)
    : concepts;

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Knowledge Center">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">V2</span>
      </PageHeader>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setSelectedConcept(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner />}

      {!loading && activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Categories" value={stats.total_categories} />
            <StatCard label="Concepts" value={stats.total_concepts} />
            <StatCard label="Relationships" value={stats.total_relationships} />
            <StatCard label="Examples" value={stats.total_examples} />
            <StatCard label="References" value={stats.total_references} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {categories.map(cat => <CategoryCard key={cat.id} cat={cat} onClick={() => { setSelectedCategory(cat.id); setActiveTab('concepts'); }} />)}
              {categories.length === 0 && <EmptyState message="No categories yet. Create one to get started." />}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(cat => <CategoryCard key={cat.id} cat={cat} onClick={() => { setSelectedCategory(cat.id); setActiveTab('concepts'); }} />)}
          </div>
          {categories.length === 0 && <EmptyState message="No categories yet." />}
        </div>
      )}

      {!loading && activeTab === 'concepts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <span className="text-xs text-slate-400">{filteredConcepts.length} concepts</span>
          </div>
          {selectedConcept ? (
            <ConceptDetailView conceptId={selectedConcept} onBack={() => setSelectedConcept(null)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredConcepts.map(c => <ConceptCard key={c.id} concept={c} onClick={() => setSelectedConcept(c.id)} />)}
              {filteredConcepts.length === 0 && <EmptyState message="No concepts found in this category." />}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'relationships' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            {relationships.length === 0 ? (
              <EmptyState message="No relationships yet." />
            ) : (
              <div className="space-y-2">
                {relationships.slice(0, 100).map(r => (
                  <div key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs dark:border-slate-600 dark:bg-slate-700/50">
                    <button onClick={() => { setSelectedConcept(r.source_concept_id); setActiveTab('concepts'); }}
                      className="font-medium text-indigo-500 hover:text-indigo-700 truncate max-w-[120px]">
                      {r.source_concept?.title || r.source_concept_id.slice(0, 8)}
                    </button>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-600 dark:text-slate-300">{r.relationship_type}</span>
                    <button onClick={() => { setSelectedConcept(r.target_concept_id); setActiveTab('concepts'); }}
                      className="font-medium text-indigo-500 hover:text-indigo-700 truncate max-w-[120px]">
                      {r.target_concept?.title || r.target_concept_id.slice(0, 8)}
                    </button>
                    {r.strength && <span className="text-slate-400 ml-auto">strength: {r.strength.toFixed(1)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, definitions, summaries..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Search</button>
          </form>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <button key={r.id || i} onClick={() => { setSelectedConcept(r.id); setActiveTab('concepts'); }}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">{r.title}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{r.category_name || r.match_type}</span>
                  </div>
                  {r.summary && <p className="mt-1 text-xs text-slate-500">{r.summary}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
