import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, Network, Sparkles, RefreshCw, Filter, Layers,
  PanelLeftClose, PanelRightClose, Lightbulb, Search,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import { callEdgeFunction } from '../lib/edgeFunctions';
import { KnowledgeGraphView } from '../components/knowledge/knowledge-graph-view';
import { RelatedItemsPanel } from '../components/knowledge/related-items-panel';
import { EvidencePanel } from '../components/knowledge/evidence-panel';
import { TimelineView } from '../components/knowledge/timeline-view';
import { AISummaryPanel } from '../components/knowledge/ai-summary-panel';
import { DiscoveryPanel } from '../components/knowledge/discovery-panel';
import { KnowledgeSearch } from '../components/knowledge/search';
import {
  KnowledgeEntity, EntityConnection, RelatedItem, EvidenceSource,
  AIExplanation, DiscoveryItem, KnowledgeSearchResult,
  KnowledgeEntityType, RelationshipType, ENTITY_COLORS, ENTITY_LABELS,
} from '../components/knowledge/types';

type RightTab = 'related' | 'evidence' | 'timeline' | 'ai';

const ENTITY_TYPES: KnowledgeEntityType[] = [
  'document', 'journal_entry', 'backtest', 'strategy', 'concept',
  'trading_rule', 'claim', 'pattern', 'mistake', 'note',
  'chart', 'economic_event',
];

const ENTITY_TYPE_ICONS: Partial<Record<KnowledgeEntityType, string>> = {
  document: '📄', journal_entry: '📓', backtest: '📊', strategy: '🎯',
  concept: '🧠', trading_rule: '📐', claim: '💡', pattern: '📈',
  mistake: '⚠️', note: '📝', chart: '🖼️', economic_event: '📅',
};

