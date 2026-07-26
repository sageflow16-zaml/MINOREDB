import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, FileText, Activity, Scale, User,
  Loader2, AlertCircle, Plus, RefreshCw, CheckCircle, XCircle,
  ThumbsUp, ThumbsDown, Search, TrendingUp, TrendingDown,
  BarChart3, BookOpen, Target, AlertTriangle, Lightbulb,
} from 'lucide-react';
import { traderIntelligenceService } from '../api/traderIntelligence';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import type {
  TradeDebrief, PersonalPattern, PersonalRule, TraderProfile, DashboardData,
} from '../api/traderIntelligence';
import { cn } from '../lib/utils';

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
      setDashboard(dash); setDebriefs(d); setPatterns(p); setRules(r); setProfile(prof); setSnapshots(snaps);
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

  if (loading && !dashboard) return <LoadingSpinner />;
  if (error && !dashboard) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trader Intelligence"
        description="Personal Trading Intelligence Engine"
      >
        <Button variant="ghost" size="icon-sm" onClick={fetchData}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </PageHeader>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 border-transparent',
              tab === t.key
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
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
    { label: 'Debriefs', value: dashboard.debrief_count, icon: <FileText className="h-5 w-5" />, color: 'text-chart-1' },
    { label: 'Patterns', value: dashboard.pattern_count, icon: <Activity className="h-5 w-5" />, color: 'text-chart-2' },
    { label: 'Rules', value: dashboard.rule_count, icon: <Scale className="h-5 w-5" />, color: 'text-chart-3' },
    { label: 'Approved Rules', value: dashboard.approved_rule_count, icon: <CheckCircle className="h-5 w-5" />, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={s.color}>{s.icon}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {dashboard.profile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Profile Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Discipline Score</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${dashboard.profile.discipline_score ?? 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{dashboard.profile.discipline_score?.toFixed(0) ?? 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rule Adherence</p>
                <p className="text-lg font-medium text-foreground">
                  {dashboard.profile.rule_adherence ? `${(dashboard.profile.rule_adherence as Record<string, unknown>).adherence_rate ?? 0}%` : 'N/A'}
                </p>
              </div>
            </div>
            {dashboard.profile.improvement_suggestions && dashboard.profile.improvement_suggestions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Suggestions</p>
                <ul className="space-y-1">
                  {dashboard.profile.improvement_suggestions.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {dashboard.recent_debriefs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Debriefs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recent_debriefs.map(d => (
              <div key={d.id} className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{d.summary?.slice(0, 80) ?? 'Debrief'}</span>
                  {d.overall_rating && (
                    <span className={cn('text-xs font-bold', d.overall_rating >= 7 ? 'text-success' : 'text-warning')}>
                      {d.overall_rating}/10
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DebriefsTab({ debriefs, selected, onSelect, searchQuery, onSearch, onGenerate, generating }: {
  debriefs: TradeDebrief[]; selected: TradeDebrief | null;
  onSelect: (d: TradeDebrief | null) => void;
  searchQuery: string; onSearch: (q: string) => void; onGenerate: () => void; generating: boolean;
}) {
  const filtered = searchQuery
    ? debriefs.filter(d => d.summary?.toLowerCase().includes(searchQuery.toLowerCase()))
    : debriefs;

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)} className="text-xs">
          &larr; Back to debriefs
        </Button>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Debrief Detail</CardTitle>
              {selected.overall_rating && (
                <Badge variant={selected.overall_rating >= 7 ? 'success' : 'warning'}>{selected.overall_rating}/10</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Entry Review', value: selected.entry_review },
                { label: 'Execution Review', value: selected.execution_review },
                { label: 'Exit Review', value: selected.exit_review },
                { label: 'Psychology Review', value: selected.psychology_review },
              ].map(s => s.value ? (
                <div key={s.label} className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-xs text-foreground">{s.value}</p>
                </div>
              ) : null)}
            </div>
            {selected.summary && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Summary</p>
                <p className="text-xs text-foreground">{selected.summary}</p>
              </div>
            )}
            {selected.lessons_learned && (Array.isArray(selected.lessons_learned) ? selected.lessons_learned.length > 0 : selected.lessons_learned.length > 0) && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Lessons Learned</p>
                <ul className="space-y-1">
                  {(Array.isArray(selected.lessons_learned) ? selected.lessons_learned : [selected.lessons_learned]).map((l: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search debriefs..."
            className="pl-10"
          />
        </div>
        <Button onClick={onGenerate} disabled={generating} isLoading={generating} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Generate
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No debriefs found" description="Generate one from a completed trade." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(d => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                {d.overall_rating && (
                  <span className={cn('text-xs font-bold', d.overall_rating >= 7 ? 'text-success' : 'text-warning')}>
                    {d.overall_rating}/10
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-foreground">{d.summary ?? 'No summary'}</p>
              {d.strengths && d.strengths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.strengths.slice(0, 2).map((s, i) => (
                    <span key={i} className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">{s}</span>
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
        <p className="text-xs text-muted-foreground">{patterns.length} patterns detected</p>
        <Button onClick={onDetect} disabled={generating} isLoading={generating} size="sm">
          <Activity className="mr-1.5 h-4 w-4" /> Detect Patterns
        </Button>
      </div>

      {patterns.length === 0 ? (
        <EmptyState message="No patterns detected" description='Click "Detect Patterns" to analyze trades.' />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.map(p => (
            <Card key={p.id} className={cn(!p.active && 'opacity-60')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{p.name}</CardTitle>
                  <Badge variant={
                    p.category === 'session' ? 'info' :
                    p.category === 'pair' ? 'default' :
                    p.category === 'direction' ? 'warning' : 'secondary'
                  } size="sm">{p.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Trades</p>
                    <p className="font-medium text-foreground">{p.occurrence_count}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-success">Wins</p>
                    <p className="font-medium text-foreground">{p.win_count}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-destructive">Losses</p>
                    <p className="font-medium text-foreground">{p.loss_count}</p>
                  </div>
                </div>
                  {p.confidence != null && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence</span>
                      <span>{p.confidence?.toFixed(0) ?? 'N/A'}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.confidence ?? 0}%` }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)} className="text-xs">
          &larr; Back to rules
        </Button>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{selected.title}</CardTitle>
              <Badge variant={selected.status === 'approved' ? 'success' : selected.status === 'rejected' ? 'destructive' : 'warning'} size="sm">
                {selected.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected.description && <p className="text-xs text-muted-foreground">{selected.description}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-xs font-medium text-foreground">{selected.category}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="text-xs font-medium text-foreground">{selected.version}</p>
              </div>
            </div>
            {selected.supporting_stats && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Supporting Stats</p>
                <pre className="text-xs text-foreground/70">{JSON.stringify(selected.supporting_stats, null, 2)}</pre>
              </div>
            )}
            {selected.status === 'draft' && (
              <div className="flex gap-3 pt-2">
                <Button size="sm" onClick={() => onApprove(selected.id)}>
                  <ThumbsUp className="mr-1.5 h-4 w-4" /> Approve
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onReject(selected.id)}>
                  <ThumbsDown className="mr-1.5 h-4 w-4" /> Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {rules.filter(r => r.status === 'draft').length} draft, {rules.filter(r => r.status === 'approved').length} approved
        </p>
        <Button onClick={onGenerate} disabled={generating} isLoading={generating} size="sm">
          <Scale className="mr-1.5 h-4 w-4" /> Generate Rules
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState message="No rules yet" description="Generate rules from patterns and debriefs." />
      ) : (
        <div className="grid gap-3">
          {rules.map(r => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{r.title}</span>
                  <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'warning'} size="sm">
                    {r.status}
                  </Badge>
                </div>
                {r.description && <p className="mt-1 truncate text-xs text-muted-foreground">{r.description}</p>}
              </div>
              <div className="ml-4 flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">v{r.version}</span>
                {r.status === 'draft' && (
                  <>
                    <button onClick={e => { e.stopPropagation(); onApprove(r.id); }} className="rounded p-1 text-success hover:bg-success/10">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onReject(r.id); }} className="rounded p-1 text-destructive hover:bg-destructive/10">
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

function ProfileTab({ profile, snapshots, onBuild, generating }: {
  profile: TraderProfile | null; snapshots: unknown[]; onBuild: () => void; generating: boolean;
}) {
  if (!profile) {
    return (
      <EmptyState
        message="No profile built yet"
        action={<Button onClick={onBuild} isLoading={generating}><BrainCircuit className="mr-1.5 h-4 w-4" /> Build Profile</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Trader Profile</h3>
        <Button variant="ghost" size="sm" onClick={onBuild} isLoading={generating}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Rebuild
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Trades Analyzed</p>
            <p className="text-2xl font-bold text-foreground">{profile.total_trades_analyzed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Active Patterns</p>
            <p className="text-2xl font-bold text-foreground">{profile.active_patterns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Approved Rules</p>
            <p className="text-2xl font-bold text-foreground">{profile.approved_rules}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Discipline Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-3 flex-1 rounded-full bg-muted">
              <div
                className={cn('h-3 rounded-full transition-all',
                  (profile.discipline_score ?? 0) >= 70 ? 'bg-success' :
                  (profile.discipline_score ?? 0) >= 40 ? 'bg-warning' : 'bg-destructive',
                )}
                style={{ width: `${profile.discipline_score ?? 0}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-foreground">{profile.discipline_score?.toFixed(0)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        {profile.strengths && profile.strengths.length > 0 && (
          <Card className="border-success/20">
            <CardContent className="py-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <h4 className="text-xs font-semibold text-success">Strengths</h4>
              </div>
              <ul className="space-y-1">
                {profile.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {profile.weaknesses && profile.weaknesses.length > 0 && (
          <Card className="border-destructive/20">
            <CardContent className="py-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <h4 className="text-xs font-semibold text-destructive">Areas to Improve</h4>
              </div>
              <ul className="space-y-1">
                {profile.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {profile.improvement_suggestions && profile.improvement_suggestions.length > 0 && (
        <Card className="border-warning/20">
          <CardContent className="py-4">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              <h4 className="text-xs font-semibold text-warning">Improvement Suggestions</h4>
            </div>
            <ul className="space-y-2">
              {profile.improvement_suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {snapshots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Profile History ({snapshots.length} snapshots)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Snapshots are captured each time the profile is rebuilt.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
