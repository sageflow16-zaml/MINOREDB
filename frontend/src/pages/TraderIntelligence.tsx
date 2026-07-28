import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit, FileText, Activity, Scale, User,
  Plus, RefreshCw, CheckCircle, XCircle, Search, TrendingUp, TrendingDown,
  Target, AlertTriangle, Lightbulb, Sparkles, ChevronRight,
} from 'lucide-react';
import { traderIntelligenceService } from '../api/traderIntelligence';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import type { TradeDebrief, PersonalPattern, PersonalRule, TraderProfile, DashboardData } from '../api/traderIntelligence';

function MetricCard({ label, value, icon: Icon, accent, sub }: { label: string; value: string; icon: any; accent?: 'success' | 'danger' | 'warning' | 'default'; sub?: string }) {
  const accentColors = { default: 'text-[#FAFAFA]', success: 'text-[#22C55E]', danger: 'text-[#EF4444]', warning: 'text-[#F59E0B]' };
  const accentBg = { default: 'bg-[#4F46E5]/10', success: 'bg-[#22C55E]/10', danger: 'bg-[#EF4444]/10', warning: 'bg-[#F59E0B]/10' };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-medium text-[#71717A] tracking-wide">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', accentBg[accent || 'default'])}>
          <Icon className={cn('h-3.5 w-3.5', accent === 'success' ? 'text-[#22C55E]' : accent === 'danger' ? 'text-[#EF4444]' : accent === 'warning' ? 'text-[#F59E0B]' : 'text-[#4F46E5]')} />
        </div>
      </div>
      <p className={cn('text-xl font-bold font-mono tracking-tight', accentColors[accent || 'default'])}>{value}</p>
      {sub && <p className="text-[10px] text-[#71717A] mt-1">{sub}</p>}
    </motion.div>
  );
}

type TabType = 'overview' | 'debriefs' | 'patterns' | 'rules' | 'profile';

