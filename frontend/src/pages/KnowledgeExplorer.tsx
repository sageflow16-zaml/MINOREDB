import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import {
  useKnowledgeLinks, useAutoLink, useCreateKnowledgeLink, useDeleteKnowledgeLink,
  useKnowledgeGraph,
} from '../hooks/useAIFoundation';
import {
  Network, Plus, Trash2, RefreshCw, Link2, GitBranch,
} from 'lucide-react';
import type { KnowledgeLink, KnowledgeGraphData } from '../api/types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const entityTypes = ['trade', 'strategy', 'journal', 'replay', 'mistake', 'lesson', 'goal', 'risk_event', 'research'];
const relationshipTypes = ['caused_by', 'improved_by', 'related_to', 'contradicts', 'supports', 'follows_strategy'];

export default function KnowledgeExplorerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ source_type: 'trade', source_id: '', target_type: 'strategy', target_id: '', relationship: 'related_to' });
  const cleanForm = () => ({ source_type: 'trade', source_id: '', target_type: 'strategy', target_id: '', relationship: 'related_to' });

  const links = useKnowledgeLinks(projectId!);
  const graph = useKnowledgeGraph(projectId!);
  const autoLink = useAutoLink(projectId!);
  const createLink = useCreateKnowledgeLink(projectId!);
  const deleteLink = useDeleteKnowledgeLink(projectId!);

  const linksData = links.data || [];
  const graphData = graph.data as KnowledgeGraphData | undefined;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Knowledge Explorer"
          description="Visualize and manage relationships between trades, strategies, lessons, and more"
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => autoLink.mutate()} disabled={autoLink.isPending}>
                <RefreshCw className={`h-4 w-4 mr-1 ${autoLink.isPending ? 'animate-spin' : ''}`} />
                Auto-Link
              </Button>
              <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                <Plus className="h-4 w-4 mr-1" />Add Link
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* Create Form */}
      {showCreate && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Source Type</label>
                  <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Source ID</label>
                  <input type="text" value={form.source_id} onChange={(e) => setForm({ ...form, source_id: e.target.value })} placeholder="UUID" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target Type</label>
                  <select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target ID</label>
                  <input type="text" value={form.target_id} onChange={(e) => setForm({ ...form, target_id: e.target.value })} placeholder="UUID" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Relationship</label>
                  <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    {relationshipTypes.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => {
                  createLink.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ source_type: 'trade', source_id: '', target_type: 'strategy', target_id: '', relationship: 'related_to' }); }});
                }} disabled={!form.source_id || !form.target_id || createLink.isPending}>
                  Create Link
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graph Visualization */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><GitBranch className="h-4 w-4" />Knowledge Graph</CardTitle></CardHeader>
            <CardContent>
              {graphData && graphData.nodes.length > 0 ? (
                <div className="rounded-lg border border-border/50 bg-muted/10 p-6 min-h-[300px]">
                  {/* Simple text-based graph visualization */}
                  <div className="flex flex-wrap gap-4">
                    {graphData.nodes.map((node) => (
                      <div key={node.id} className="rounded-lg border border-border bg-background p-3 min-w-[120px] text-center">
                        <Badge variant="secondary" className="text-3xs mb-1">{node.type}</Badge>
                        <p className="text-xs font-mono text-muted-foreground">{node.entity_id.slice(0, 8)}...</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-1">
                    {graphData.edges.map((edge, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{edge.source.split(':')[1]?.slice(0, 8)}</span>
                        <span className="text-primary-text">→ {edge.relationship}</span>
                        <span className="font-mono">{edge.target.split(':')[1]?.slice(0, 8)}</span>
                        <span className="text-3xs">({(edge.strength * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState message="No knowledge links yet. Use Auto-Link or create manual links." />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Links List */}
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Link2 className="h-4 w-4" />Links ({linksData.length})</CardTitle></CardHeader>
            <CardContent>
              {linksData.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {linksData.map((link: KnowledgeLink) => (
                    <div key={link.id} className="flex items-center gap-2 rounded-lg border border-border/50 p-2 text-xs">
                      <Badge variant="outline" className="text-3xs shrink-0">{link.source_type}</Badge>
                      <span className="text-primary-text shrink-0">→ {link.relationship}</span>
                      <Badge variant="outline" className="text-3xs shrink-0">{link.target_type}</Badge>
                      <Button size="sm" variant="ghost" className="ml-auto shrink-0 h-6 w-6 p-0" onClick={() => deleteLink.mutate(link.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No links yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
