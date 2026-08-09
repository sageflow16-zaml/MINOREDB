import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import {Card, CardContent, CardHeader} from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { knowledgeService, type KnowledgeCategory, type KnowledgeConcept, type KnowledgeConceptDetail, type KnowledgeRelationship, type KnowledgeStats } from '../api/knowledge';
import {Layers, ArrowLeft, Search, Network, Lightbulb, Library, ChevronRight} from 'lucide-react';


const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const DIFFICULTY_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  beginner: 'success', intermediate: 'warning', advanced: 'destructive', expert: 'default',
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <motion.div variants={item} className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

function CategoryCard({ cat, onClick }: { cat: KnowledgeCategory; onClick: () => void }) {
  return (
    <motion.button variants={item} onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm">{cat.icon || '📚'}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{cat.name}</p>
          {cat.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>
    </motion.button>
  );
}

function ConceptCard({ concept, onClick }: { concept: KnowledgeConcept; onClick: () => void }) {
  return (
    <motion.button variants={item} onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-3 text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{concept.title}</p>
          {concept.summary && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{concept.summary}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {concept.difficulty && <Badge variant={DIFFICULTY_VARIANT[concept.difficulty] || 'default'} size="sm">{concept.difficulty}</Badge>}
          <Badge variant={concept.status === 'published' ? 'success' : 'secondary'} size="sm">{concept.status}</Badge>
        </div>
      </div>
    </motion.button>
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
  if (!concept) return <ErrorState message="Concept not found." />;

  function Section({ title, children }: { title: string; children: ReactNode }) {
    if (!children) return null;
    return (
      <div className="mb-4 last:mb-0">
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        <div className="text-xs text-foreground leading-relaxed">{children}</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <button onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-xs text-primary-text hover:text-primary-text/80 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to concepts
              </button>
              <h2 className="text-base font-bold text-foreground">{concept.title}</h2>
              {concept.category && <p className="text-xs text-muted-foreground mt-0.5">{concept.category.name}</p>}
            </div>
            {concept.tags && concept.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {concept.tags.map((t: any) => (
                  <span key={t.id} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-3xs font-medium text-muted-foreground">{t.name}</span>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Section title="Summary">{concept.summary}</Section>
          <Section title="Definition">{concept.definition}</Section>
          <Section title="Purpose">{concept.purpose}</Section>
          <Section title="Market Context">{concept.market_context}</Section>
          {concept.rules && (
            <Section title="Rules">
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground overflow-x-auto">{JSON.stringify(concept.rules, null, 2)}</pre>
            </Section>
          )}
          <Section title="Conditions">{concept.conditions}</Section>
          <Section title="Confirmations">{concept.confirmations}</Section>
          <Section title="Invalidations">{concept.invalidations}</Section>
          <Section title="Common Mistakes">{concept.common_mistakes}</Section>
          <Section title="Best Practices">{concept.best_practices}</Section>
          {concept.examples && concept.examples.length > 0 && (
            <Section title={`Examples (${concept.examples.length})`}>
              <div className="space-y-2">
                {concept.examples.map((e: any) => (
                  <div key={e.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-foreground">{e.title}</p>
                    {(e.pair || e.timeframe) && <p className="text-xs text-muted-foreground">{e.pair} {e.timeframe}</p>}
                    {e.description && <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
          {concept.references && concept.references.length > 0 && (
            <Section title={`References (${concept.references.length})`}>
              <div className="space-y-1">
                {concept.references.map((r: any) => (
                  <div key={r.id} className="text-xs text-muted-foreground">
                    {r.title} {r.author && `by ${r.author}`} {r.source_type && `(${r.source_type})`}
                  </div>
                ))}
              </div>
            </Section>
          )}
          {((concept.relationships_outgoing?.length ?? 0) > 0 || (concept.relationships_incoming?.length ?? 0) > 0) && (
            <Section title={`Relationships (${(concept.relationships_outgoing?.length || 0) + (concept.relationships_incoming?.length || 0)})`}>
              <div className="space-y-1">
                {concept.relationships_outgoing?.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-primary-text">{concept.title}</span>
                    <span className="text-muted-foreground">—[{r.relationship_type}]→</span>
                    <span className="font-medium text-primary-text">{r.target_concept?.title || r.target_concept_id}</span>
                  </div>
                ))}
                {concept.relationships_incoming?.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-primary-text">{r.source_concept?.title || r.source_concept_id}</span>
                    <span className="text-muted-foreground">—[{r.relationship_type}]→</span>
                    <span className="font-medium text-primary-text">{concept.title}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function KnowledgeCenter() {
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const loadLibrary = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      knowledgeService.getStats(), knowledgeService.getCategories(),
      knowledgeService.getConcepts(), knowledgeService.getRelationships(),
    ]).then(([s, cats, cons, rels]) => { setStats(s); setCategories(cats); setConcepts(cons); setRelationships(rels); })
      .catch(() => setError('Failed to load knowledge library data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    knowledgeService.search(searchQuery.trim(), selectedCategory || undefined).then(setSearchResults).catch(() => {});
  };

  const filteredConcepts = selectedCategory ? concepts.filter(c => c.category_id === selectedCategory) : concepts;

  if (error) return <ErrorState message={error} onRetry={loadLibrary} />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
      <PageHeader title="Knowledge Center" description="Structured trading concepts, categories, and relationships">
        <Badge variant="info" size="sm">V2</Badge>
      </PageHeader>

      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedConcept(null); }}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5"><Library className="h-3.5 w-3.5" /> Dashboard</TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Categories</TabsTrigger>
            <TabsTrigger value="concepts" className="flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Concepts</TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-1.5"><Network className="h-3.5 w-3.5" /> Relationships</TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Search</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            {loading ? <LoadingSpinner /> : stats && (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <StatCard label="Categories" value={stats.total_categories} />
                  <StatCard label="Concepts" value={stats.total_concepts} />
                  <StatCard label="Relationships" value={stats.total_relationships} />
                  <StatCard label="Examples" value={stats.total_examples} />
                  <StatCard label="References" value={stats.total_references} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground mb-3">Categories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {categories.map(cat => <CategoryCard key={cat.id} cat={cat} onClick={() => { setSelectedCategory(cat.id); setActiveTab('concepts'); }} />)}
                    {categories.length === 0 && <div className="col-span-full"><EmptyState title="No categories yet" description="Create one to get started." /></div>}
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            {loading ? <LoadingSpinner /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map(cat => <CategoryCard key={cat.id} cat={cat} onClick={() => { setSelectedCategory(cat.id); setActiveTab('concepts'); }} />)}
                {categories.length === 0 && <div className="col-span-full"><EmptyState title="No categories yet" /></div>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="concepts" className="mt-6">
            {loading ? <LoadingSpinner /> : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <span className="text-xs text-muted-foreground">{filteredConcepts.length} concepts</span>
                </div>
                {selectedConcept ? (
                  <ConceptDetailView conceptId={selectedConcept} onBack={() => setSelectedConcept(null)} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredConcepts.map(c => <ConceptCard key={c.id} concept={c} onClick={() => setSelectedConcept(c.id)} />)}
                    {filteredConcepts.length === 0 && <div className="col-span-full"><EmptyState title="No concepts found" description={selectedCategory ? 'No concepts in this category.' : undefined} /></div>}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="mt-6">
            {loading ? <LoadingSpinner /> : (
              <Card>
                <CardContent className="p-4">
                  {relationships.length === 0 ? (
                    <EmptyState title="No relationships yet" />
                  ) : (
                    <div className="space-y-2">
                      {relationships.slice(0, 100).map(r => (
                        <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-2 text-xs transition-colors hover:bg-muted/30">
                          <button onClick={() => { setSelectedConcept(r.source_concept_id); setActiveTab('concepts'); }}
                            className="font-medium text-primary-text hover:text-primary-text/80 truncate max-w-[120px] transition-colors">
                            {r.source_concept?.title || r.source_concept_id.slice(0, 8)}
                          </button>
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-3xs font-medium text-muted-foreground shrink-0">{r.relationship_type}</span>
                          <button onClick={() => { setSelectedConcept(r.target_concept_id); setActiveTab('concepts'); }}
                            className="font-medium text-primary-text hover:text-primary-text/80 truncate max-w-[120px] transition-colors">
                            {r.target_concept?.title || r.target_concept_id.slice(0, 8)}
                          </button>
                          {r.strength && <span className="text-xs text-muted-foreground ml-auto shrink-0">strength: {r.strength.toFixed(1)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search concepts, definitions, summaries..."
                  className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                <Button type="submit" size="sm"><Search className="h-3.5 w-3.5 mr-1" /> Search</Button>
              </form>
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((r, i) => (
                    <button key={r.id || i} onClick={() => { setSelectedConcept(r.id); setActiveTab('concepts'); }}
                      className="w-full rounded-xl border border-border bg-card p-3 text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-primary-text">{r.title}</span>
                        <Badge variant="secondary" size="sm">{r.category_name || r.match_type}</Badge>
                      </div>
                      {r.summary && <p className="mt-1 text-xs text-muted-foreground">{r.summary}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
