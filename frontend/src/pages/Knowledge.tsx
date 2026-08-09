import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useKnowledgeRules } from '../hooks/useKnowledgeRules';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import {Lightbulb, TrendingUp, TrendingDown, Search, Network, Tags, Link, ChevronDown} from 'lucide-react';
import type { KnowledgeRule } from '../api/types';

function RuleCard({ rule }: { rule: KnowledgeRule }) {
  const [expanded, setExpanded] = useState(false);
  const wr = rule.win_rate != null ? (rule.win_rate * 100).toFixed(1) : '—';
  const confidence = rule.confidence != null ? rule.confidence.toFixed(1) : '—';
  const isHighConfidence = rule.confidence != null && rule.confidence >= 60;

  return (
    <motion.div layout className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', isHighConfidence ? 'bg-success/10' : 'bg-primary/10')}>
              <Lightbulb className={cn('h-5 w-5', isHighConfidence ? 'text-success' : 'text-primary-text')} />
            </div>
            <div><h3 className="text-sm font-semibold text-foreground">{rule.title}</h3>{rule.category && <p className="text-xs text-muted mt-0.5">{rule.category}</p>}</div>
          </div>
          <Badge variant={isHighConfidence ? 'success' : rule.confidence != null && rule.confidence >= 30 ? 'warning' : 'default'} size="sm">Conf: {confidence}</Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-lg bg-background p-2.5 text-center"><p className="text-lg font-bold font-mono text-foreground">{rule.occurrences}</p><p className="text-3xs text-muted">Occurrences</p></div>
          <div className="rounded-lg bg-background p-2.5 text-center"><p className="text-lg font-bold font-mono text-success">{wr}%</p><p className="text-3xs text-muted">Win Rate</p></div>
          <div className="rounded-lg bg-background p-2.5 text-center"><p className="text-lg font-bold font-mono text-primary-text">{rule.avg_rr != null ? rule.avg_rr.toFixed(2) : '—'}</p><p className="text-3xs text-muted">Avg R:R</p></div>
          <div className="rounded-lg bg-background p-2.5 text-center"><p className="text-lg font-bold font-mono text-warning">{rule.expectancy != null ? rule.expectancy.toFixed(2) : '—'}</p><p className="text-3xs text-muted">Expectancy</p></div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between rounded-lg bg-background px-4 py-2 text-xs font-medium text-muted hover:text-secondary transition-colors">
          <span>Details & Evidence</span><ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <div className="mt-4 space-y-3">
            {rule.description && (
              <div className="rounded-lg bg-background p-4">
                <h4 className="mb-2 text-3xs font-semibold text-muted uppercase tracking-wider">Evidence</h4>
                {rule.description.split('\n').map((line, i) => (<p key={i} className="text-xs text-secondary leading-relaxed">{line}</p>))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-success/10 p-3">
                <div className="flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3 text-success" /><span className="text-xs font-medium text-success">Wins</span></div>
                <p className="text-lg font-bold font-mono text-success">{rule.wins}</p>
              </div>
              <div className="rounded-lg bg-danger/10 p-3">
                <div className="flex items-center gap-1 mb-1"><TrendingDown className="h-3 w-3 text-danger-text" /><span className="text-xs font-medium text-danger-text">Losses</span></div>
                <p className="text-lg font-bold font-mono text-danger-text">{rule.losses}</p>
              </div>
            </div>
            {rule.signature && (
              <div className="rounded-lg border border-dashed border-border p-3">
                <span className="text-xs text-muted font-medium">Signature</span>
                <p className="mt-1 font-mono text-xs text-secondary break-all">{rule.signature}</p>
              </div>
            )}
            <p className="text-3xs text-muted">Created: {new Date(rule.created_at).toLocaleDateString()} &bull; Updated: {new Date(rule.updated_at).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function KnowledgePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: rules, isLoading, error, refetch } = useKnowledgeRules(projectId!);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!rules) return [];
    return rules.filter((r: KnowledgeRule) => {
      if (searchQuery && !r.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !r.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      return true;
    }).sort((a: KnowledgeRule, b: KnowledgeRule) => (b.confidence ?? 0) - (a.confidence ?? 0));
  }, [rules, searchQuery, categoryFilter]);

  const categories = useMemo(() => { if (!rules) return []; return Array.from(new Set(rules.map((r: KnowledgeRule) => r.category).filter(Boolean))); }, [rules]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-60" /></div><Skeleton className="h-8 w-28 rounded-lg" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10"><Network className="h-6 w-6 text-danger-text" /></div><p className="text-sm font-medium text-foreground">Error loading knowledge</p><Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button></div></div>);
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-foreground tracking-tight">Knowledge</h1><p className="text-sm text-muted mt-0.5">Reusable trading knowledge from historical data</p></div></div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-elevated"><Lightbulb className="h-6 w-6 text-muted" /></div>
          <p className="text-sm font-medium text-secondary">No knowledge rules yet</p>
          <p className="text-xs text-muted mt-1 max-w-sm">Create at least 5 similar trades to generate a knowledge rule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Network className="h-5 w-5 text-primary-text" /></div>
          <div><h1 className="text-xl font-semibold text-foreground tracking-tight">Knowledge</h1><p className="text-sm text-muted mt-0.5">{rules.length} rules in your knowledge base</p></div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Left — Filters & Explorer */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2"><Search className="h-4 w-4 text-muted" /><h3 className="text-xs font-medium text-foreground uppercase tracking-wider">Explore</h3></div>
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search knowledge..." className="text-xs" />
          <div>
            <h4 className="text-2xs font-medium text-muted mb-2 flex items-center gap-1"><Tags className="h-3 w-3" />Categories</h4>
            <div className="space-y-1">
              <button onClick={() => setCategoryFilter(null)} className={cn('w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors', !categoryFilter ? 'bg-primary/10 text-primary-text' : 'text-muted hover:text-secondary')}>All ({rules.length})</button>
              {categories.map((cat: any) => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} className={cn('w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors', categoryFilter === cat ? 'bg-primary/10 text-primary-text' : 'text-muted hover:text-secondary')}>{cat} ({rules.filter((r: KnowledgeRule) => r.category === cat).length})</button>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2"><Link className="h-3.5 w-3.5 text-muted" /><h4 className="text-2xs font-medium text-muted">Connections</h4></div>
            <p className="text-3xs text-muted">Rules with shared signatures or complementary conditions are linked. Click a rule to explore connections.</p>
          </div>
        </motion.div>

        {/* Right — Rule Cards */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-4">
          {filtered.length > 0 ? filtered.map((rule: KnowledgeRule, i: number) => (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <RuleCard rule={rule} />
            </motion.div>
          )) : (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-elevated"><Search className="h-5 w-5 text-muted" /></div>
              <p className="text-sm text-secondary">No matching rules</p>
              <p className="text-xs text-muted mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