export default function TraderIntelligence() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tab, setTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [debriefs, setDebriefs] = useState<TradeDebrief[]>([]);
  const [patterns, setPatterns] = useState<PersonalPattern[]>([]);
  const [rules, setRules] = useState<PersonalRule[]>([]);
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [snapshots, setSnapshots] = useState<unknown[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedDebrief, setSelectedDebrief] = useState<TradeDebrief | null>(null);
  const [selectedRule, setSelectedRule] = useState<PersonalRule | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const [dash, d, p, r, prof, snaps] = await Promise.all([
        traderIntelligenceService.dashboard(projectId),
        traderIntelligenceService.listDebriefs(projectId, { limit: 50 }),
        traderIntelligenceService.listPatterns(projectId, { limit: 50 }),
        traderIntelligenceService.listRules(projectId, { limit: 50 }),
        traderIntelligenceService.getProfile(projectId).catch(() => null),
        traderIntelligenceService.getSnapshots(projectId).catch(() => []),
      ]);
      setDashboard(dash); setDebriefs(d); setPatterns(p); setRules(r); setProfile(prof); setSnapshots(snaps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async (action: string) => {
    if (!projectId) return;
    setGenerating(action);
    try {
      if (action === 'patterns') { setPatterns(await traderIntelligenceService.detectPatterns(projectId)); }
      else if (action === 'rules') { const result = await traderIntelligenceService.generateRules(projectId); setRules(result.rules); }
      else if (action === 'profile') { setProfile(await traderIntelligenceService.buildProfile(projectId)); }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally { setGenerating(null); }
  };

  const handleApproveRule = async (ruleId: string) => {
    if (!projectId) return;
    try { const updated = await traderIntelligenceService.approveRule(projectId, ruleId); setRules(prev => prev.map(r => r.id === ruleId ? updated : r)); } catch { }
  };

  const handleRejectRule = async (ruleId: string) => {
    if (!projectId) return;
    try { const updated = await traderIntelligenceService.rejectRule(projectId, ruleId, 'Rejected by user'); setRules(prev => prev.map(r => r.id === ruleId ? updated : r)); } catch { }
  };

  const filteredDebriefs = searchQuery ? debriefs.filter(d => d.summary?.toLowerCase().includes(searchQuery.toLowerCase())) : debriefs;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'debriefs', label: 'Debriefs' },
    { key: 'patterns', label: 'Patterns' },
    { key: 'rules', label: 'Rules' },
    { key: 'profile', label: 'Profile' },
  ];

  if (loading && !dashboard) {
    return (
      <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-60" /></div><Skeleton className="h-8 w-28 rounded-lg" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 space-y-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-7 w-20" /></div>))}</div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10"><BrainCircuit className="h-6 w-6 text-[#EF4444]" /></div><p className="text-sm font-medium text-[#FAFAFA]">Error loading intelligence</p><p className="text-xs text-[#71717A]">{error}</p><Button variant="outline" size="sm" onClick={fetchData}>Try Again</Button></div></div>);
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5]/10"><BrainCircuit className="h-5 w-5 text-[#4F46E5]" /></div>
          <div><h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Smart Engine</h1><p className="text-sm text-[#71717A] mt-0.5">Personal trading intelligence</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchData}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#EF4444]"><AlertTriangle className="h-4 w-4" />{error}</div>
          <Button variant="ghost" size="sm" onClick={fetchData}>Retry</Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-[#111113] p-0.5 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-all', tab === t.key ? 'bg-[#18181B] text-[#FAFAFA] shadow-sm' : 'text-[#71717A] hover:text-[#A1A1AA]')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && dashboard && (
        <OverviewTab dashboard={dashboard} profile={profile} patterns={patterns} rules={rules}
          onBuildProfile={() => handleGenerate('profile')} generating={generating === 'profile'} />
      )}
      {tab === 'debriefs' && (
        <DebriefsTab debriefs={filteredDebriefs} selected={selectedDebrief} onSelect={setSelectedDebrief}
          searchQuery={searchQuery} onSearch={setSearchQuery} />
      )}
      {tab === 'patterns' && (
        <PatternsTab patterns={patterns} onDetect={() => handleGenerate('patterns')} generating={generating === 'patterns'} />
      )}
      {tab === 'rules' && (
        <RulesTab rules={rules} selected={selectedRule} onSelect={setSelectedRule}
          onGenerate={() => handleGenerate('rules')} onApprove={handleApproveRule} onReject={handleRejectRule}
          generating={generating === 'rules'} />
      )}
      {tab === 'profile' && (
        <ProfileTab profile={profile} snapshots={snapshots} onBuild={() => handleGenerate('profile')} generating={generating === 'profile'} />
      )}
    </div>
  );
}

