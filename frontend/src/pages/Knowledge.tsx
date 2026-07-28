import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useKnowledgeRules } from '../hooks/useKnowledgeRules';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import {
  Lightbulb, TrendingUp, TrendingDown, Target, Zap, Search,
  Network, Tags, Link, Sparkles, ChevronDown, BookOpen,
  CheckCircle, AlertTriangle, Layers,
} from 'lucide-react';
import type { KnowledgeRule } from '../api/types';

function InsightBadge({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#111113] px-3 py-2">
      <span className="text-xs text-[#A1A1AA]">{label}</span>
      <span className={cn('text-xs font-mono font-medium', good === undefined ? 'text-[#FAFAFA]' : good ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{value}</span>
    </div>
  );
}

function RuleCard({ rule }: { rule: KnowledgeRule }) {
  const [expanded, setExpanded] = useState(false);
  const wr = rule.win_rate != null ? (rule.win_rate * 100).toFixed(1) : '—';
  const confidence = rule.confidence != null ? rule.confidence.toFixed(1) : '—';
  const isHighConfidence = rule.confidence != null && rule.confidence >= 60;

  return (
    <motion.div layout className="rounded-xl border border-[#27272A] bg-[#18181B] overflow-hidden transition-all hover:border-[#4F46E5]/30">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', isHighConfidence ? 'bg-[#22C55E]/10' : 'bg-[#4F46E5]/10')}>
              <Lightbulb className={cn('h-5 w-5', isHighConfidence ? 'text-[#22C55E]' : 'text-[#4F46E5]')} />
            </div>
            <div><h3 className="text-sm font-semibold text-[#FAFAFA]">{rule.title}</h3>{rule.category && <p className="text-xs text-[#71717A] mt-0.5">{rule.category}</p>}</div>
          </div>
          <Badge variant={isHighConfidence ? 'success' : rule.confidence != null && rule.confidence >= 30 ? 'warning' : 'default'} size="sm">Conf: {confidence}</Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-lg bg-[#111113] p-2.5 text-center"><p className="text-lg font-bold font-mono text-[#FAFAFA]">{rule.occurrences}</p><p className="text-[10px] text-[#71717A]">Occurrences</p></div>
          <div className="rounded-lg bg-[#111113] p-2.5 text-center"><p className="text-lg font-bold font-mono text-[#22C55E]">{wr}%</p><p className="text-[10px] text-[#71717A]">Win Rate</p></div>
          <div className="rounded-lg bg-[#111113] p-2.5 text-center"><p className="text-lg font-bold font-mono text-[#4F46E5]">{rule.avg_rr != null ? rule.avg_rr.toFixed(2) : '—'}</p><p className="text-[10px] text-[#71717A]">Avg R:R</p></div>
          <div className="rounded-lg bg-[#111113] p-2.5 text-center"><p className="text-lg font-bold font-mono text-[#F59E0B]">{rule.expectancy != null ? rule.expectancy.toFixed(2) : '—'}</p><p className="text-[10px] text-[#71717A]">Expectancy</p></div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between rounded-lg bg-[#111113] px-4 py-2 text-xs font-medium text-[#71717A] hover:text-[#A1A1AA] transition-colors">
          <span>Details & Evidence</span><ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <div className="mt-4 space-y-3">
            {rule.description && (
              <div className="rounded-lg bg-[#111113] p-4">
                <h4 className="mb-2 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Evidence</h4>
                {rule.description.split('\n').map((line, i) => (<p key={i} className="text-xs text-[#A1A1AA] leading-relaxed">{line}</p>))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#22C55E]/10 p-3">
                <div className="flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3 text-[#22C55E]" /><span className="text-xs font-medium text-[#22C55E]">Wins</span></div>
                <p className="text-lg font-bold font-mono text-[#22C55E]">{rule.wins}</p>
              </div>
              <div className="rounded-lg bg-[#EF4444]/10 p-3">
                <div className="flex items-center gap-1 mb-1"><TrendingDown className="h-3 w-3 text-[#EF4444]" /><span className="text-xs font-medium text-[#EF4444]">Losses</span></div>
                <p className="text-lg font-bold font-mono text-[#EF4444]">{rule.losses}</p>
              </div>
            </div>
            {rule.signature && (
              <div className="rounded-lg border border-dashed border-[#27272A] p-3">
                <span className="text-xs text-[#71717A] font-medium">Signature</span>
                <p className="mt-1 font-mono text-xs text-[#A1A1AA] break-all">{rule.signature}</p>
              </div>
            )}
            <p className="text-[10px] text-[#71717A]">Created: {new Date(rule.created_at).toLocaleDateString()} &bull; Updated: {new Date(rule.updated_at).toLocaleDateString()}</p>
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
      <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-60" /></div><Skeleton className="h-8 w-28 rounded-lg" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10"><Network className="h-6 w-6 text-[#EF4444]" /></div><p className="text-sm font-medium text-[#FAFAFA]">Error loading knowledge</p><Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button></div></div>);
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Knowledge</h1><p className="text-sm text-[#71717A] mt-0.5">Reusable trading knowledge from historical data</p></div></div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#27272A]"><Lightbulb className="h-6 w-6 text-[#71717A]" /></div>
          <p className="text-sm font-medium text-[#A1A1AA]">No knowledge rules yet</p>
          <p className="text-xs text-[#71717A] mt-1 max-w-sm">Create at least 5 similar trades to generate a knowledge rule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5]/10"><Network className="h-5 w-5 text-[#4F46E5]" /></div>
          <div><h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Knowledge</h1><p className="text-sm text-[#71717A] mt-0.5">{rules.length} rules in your knowledge base</p></div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Left — Filters & Explorer */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 space-y-4">
          <div className="flex items-center gap-2"><Search className="h-4 w-4 text-[#71717A]" /><h3 className="text-xs font-medium text-[#FAFAFA] uppercase tracking-wider">Explore</h3></div>
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search knowledge..." className="text-xs" />
          <div>
            <h4 className="text-[11px] font-medium text-[#71717A] mb-2 flex items-center gap-1"><Tags className="h-3 w-3" />Categories</h4>
            <div className="space-y-1">
              <button onClick={() => setCategoryFilter(null)} className={cn('w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors', !categoryFilter ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] hover:text-[#A1A1AA]')}>All ({rules.length})</button>
              {categories.map((cat: any) => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} className={cn('w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors', categoryFilter === cat ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] hover:text-[#A1A1AA]')}>{cat} ({rules.filter((r: KnowledgeRule) => r.category === cat).length})</button>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-[#27272A]">
            <div className="flex items-center gap-2 mb-2"><Link className="h-3.5 w-3.5 text-[#71717A]" /><h4 className="text-[11px] font-medium text-[#71717A]">Connections</h4></div>
            <p className="text-[10px] text-[#71717A]">Rules with shared signatures or complementary conditions are linked. Click a rule to explore connections.</p>
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
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><Search className="h-5 w-5 text-[#71717A]" /></div>
              <p className="text-sm text-[#A1A1AA]">No matching rules</p>
              <p className="text-xs text-[#71717A] mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
