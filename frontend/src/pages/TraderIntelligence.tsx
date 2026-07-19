import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit, FileText, Activity, Scale, User,
  Loader2, AlertCircle, Plus, RefreshCw, CheckCircle, XCircle,
  ThumbsUp, ThumbsDown, Search, TrendingUp, TrendingDown,
  BarChart3, BookOpen, Target, AlertTriangle, Lightbulb,
} from 'lucide-react';
import { traderIntelligenceService } from '../api/traderIntelligence';
import type {
  TradeDebrief, PersonalPattern, PersonalRule, TraderProfile, DashboardData,
} from '../api/traderIntelligence';

type TabType = 'dashboard' | 'debriefs' | 'patterns' | 'rules' | 'profile';

export default function TraderIntelligence() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tab, setTab] = useState<TabType>('dashboard');
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
    setLoading(true);
    setError(null);
    try {
      const [dash, d, p, r, prof, snaps] = await Promise.all([
        traderIntelligenceService.dashboard(projectId),
        traderIntelligenceService.listDebriefs(projectId, { limit: 50 }),
        traderIntelligenceService.listPatterns(projectId, { limit: 50 }),
        traderIntelligenceService.listRules(projectId, { limit: 50 }),
        traderIntelligenceService.getProfile(projectId).catch(() => null),
        traderIntelligenceService.getSnapshots(projectId).catch(() => []),
      ]);
      setDashboard(dash);
      setDebriefs(d);
      setPatterns(p);
      setRules(r);
      setProfile(prof);
      setSnapshots(snaps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async (action: string) => {
    if (!projectId) return;
    setGenerating(action);
    try {
      if (action === 'patterns') {
        const detected = await traderIntelligenceService.detectPatterns(projectId);
        setPatterns(detected);
      } else if (action === 'rules') {
        const result = await traderIntelligenceService.generateRules(projectId);
        setRules(result.rules);
      } else if (action === 'profile') {
        const built = await traderIntelligenceService.buildProfile(projectId);
        setProfile(built);
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleApproveRule = async (ruleId: string) => {
    if (!projectId) return;
    try {
      const updated = await traderIntelligenceService.approveRule(projectId, ruleId);
      setRules(prev => prev.map(r => r.id === ruleId ? updated : r));
    } catch { /* ignore */ }
  };

  const handleRejectRule = async (ruleId: string) => {
    if (!projectId) return;
    try {
      const updated = await traderIntelligenceService.rejectRule(projectId, ruleId, 'Rejected by user');
      setRules(prev => prev.map(r => r.id === ruleId ? updated : r));
    } catch { /* ignore */ }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BrainCircuit className="h-4 w-4" /> },
    { key: 'debriefs', label: 'Debriefs', icon: <FileText className="h-4 w-4" /> },
    { key: 'patterns', label: 'Patterns', icon: <Activity className="h-4 w-4" /> },
    { key: 'rules', label: 'Rules', icon: <Scale className="h-4 w-4" /> },
    { key: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  ];

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-brand-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Trader Intelligence</h1>
            <p className="text-sm text-slate-400">Personal Trading Intelligence Engine</p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-ghost p-2" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
          <button onClick={fetchData} className="text-red-300 hover:text-red-200 underline text-xs">Retry</button>
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-700">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-brand-500 text-brand-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {tab === 'dashboard' && <DashboardTab dashboard={dashboard} />}
        {tab === 'debriefs' && (
          <DebriefsTab
            debriefs={debriefs}
            selected={selectedDebrief}
            onSelect={setSelectedDebrief}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onGenerate={() => handleGenerate('debrief')}
            generating={generating === 'debrief'}
            projectId={projectId!}
            onRefresh={fetchData}
          />
        )}
        {tab === 'patterns' && (
          <PatternsTab
            patterns={patterns}
            onDetect={() => handleGenerate('patterns')}
            generating={generating === 'patterns'}
          />
        )}
        {tab === 'rules' && (
          <RulesTab
            rules={rules}
            selected={selectedRule}
            onSelect={setSelectedRule}
            onGenerate={() => handleGenerate('rules')}
            onApprove={handleApproveRule}
            onReject={handleRejectRule}
            generating={generating === 'rules'}
          />
        )}
        {tab === 'profile' && (
          <ProfileTab profile={profile} snapshots={snapshots} onBuild={() => handleGenerate('profile')} generating={generating === 'profile'} />
        )}
      </motion.div>
    </div>
  );
}

function DashboardTab({ dashboard }: { dashboard: DashboardData | null }) {
  if (!dashboard) return null;
  const stats = [
    { label: 'Debriefs', value: dashboard.debrief_count, icon: <FileText className="h-5 w-5" />, color: 'text-blue-400' },
    { label: 'Patterns', value: dashboard.pattern_count, icon: <Activity className="h-5 w-5" />, color: 'text-green-400' },
    { label: 'Rules', value: dashboard.rule_count, icon: <Scale className="h-5 w-5" />, color: 'text-purple-400' },
    { label: 'Approved Rules', value: dashboard.approved_rule_count, icon: <CheckCircle className="h-5 w-5" />, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{s.label}</span>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {dashboard.profile && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Profile Snapshot</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-400">Discipline Score</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-brand-500 transition-all"
                    style={{ width: `${dashboard.profile.discipline_score ?? 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white">{dashboard.profile.discipline_score?.toFixed(0) ?? 'N/A'}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Rule Adherence</p>
              <p className="text-lg font-medium text-white">
                {dashboard.profile.rule_adherence ? `${(dashboard.profile.rule_adherence as Record<string, unknown>).adherence_rate ?? 0}%` : 'N/A'}
              </p>
            </div>
          </div>
          {dashboard.profile.improvement_suggestions && dashboard.profile.improvement_suggestions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-400">Suggestions</p>
              <ul className="space-y-1">
                {dashboard.profile.improvement_suggestions.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {dashboard.recent_debriefs.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Recent Debriefs</h3>
          <div className="space-y-3">
            {dashboard.recent_debriefs.map(d => (
              <div key={d.id} className="rounded-lg bg-slate-700/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{d.summary?.slice(0, 80) ?? 'Debrief'}</span>
                  {d.overall_rating && (
                    <span className={`text-sm font-bold ${d.overall_rating >= 7 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {d.overall_rating}/10
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DebriefsTab({
  debriefs, selected, onSelect, searchQuery, onSearch, onGenerate, generating, projectId, onRefresh,
}: {
  debriefs: TradeDebrief[];
  selected: TradeDebrief | null;
  onSelect: (d: TradeDebrief | null) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  onGenerate: () => void;
  generating: boolean;
  projectId: string;
  onRefresh: () => void;
}) {
  const filtered = searchQuery
    ? debriefs.filter(d => d.summary?.toLowerCase().includes(searchQuery.toLowerCase()))
    : debriefs;

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => onSelect(null)} className="text-sm text-brand-400 hover:text-brand-300">&larr; Back to debriefs</button>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Debrief Detail</h3>
            {selected.overall_rating && (
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${selected.overall_rating >= 7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {selected.overall_rating}/10
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Entry Review', value: selected.entry_review },
              { label: 'Execution Review', value: selected.execution_review },
              { label: 'Exit Review', value: selected.exit_review },
              { label: 'Psychology Review', value: selected.psychology_review },
            ].map(s => s.value ? (
              <div key={s.label} className="rounded-lg bg-slate-700/50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-400">{s.label}</p>
                <p className="text-sm text-white">{s.value}</p>
              </div>
            ) : null)}
          </div>
          {selected.summary && (
            <div className="mt-4 rounded-lg bg-slate-700/50 p-3">
              <p className="mb-1 text-xs font-medium text-slate-400">Summary</p>
              <p className="text-sm text-white">{selected.summary}</p>
            </div>
          )}
          {selected.lessons_learned && selected.lessons_learned.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-400">Lessons Learned</p>
              <ul className="space-y-1">
                {selected.lessons_learned.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-400" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search debriefs..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500"
          />
        </div>
        <button onClick={onGenerate} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Generate
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <FileText className="mb-2 h-12 w-12" />
          <p>No debriefs found. Generate one from a completed trade.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(d => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-left transition-colors hover:border-slate-600"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{new Date(d.created_at).toLocaleDateString()}</span>
                {d.overall_rating && (
                  <span className={`text-xs font-bold ${d.overall_rating >= 7 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {d.overall_rating}/10
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-white">{d.summary ?? 'No summary'}</p>
              {d.strengths && d.strengths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.strengths.slice(0, 2).map((s, i) => (
                    <span key={i} className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">{s}</span>
                  ))}
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
        <p className="text-sm text-slate-400">{patterns.length} patterns detected</p>
        <button onClick={onDetect} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          Detect Patterns
        </button>
      </div>

      {patterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Activity className="mb-2 h-12 w-12" />
          <p>No patterns detected. Click "Detect Patterns" to analyze trades.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.map(p => (
            <div key={p.id} className={`rounded-lg border p-4 ${p.active ? 'border-slate-700 bg-slate-800/50' : 'border-slate-700/50 bg-slate-800/30 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">{p.name}</h4>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  p.category === 'session' ? 'bg-blue-500/10 text-blue-400' :
                  p.category === 'pair' ? 'bg-purple-500/10 text-purple-400' :
                  p.category === 'direction' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-slate-500/10 text-slate-400'
                }`}>{p.category}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{p.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-slate-700/50 p-2">
                  <p className="text-slate-400">Trades</p>
                  <p className="font-medium text-white">{p.occurrence_count}</p>
                </div>
                <div className="rounded bg-slate-700/50 p-2">
                  <p className="text-green-400">Wins</p>
                  <p className="font-medium text-white">{p.win_count}</p>
                </div>
                <div className="rounded bg-slate-700/50 p-2">
                  <p className="text-red-400">Losses</p>
                  <p className="font-medium text-white">{p.loss_count}</p>
                </div>
              </div>
              {p.confidence !== null && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Confidence</span>
                    <span>{p.confidence.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-700">
                    <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${p.confidence}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RulesTab({
  rules, selected, onSelect, onGenerate, onApprove, onReject, generating,
}: {
  rules: PersonalRule[];
  selected: PersonalRule | null;
  onSelect: (r: PersonalRule | null) => void;
  onGenerate: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  generating: boolean;
}) {
  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => onSelect(null)} className="text-sm text-brand-400 hover:text-brand-300">&larr; Back to rules</button>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{selected.title}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              selected.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              selected.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>{selected.status}</span>
          </div>
          {selected.description && <p className="mb-4 text-sm text-slate-300">{selected.description}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400">Category</p>
              <p className="text-sm font-medium text-white">{selected.category}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400">Version</p>
              <p className="text-sm font-medium text-white">{selected.version}</p>
            </div>
          </div>
          {selected.supporting_stats && (
            <div className="mt-4 rounded-lg bg-slate-700/50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-400">Supporting Stats</p>
              <pre className="text-xs text-slate-300">{JSON.stringify(selected.supporting_stats, null, 2)}</pre>
            </div>
          )}
          {selected.status === 'draft' && (
            <div className="mt-4 flex gap-3">
              <button onClick={() => onApprove(selected.id)} className="btn-primary flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => onReject(selected.id)} className="btn-danger flex items-center gap-2">
                <ThumbsDown className="h-4 w-4" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {rules.filter(r => r.status === 'draft').length} draft, {rules.filter(r => r.status === 'approved').length} approved
        </p>
        <button onClick={onGenerate} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
          Generate Rules
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Scale className="mb-2 h-12 w-12" />
          <p>No rules yet. Generate rules from patterns and debriefs.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rules.map(r => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-left transition-colors hover:border-slate-600"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{r.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                    r.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>{r.status}</span>
                </div>
                {r.description && <p className="mt-1 line-clamp-1 text-sm text-slate-400">{r.description}</p>}
              </div>
              <div className="ml-4 flex items-center gap-2">
                <span className="text-xs text-slate-500">v{r.version}</span>
                {r.status === 'draft' && (
                  <>
                    <button onClick={e => { e.stopPropagation(); onApprove(r.id); }} className="rounded p-1 text-green-400 hover:bg-green-500/10">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onReject(r.id); }} className="rounded p-1 text-red-400 hover:bg-red-500/10">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ profile, snapshots, onBuild, generating }: { profile: TraderProfile | null; snapshots: unknown[]; onBuild: () => void; generating: boolean }) {
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <User className="mb-2 h-12 w-12" />
        <p className="mb-4">No profile built yet.</p>
        <button onClick={onBuild} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
          Build Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Trader Profile</h3>
        <button onClick={onBuild} disabled={generating} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          Rebuild
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Trades Analyzed</p>
          <p className="text-2xl font-bold text-white">{profile.total_trades_analyzed}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Active Patterns</p>
          <p className="text-2xl font-bold text-white">{profile.active_patterns}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Approved Rules</p>
          <p className="text-2xl font-bold text-white">{profile.approved_rules}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h4 className="mb-4 font-medium text-white">Discipline Score</h4>
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 rounded-full bg-slate-700">
            <div
              className={`h-3 rounded-full transition-all ${
                (profile.discipline_score ?? 0) >= 70 ? 'bg-green-500' :
                (profile.discipline_score ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${profile.discipline_score ?? 0}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-white">{profile.discipline_score?.toFixed(0)}</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {profile.strengths && profile.strengths.length > 0 && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <h4 className="font-medium text-green-400">Strengths</h4>
            </div>
            <ul className="space-y-1">
              {profile.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.weaknesses && profile.weaknesses.length > 0 && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <h4 className="font-medium text-red-400">Areas to Improve</h4>
            </div>
            <ul className="space-y-1">
              {profile.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {profile.improvement_suggestions && profile.improvement_suggestions.length > 0 && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            <h4 className="font-medium text-yellow-400">Improvement Suggestions</h4>
          </div>
          <ul className="space-y-2">
            {profile.improvement_suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h4 className="mb-4 font-medium text-white">Profile History ({snapshots.length} snapshots)</h4>
          <p className="text-sm text-slate-400">Snapshots are captured each time the profile is rebuilt.</p>
        </div>
      )}
    </div>
  );
}