function OverviewTab({ dashboard, profile, patterns, rules, onBuildProfile, generating }: {
  dashboard: DashboardData; profile: TraderProfile | null;
  patterns: PersonalPattern[]; rules: PersonalRule[];
  onBuildProfile: () => void; generating: boolean;
}) {
  const sortedPatterns = [...patterns].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)).slice(0, 4);
  const draftRules = rules.filter(r => r.status === 'draft');
  const hasProfile = !!profile;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Debriefs" value={String(dashboard.debrief_count)} icon={FileText} accent="default" />
        <MetricCard label="Patterns" value={String(dashboard.pattern_count)} icon={Activity} accent="warning" />
        <MetricCard label="Rules" value={String(dashboard.rule_count)} icon={Scale} accent="default" />
        <MetricCard label="Approved Rules" value={String(dashboard.approved_rule_count)} icon={CheckCircle} accent="success" />
      </div>

      {/* Profile + Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Snapshot */}
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-[#71717A]" /><h3 className="text-sm font-medium text-[#FAFAFA]">Trader Profile</h3></div>
            <Button variant="ghost" size="sm" onClick={onBuildProfile} disabled={generating}>{generating ? 'Building...' : hasProfile ? 'Rebuild' : 'Build'}</Button>
          </div>
          {profile ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1"><span className="text-[#71717A]">Discipline Score</span><span className={cn('font-mono font-medium', (profile.discipline_score ?? 0) >= 70 ? 'text-[#22C55E]' : (profile.discipline_score ?? 0) >= 40 ? 'text-[#F59E0B]' : 'text-[#EF4444]')}>{profile.discipline_score?.toFixed(0) ?? 'N/A'}</span></div>
                <div className="h-2 rounded-full bg-[#27272A]"><div className="h-2 rounded-full bg-[#4F46E5] transition-all" style={{ width: `${profile.discipline_score ?? 0}%` }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InsightBadge label="Trades Analyzed" value={String(profile.total_trades_analyzed ?? 0)} />
                <InsightBadge label="Active Patterns" value={String(profile.active_patterns ?? 0)} />
                <InsightBadge label="Approved Rules" value={String(profile.approved_rules ?? 0)} />
                <InsightBadge label="Trading Style" value={profile.trading_style || '—'} />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-gradient-to-r from-[#4F46E5]/5 to-[#22C55E]/5 p-3">
                <Sparkles className="h-4 w-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <p className="text-xs text-[#A1A1AA]">Top improvement: {profile.improvement_suggestions?.[0] ?? 'Add more trades to generate suggestions.'}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><BrainCircuit className="h-5 w-5 text-[#71717A]" /></div>
              <p className="text-sm text-[#A1A1AA]">No profile built yet</p>
              <p className="text-xs text-[#71717A] mt-1 max-w-xs">Build a trader profile to get personalized insights.</p>
              <Button size="sm" className="mt-3" onClick={onBuildProfile} disabled={generating}>{generating ? 'Building...' : 'Build Profile'}</Button>
            </div>
          )}
        </div>

        {/* Recent Debriefs */}
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#71717A]" /><h3 className="text-sm font-medium text-[#FAFAFA]">Recent Debriefs</h3></div>
          </div>
          {(dashboard.recent_debriefs ?? []).length > 0 ? (
            <div className="space-y-2">
              {dashboard.recent_debriefs.slice(0, 4).map(d => (
                <div key={d.id} className="rounded-lg bg-[#111113] px-3 py-2">
                  <div className="flex items-center justify-between"><span className="text-xs text-[#A1A1AA] truncate flex-1">{d.summary?.slice(0, 60) ?? 'Debrief'}</span>{d.overall_rating ? <span className={cn('text-xs font-mono font-medium shrink-0 ml-2', d.overall_rating >= 7 ? 'text-[#22C55E]' : 'text-[#F59E0B]')}>{d.overall_rating}/10</span> : null}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-[#71717A] py-6 text-center">No debriefs yet</p>}
        </div>
      </div>

      {/* High Confidence Patterns + Rule Drafts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4"><Activity className="h-4 w-4 text-[#71717A]" /><h3 className="text-sm font-medium text-[#FAFAFA]">Top Patterns</h3></div>
          {sortedPatterns.length > 0 ? (
            <div className="space-y-2">
              {sortedPatterns.map(p => (
                <div key={p.id} className="rounded-lg bg-[#111113] px-3 py-2">
                  <div className="flex items-center justify-between mb-1"><span className="text-xs text-[#FAFAFA] font-medium">{p.name || 'Pattern'}</span><Badge variant={p.category === 'session' ? 'info' : p.category === 'pair' ? 'default' : 'warning'} size="sm">{p.category}</Badge></div>
                  <div className="flex items-center gap-3 text-[10px] text-[#71717A]"><span>{p.occurrence_count} occurrences</span><span>{p.win_count ?? 0}W / {p.loss_count ?? 0}L</span></div>
                  {p.confidence != null && <div className="mt-1 h-1 rounded-full bg-[#27272A]"><div className="h-1 rounded-full bg-[#4F46E5]" style={{ width: `${p.confidence}%` }} /></div>}
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-[#71717A] py-6 text-center">No patterns detected. Run pattern detection.</p>}
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4"><Scale className="h-4 w-4 text-[#71717A]" /><h3 className="text-sm font-medium text-[#FAFAFA]">Rules Awaiting Review ({draftRules.length})</h3></div>
          {draftRules.length > 0 ? (
            <div className="space-y-2">
              {draftRules.slice(0, 5).map(r => (
                <div key={r.id} className="rounded-lg bg-[#111113] px-3 py-2 flex items-center justify-between">
                  <div className="flex-1 min-w-0"><p className="text-xs text-[#FAFAFA] truncate">{r.title}</p><p className="text-[10px] text-[#71717A] truncate">{r.description?.slice(0, 50) ?? ''}</p></div>
                  <Badge variant="warning" size="sm">draft</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-[#71717A] py-6 text-center">No rules awaiting review.</p>}
        </div>
      </div>
    </motion.div>
  );
}

function InsightBadge({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#111113] px-3 py-2">
      <span className="text-xs text-[#A1A1AA]">{label}</span>
      <span className={cn('text-xs font-mono font-medium', good === undefined ? 'text-[#FAFAFA]' : good ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{value}</span>
    </div>
  );
}

function DebriefsTab({ debriefs, selected, onSelect, searchQuery, onSearch }: {
  debriefs: TradeDebrief[]; selected: TradeDebrief | null;
  onSelect: (d: TradeDebrief | null) => void; searchQuery: string; onSearch: (q: string) => void;
}) {
  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)} className="text-xs">&larr; Back</Button>
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#FAFAFA]">Debrief Detail</h3>
            {selected.overall_rating && <Badge variant={selected.overall_rating >= 7 ? 'success' : 'warning'}>{selected.overall_rating}/10</Badge>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Entry Review', value: selected.entry_review },
              { label: 'Execution Review', value: selected.execution_review },
              { label: 'Exit Review', value: selected.exit_review },
              { label: 'Psychology Review', value: selected.psychology_review },
            ].map(s => s.value ? (
              <div key={s.label} className="rounded-lg bg-[#111113] p-3">
                <p className="text-[11px] font-medium text-[#71717A] mb-1">{s.label}</p>
                <p className="text-xs text-[#A1A1AA]">{s.value}</p>
              </div>
            ) : null)}
          </div>
          {selected.summary && (
            <div className="rounded-lg bg-[#111113] p-3 mt-4">
              <p className="text-[11px] font-medium text-[#71717A] mb-1">Summary</p>
              <p className="text-xs text-[#A1A1AA]">{selected.summary}</p>
            </div>
          )}
          {selected.lessons_learned && (Array.isArray(selected.lessons_learned) ? selected.lessons_learned.length > 0 : true) && (
            <div className="mt-4">
              <p className="text-[11px] font-medium text-[#71717A] mb-2">Lessons Learned</p>
              <ul className="space-y-1">
                {(Array.isArray(selected.lessons_learned) ? selected.lessons_learned : [selected.lessons_learned]).filter(Boolean).map((l: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#A1A1AA]"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />{l}</li>
                ))}
              </ul>
            </div>
          )}
          {selected.strengths && selected.strengths.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {selected.strengths.map((s, i) => <span key={i} className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] text-[#22C55E]">{s}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
        <Input value={searchQuery} onChange={e => onSearch(e.target.value)} placeholder="Search debriefs..." className="pl-10" />
      </div>
      {debriefs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><FileText className="h-5 w-5 text-[#71717A]" /></div>
          <p className="text-sm text-[#A1A1AA]">No debriefs found</p>
          <p className="text-xs text-[#71717A] mt-1">Generate debriefs from completed trades via the trades page.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {debriefs.map(d => (
            <button key={d.id} onClick={() => onSelect(d)}
              className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 text-left transition-all hover:border-[#4F46E5]/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#71717A]">{new Date(d.created_at).toLocaleDateString()}</span>
                {d.overall_rating && <span className={cn('text-xs font-mono font-bold', d.overall_rating >= 7 ? 'text-[#22C55E]' : 'text-[#F59E0B]')}>{d.overall_rating}/10</span>}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-[#A1A1AA]">{d.summary ?? 'No summary'}</p>
              {d.strengths && d.strengths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.strengths.slice(0, 2).map((s, i) => <span key={i} className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] text-[#22C55E]">{s}</span>)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PatternsTab({ patterns, onDetect, generating }: { patterns: PersonalPattern[]; onDetect: () => void; generating: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#71717A]">{patterns.length} patterns detected</p>
        <Button size="sm" onClick={onDetect} disabled={generating}>{generating ? 'Detecting...' : 'Detect Patterns'}</Button>
      </div>
      {patterns.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><Activity className="h-5 w-5 text-[#71717A]" /></div>
          <p className="text-sm text-[#A1A1AA]">No patterns detected</p>
          <p className="text-xs text-[#71717A] mt-1">Click &quot;Detect Patterns&quot; to analyze your trading data.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.map(p => (
            <div key={p.id} className={cn('rounded-xl border border-[#27272A] bg-[#18181B] p-5', !p.active && 'opacity-60')}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[#FAFAFA]">{p.name || 'Pattern'}</h4>
                <Badge variant={p.category === 'session' ? 'info' : p.category === 'pair' ? 'default' : p.category === 'direction' ? 'warning' : 'secondary'} size="sm">{p.category}</Badge>
              </div>
              <p className="text-xs text-[#71717A] mb-3">{p.description}</p>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="rounded-lg bg-[#111113] p-2"><p className="text-[10px] text-[#71717A]">Trades</p><p className="text-xs font-medium text-[#FAFAFA]">{p.occurrence_count}</p></div>
                <div className="rounded-lg bg-[#111113] p-2"><p className="text-[10px] text-[#22C55E]">Wins</p><p className="text-xs font-medium text-[#FAFAFA]">{p.win_count ?? 0}</p></div>
                <div className="rounded-lg bg-[#111113] p-2"><p className="text-[10px] text-[#EF4444]">Losses</p><p className="text-xs font-medium text-[#FAFAFA]">{p.loss_count ?? 0}</p></div>
              </div>
              {p.confidence != null && (
                <div><div className="flex items-center justify-between text-[10px] text-[#71717A] mb-1"><span>Confidence</span><span>{p.confidence.toFixed(0)}%</span></div><div className="h-1.5 rounded-full bg-[#27272A]"><div className="h-1.5 rounded-full bg-[#4F46E5]" style={{ width: `${p.confidence}%` }} /></div></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RulesTab({ rules, selected, onSelect, onGenerate, onApprove, onReject, generating }: {
  rules: PersonalRule[]; selected: PersonalRule | null;
  onSelect: (r: PersonalRule | null) => void;
  onGenerate: () => void; onApprove: (id: string) => void; onReject: (id: string) => void; generating: boolean;
}) {
  const draftCount = rules.filter(r => r.status === 'draft').length;
  const approvedCount = rules.filter(r => r.status === 'approved').length;

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)} className="text-xs">&larr; Back</Button>
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#FAFAFA]">{selected.title}</h3>
            <Badge variant={selected.status === 'approved' ? 'success' : selected.status === 'rejected' ? 'destructive' : 'warning'}>{selected.status}</Badge>
          </div>
          {selected.description && <p className="text-xs text-[#71717A] mb-4">{selected.description}</p>}
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <InsightBadge label="Category" value={selected.category || '—'} />
            <InsightBadge label="Version" value={selected.version || '—'} />
          </div>
          {selected.supporting_stats && (
            <div className="rounded-lg bg-[#111113] p-3 mb-4">
              <p className="text-[11px] font-medium text-[#71717A] mb-2">Supporting Stats</p>
              <pre className="text-[10px] text-[#A1A1AA] whitespace-pre-wrap">{JSON.stringify(selected.supporting_stats, null, 2)}</pre>
            </div>
          )}
          {selected.status === 'draft' && (
            <div className="flex gap-3">
              <Button size="sm" onClick={() => onApprove(selected.id)}><CheckCircle className="mr-1.5 h-4 w-4" /> Approve</Button>
              <Button variant="outline" size="sm" onClick={() => onReject(selected.id)}><XCircle className="mr-1.5 h-4 w-4 text-[#EF4444]" /> Reject</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#71717A]">{draftCount} draft, {approvedCount} approved</p>
        <Button size="sm" onClick={onGenerate} disabled={generating}>{generating ? 'Generating...' : 'Generate Rules'}</Button>
      </div>
      {rules.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><Scale className="h-5 w-5 text-[#71717A]" /></div>
          <p className="text-sm text-[#A1A1AA]">No rules yet</p>
          <p className="text-xs text-[#71717A] mt-1">Generate rules from patterns and debriefs.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(r => (
            <button key={r.id} onClick={() => onSelect(r)}
              className="flex items-center justify-between w-full rounded-lg bg-[#111113] px-4 py-3 text-left transition-all hover:bg-[#18181B]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-medium text-[#FAFAFA]">{r.title}</span><Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'warning'} size="sm">{r.status}</Badge></div>
                {r.description && <p className="mt-0.5 truncate text-xs text-[#71717A]">{r.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-[10px] text-[#71717A]">v{r.version}</span>
                {r.status === 'draft' && (
                  <><button onClick={e => { e.stopPropagation(); onApprove(r.id); }} className="rounded p-1 text-[#22C55E] hover:bg-[#22C55E]/10"><CheckCircle className="h-4 w-4" /></button><button onClick={e => { e.stopPropagation(); onReject(r.id); }} className="rounded p-1 text-[#EF4444] hover:bg-[#EF4444]/10"><XCircle className="h-4 w-4" /></button></>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ profile, snapshots, onBuild, generating }: {
  profile: TraderProfile | null; snapshots: unknown[]; onBuild: () => void; generating: boolean;
}) {
  if (!profile) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#27272A]"><BrainCircuit className="h-6 w-6 text-[#71717A]" /></div>
        <p className="text-sm font-medium text-[#A1A1AA]">No profile built</p>
        <p className="text-xs text-[#71717A] mt-1">Build your trader profile to get AI-powered insights.</p>
        <Button className="mt-5" size="sm" onClick={onBuild} disabled={generating}>{generating ? 'Building...' : 'Build Profile'}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Trades Analyzed" value={String(profile.total_trades_analyzed ?? 0)} icon={Activity} />
        <MetricCard label="Active Patterns" value={String(profile.active_patterns ?? 0)} icon={Activity} accent="warning" />
        <MetricCard label="Approved Rules" value={String(profile.approved_rules ?? 0)} icon={CheckCircle} accent="success" />
        <MetricCard label="Trading Style" value={profile.trading_style || '—'} icon={User} />
      </div>

      {/* Discipline Score */}
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#FAFAFA]">Discipline Score</h3>
          <Button variant="ghost" size="sm" onClick={onBuild} disabled={generating}>{generating ? '...' : 'Rebuild'}</Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 rounded-full bg-[#27272A]">
            <div className={cn('h-3 rounded-full transition-all', (profile.discipline_score ?? 0) >= 70 ? 'bg-[#22C55E]' : (profile.discipline_score ?? 0) >= 40 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]')}
              style={{ width: `${profile.discipline_score ?? 0}%` }} />
          </div>
          <span className="text-2xl font-bold font-mono text-[#FAFAFA]">{profile.discipline_score?.toFixed(0)}</span>
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {profile.strengths && profile.strengths.length > 0 && (
          <div className="rounded-xl border border-[#22C55E]/20 bg-[#18181B] p-5">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-[#22C55E]" /><h3 className="text-sm font-medium text-[#22C55E]">Strengths</h3></div>
            <ul className="space-y-1">
              {profile.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#A1A1AA]"><CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22C55E]" />{s}</li>
              ))}
            </ul>
          </div>
        )}
        {profile.weaknesses && profile.weaknesses.length > 0 && (
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#18181B] p-5">
            <div className="flex items-center gap-2 mb-3"><TrendingDown className="h-4 w-4 text-[#EF4444]" /><h3 className="text-sm font-medium text-[#EF4444]">Areas to Improve</h3></div>
            <ul className="space-y-1">
              {profile.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#A1A1AA]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#EF4444]" />{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {profile.improvement_suggestions && profile.improvement_suggestions.length > 0 && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-[#F59E0B]" /><h3 className="text-sm font-medium text-[#F59E0B]">Improvement Suggestions</h3></div>
          <ul className="space-y-2">
            {profile.improvement_suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#A1A1AA]"><Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Snapshots */}
      {snapshots.length > 0 && (
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <h3 className="text-sm font-medium text-[#FAFAFA] mb-2">Profile History ({snapshots.length} snapshots)</h3>
          <p className="text-xs text-[#71717A]">Snapshots are captured each time the profile is rebuilt.</p>
        </div>
      )}
    </div>
  );
}