export default function KnowledgeEnginePage() {
  const { projectId } = useParams<{ projectId: string }>()!;

  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [connections, setConnections] = useState<EntityConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('related');
  const [showFilters, setShowFilters] = useState(true);
  const [showDiscovery, setShowDiscovery] = useState(true);
  const [typeFilters, setTypeFilters] = useState<Set<KnowledgeEntityType>>(new Set(ENTITY_TYPES));

  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSource[]>([]);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);

  const loadGraph = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const graphData = await callEdgeFunction<any>('ai', {
        operation: 'knowledge-graph-data',
        project_id: projectId,
      });
      const nodes: KnowledgeEntity[] = (graphData?.nodes || []).map((n: any) => ({
        id: n.id, type: n.type || 'concept', title: n.name || n.title || n.id,
        subtitle: n.category, description: n.description,
        timestamp: n.created_at, confidence: n.confidence,
        tags: n.tags,
      }));
      const conns: EntityConnection[] = (graphData?.edges || []).map((e: any) => ({
        source: nodes.find((n: KnowledgeEntity) => n.id === e.source_node_id || n.id === e.source) || nodes[0],
        target: nodes.find((n: KnowledgeEntity) => n.id === e.target_node_id || n.id === e.target) || nodes[0],
        relationship: (e.relationship || 'related_to') as RelationshipType,
        strength: e.strength ?? 0.5,
        confidence: e.confidence ?? 50,
        evidence: e.evidence,
      })).filter((c: EntityConnection) => c.source && c.target);
      setEntities(nodes);
      setConnections(conns);
      generateDiscoveryItems(nodes, conns);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  const filteredEntities = useMemo(() => {
    if (typeFilters.size === ENTITY_TYPES.length) return entities;
    return entities.filter((e) => typeFilters.has(e.type));
  }, [entities, typeFilters]);

  const filteredConnections = useMemo(() => {
    const ids = new Set(filteredEntities.map((e) => e.id));
    return connections.filter((c) => ids.has(c.source.id) && ids.has(c.target.id));
  }, [filteredEntities, connections]);

  const generateDiscoveryItems = (ents: KnowledgeEntity[], conns: EntityConnection[]) => {
    const items: DiscoveryItem[] = [];
    const typesPresent = new Set(ents.map((e) => e.type));
    const missingTypes = ENTITY_TYPES.filter((t) => !typesPresent.has(t));
    if (missingTypes.length > 0) {
      items.push({
        type: 'gap', title: 'Unconnected Entity Types',
        description: `${missingTypes.length} entity types have no data: ${missingTypes.map((t) => ENTITY_LABELS[t]).join(', ')}`,
        entities: [], severity: 'medium', actionable: true,
      });
    }
    const contradictory = conns.filter((c) => c.relationship === 'contradicts');
    if (contradictory.length > 0) {
      items.push({
        type: 'contradiction', title: `${contradictory.length} Contradiction${contradictory.length > 1 ? 's' : ''} Detected`,
        description: 'Sources contain conflicting information that should be resolved',
        entities: contradictory.flatMap((c) => [c.source, c.target]),
        severity: 'high', actionable: true,
      });
    }
    const mistakes = ents.filter((e) => e.type === 'mistake');
    if (mistakes.length > 2) {
      items.push({
        type: 'repeated_mistake', title: `${mistakes.length} Repeated Patterns`,
        description: 'Multiple mistakes may indicate a recurring behavioral issue',
        entities: mistakes, severity: 'high', actionable: true,
      });
    }
    const strongConns = conns.filter((c) => c.confidence > 80);
    if (strongConns.length > 3) {
      items.push({
        type: 'successful_behavior', title: `${strongConns.length} High-Confidence Connections`,
        description: 'Strong relationships identified across your knowledge base',
        entities: strongConns.flatMap((c) => [c.source, c.target]),
        severity: 'low', actionable: false,
      });
    }
    setDiscoveryItems(items);
  };

  const handleSelectEntity = useCallback(async (entity: KnowledgeEntity | null) => {
    setSelectedEntity(entity);
    if (!entity || !projectId) { setRelatedItems([]); setEvidence([]); setAiExplanation(null); return; }
    setPanelLoading(true);
    setRightTab('related');
    try {
      const links = connections.filter(
        (c) => c.source.id === entity.id || c.target.id === entity.id
      );
      const related: RelatedItem[] = links.map((c) => ({
        entity: c.source.id === entity.id ? c.target : c.source,
        relationship: c.relationship,
        strength: c.strength,
        evidence: c.evidence,
      }));
      setRelatedItems(related);
      if (related.length > 0) {
        const ev: EvidenceSource[] = related.filter((r) => r.evidence).map((r) => ({
          title: `Relationship: ${r.relationship}`,
          content: r.evidence || '',
          source: r.entity.title,
          relevance: r.strength,
          confidence: Math.round(r.strength * 100),
        }));
        setEvidence(ev);
        setAiExplanation({
          summary: `${entity.title} has ${related.length} connection${related.length !== 1 ? 's' : ''} across your knowledge base`,
          reasoning: related.slice(0, 5).map((r) =>
            `${r.entity.title} (${ENTITY_LABELS[r.entity.type]}) — ${r.relationship}`
          ),
          evidence: ev,
          confidence: related.length > 0
            ? Math.round(related.reduce((s, r) => s + r.strength, 0) / related.length * 100)
            : 0,
        });
      }
    } catch {
      setRelatedItems([]);
      setEvidence([]);
      setAiExplanation(null);
    } finally {
      setPanelLoading(false);
    }
  }, [projectId, connections]);

  const handleSearch = useCallback(async (query: string) => {
    if (!projectId) return;
    setSearching(true);
    try {
      const data = await callEdgeFunction<any>('ai', {
        operation: 'knowledge-search',
        project_id: projectId,
        data: { query },
      });
      const results: KnowledgeSearchResult[] = (data?.results || []).map((r: any) => ({
        entity: {
          id: r.id, type: r.type || 'concept', title: r.title || r.name || r.id,
          description: r.description, timestamp: r.created_at,
        },
        relevance: r.relevance ?? 0.5,
        matchContext: r.context || r.description || '',
        connections: r.connections ?? 0,
      }));
      // Fallback: simple client-side search if no results
      if (results.length === 0) {
        const q = query.toLowerCase();
        entities.filter((e) =>
          e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
        ).forEach((e) => {
          const connCount = connections.filter(
            (c) => c.source.id === e.id || c.target.id === e.id
          ).length;
          results.push({ entity: e, relevance: 0.5, matchContext: e.description || '', connections: connCount });
        });
      }
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [projectId, entities, connections]);

  const handleSearchSelect = useCallback((result: KnowledgeSearchResult) => {
    handleSelectEntity(result.entity);
  }, [handleSelectEntity]);

  if (!projectId) return <ErrorState message="Project not found" />;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Network className="h-4 w-4 text-primary-text" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Knowledge Engine</h1>
            <p className="text-3xs text-muted-foreground">
              {entities.length} entities · {connections.length} connections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56">
            <KnowledgeSearch onSearch={handleSearch} results={searchResults} searching={searching} onSelect={handleSearchSelect} />
          </div>
          <Button variant="ghost" size="icon-xs" onClick={loadGraph} disabled={loading} aria-label="Refresh graph">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters">
            <Filter className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setShowDiscovery(!showDiscovery)} aria-label="Toggle discovery">
            <Lightbulb className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Filters + Discovery */}
        <motion.aside
          animate={{ width: showFilters || showDiscovery ? 240 : 0 }}
          className="border-r border-border bg-surface overflow-hidden shrink-0"
        >
          <div className="w-60 p-3 space-y-4 overflow-y-auto h-full">
            {/* Type Filters */}
            <div>
              <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Layers className="h-3 w-3" /> Entity Types
              </p>
              <div className="space-y-0.5">
                {ENTITY_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 rounded px-1.5 py-1 cursor-pointer hover:bg-background/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={typeFilters.has(type)}
                      onChange={() => {
                        const next = new Set(typeFilters);
                        next.has(type) ? next.delete(type) : next.add(type);
                        setTypeFilters(next.size === 0 ? new Set([type]) : next);
                      }}
                      className="rounded border-border h-3 w-3 accent-primary"
                    />
                    <div className="h-2 w-2 rounded-full" style={{ background: ENTITY_COLORS[type] }} />
                    <span className="text-xs text-foreground flex-1">{ENTITY_LABELS[type]}</span>
                    <span className="text-3xs text-muted-foreground">
                      {entities.filter((e) => e.type === type).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Discovery */}
            {showDiscovery && (
              <div>
                <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Discoveries
                </p>
                <DiscoveryPanel
                  items={discoveryItems}
                  loading={loading}
                  onExplore={(item) => {
                    if (item.entities[0]) handleSelectEntity(item.entities[0]);
                  }}
                  onSearch={() => {}}
                />
              </div>
            )}
          </div>
        </motion.aside>

        {/* Center — Graph */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Loading knowledge graph...</p>
              </div>
            </div>
          )}
          <KnowledgeGraphView
            entities={filteredEntities}
            connections={filteredConnections}
            selectedId={selectedEntity?.id}
            onSelect={handleSelectEntity}
            loading={false}
          />
        </div>

        {/* Right Panel — Entity Detail */}
        <motion.aside
          animate={{ width: selectedEntity ? 340 : 0 }}
          className="border-l border-border bg-surface overflow-hidden shrink-0"
        >
          <div className="w-[340px] h-full flex flex-col">
            {selectedEntity && (
              <>
                {/* Entity Header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: `${ENTITY_COLORS[selectedEntity.type]}15` }}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: ENTITY_COLORS[selectedEntity.type] }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{selectedEntity.title}</p>
                    <p className="text-3xs text-muted-foreground">{ENTITY_LABELS[selectedEntity.type]}</p>
                  </div>
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-0.5 px-3 pt-2 border-b border-border shrink-0">
                  {([
                    { key: 'related' as const, label: 'Related', icon: '🔗' },
                    { key: 'evidence' as const, label: 'Evidence', icon: '📋' },
                    { key: 'timeline' as const, label: 'Timeline', icon: '📅' },
                    { key: 'ai' as const, label: 'AI', icon: '🤖' },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setRightTab(tab.key)}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1.5 text-3xs font-medium rounded-t-md transition-colors',
                        rightTab === tab.key
                          ? 'bg-background text-foreground border border-b-0 border-border'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/30'
                      )}
                    >
                      <span>{tab.icon}</span> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto">
                  {rightTab === 'related' && (
                    <RelatedItemsPanel
                      entity={selectedEntity}
                      related={relatedItems}
                      loading={panelLoading}
                      onNavigate={handleSelectEntity}
                    />
                  )}
                  {rightTab === 'evidence' && (
                    <EvidencePanel evidence={evidence} loading={panelLoading} />
                  )}
                  {rightTab === 'timeline' && (
                    <TimelineView
                      entities={[selectedEntity, ...relatedItems.map((r) => r.entity)]}
                      loading={panelLoading}
                      onNavigate={handleSelectEntity}
                    />
                  )}
                  {rightTab === 'ai' && (
                    <AISummaryPanel
                      summary={aiExplanation?.summary || ''}
                      reasoning={aiExplanation?.reasoning || []}
                      evidence={aiExplanation?.evidence || []}
                      confidence={aiExplanation?.confidence || 0}
                      loading={panelLoading}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
