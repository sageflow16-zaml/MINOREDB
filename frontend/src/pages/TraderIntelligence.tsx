import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {BrainCircuit, Brain, Target, Activity, Sparkles, Lightbulb, AlertTriangle, CheckCircle, RefreshCw, ChevronRight, Sun, BookOpen, Info} from 'lucide-react';
import { traderIntelligenceService, type TraderProfile, type TradeDebrief, type PersonalPattern, type PersonalRule, type DashboardData } from '../api/traderIntelligence';
import { useTrades } from '../hooks/useTrades';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import { interpretScore } from '../lib/trading-score/index';

import { buildExplanation } from '../lib/trust/explainability';


import {buildContext, detectPatterns} from '../lib/intelligence/index';
import type { IntelligenceContext } from '../lib/intelligence/types';
import { ExplainDialog } from '../components/ui/explain-dialog';
import { ConfidenceBadge } from '../components/ui/confidence-badge';
import { HistoricalTrend } from '../components/ui/historical-trend';
import { FeedbackButtons } from '../components/ui/feedback-buttons';
import { AIQualityPanel } from '../components/ui/quality-panel';
import type { AIExplanation } from '../lib/trust/types';

type HubSection = 'overview' | 'score' | 'dna' | 'learning';

export default function TraderIntelligencePage() {
  const { projectId: rawProjectId } = useParams<{ projectId: string }>();
  const projectId = rawProjectId!;

  const [section, setSection] = useState<HubSection>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [debriefs, setDebriefs] = useState<TradeDebrief[]>([]);
  const [patterns, setPatterns] = useState<PersonalPattern[]>([]);
  const [rules, setRules] = useState<PersonalRule[]>([]);
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const [explainOpen, setExplainOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<AIExplanation | null>(null);
  const [explainMeta, setExplainMeta] = useState({ source: '', targetType: '', targetId: '' });

  const { data: trades } = useTrades(projectId);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [dash, deb, pat, rul, prof] = await Promise.all([
        traderIntelligenceService.dashboard(projectId),
        traderIntelligenceService.listDebriefs(projectId, { limit: 100 }),
        traderIntelligenceService.listPatterns(projectId, { limit: 100 }),
        traderIntelligenceService.listRules(projectId, { limit: 100 }),
        traderIntelligenceService.getProfile(projectId).catch(() => null),
      ]);
      setDashboard(dash); setDebriefs(deb); setPatterns(pat);
      setRules(rul); setProfile(prof);
    } catch { setError('Failed to load intelligence data'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = useCallback(async (action: string) => {
    setGenerating(action);
    try {
      if (action === 'patterns') await traderIntelligenceService.detectPatterns(projectId);
      else if (action === 'rules') await traderIntelligenceService.generateRules(projectId);
      else if (action === 'profile') await traderIntelligenceService.buildProfile(projectId);
      await fetchData();
    } catch {}
    finally { setGenerating(null); }
  }, [projectId, fetchData]);

  const intelligenceContext = useMemo<IntelligenceContext | null>(() => {
    if (!debriefs.length && !patterns.length) return null;
    try {
      return buildContext({
        projectId,
        dashboard,
        debriefs,
        patterns,
        rules,
        profile,
        trades: trades || [],
      });
    } catch {
      return null;
    }
  }, [projectId, dashboard, debriefs, patterns, rules, profile, trades]);

  const scores = intelligenceContext?.scores ?? null;
  const dna = intelligenceContext?.dna ?? null;
  const concepts = intelligenceContext?.concepts ?? [];
  const learningPath = intelligenceContext?.learningPath ?? null;
  const copilot = intelligenceContext?.copilot ?? null;
  const confidence = intelligenceContext?.trust?.confidence ?? null;

  const openExplain = (type: 'score' | 'dna' | 'concept' | 'observation' | 'recommendation' | 'warning', target: string, label: string, data: Record<string, unknown>) => {
    const explanation = buildExplanation({ type, target, targetId: `${target}_${Date.now()}`, label, data });
    setCurrentExplanation(explanation);
    setExplainMeta({
      source: explanation.metadata.source,
      targetType: type,
      targetId: target,
    });
    setExplainOpen(true);
  };

  if (loading) return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-40" />
    </div>
  );

  if (error && !dashboard) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-danger-text" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BrainCircuit className="h-5 w-5 text-primary-text" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Intelligence Hub</h1>
            <p className="text-xs text-muted-foreground">
              {scores ? `${scores.overall}/100 · ${interpretScore(scores.overall).level}` : 'Loading...'}
              {confidence && <span className="ml-2 opacity-60">· Confidence: {confidence.score}% ({confidence.level})</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!profile && (
            <Button size="xs" variant="outline" onClick={() => handleGenerate('profile')} isLoading={generating === 'profile'}>
              <Brain className="h-3 w-3 mr-1" /> Build Profile
            </Button>
          )}
          <Button size="xs" variant="ghost" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Copilot Briefing */}
      {copilot && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-chart-4/20 bg-gradient-to-br from-chart-4/5 to-transparent p-5"
        >
          <div className="flex items-start gap-3 mb-4">
            <Sun className="h-5 w-5 text-chart-4 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {copilot.greeting}, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confidence: {copilot.confidenceLevel}% · {copilot.observations.length} observations
              </p>
            </div>
            <Button size="xs" variant="ghost" className="shrink-0" onClick={() => openExplain('observation', 'copilot-brief', 'Daily Brief', { observation: copilot as any })}>
              <Info className="h-3 w-3 mr-1" /> Explain
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="rounded-lg bg-background/60 p-2.5">
              <p className="text-3xs text-muted-foreground uppercase">Goal</p>
              <p className="text-xs text-foreground mt-0.5">{copilot.todayGoal}</p>
            </div>
            <div className="rounded-lg bg-background/60 p-2.5">
              <p className="text-3xs text-muted-foreground uppercase">Risk Focus</p>
              <p className="text-xs text-foreground mt-0.5">{copilot.todayRisk}</p>
            </div>
            <div className="rounded-lg bg-background/60 p-2.5">
              <p className="text-3xs text-muted-foreground uppercase">Backtest</p>
              <p className="text-xs text-foreground mt-0.5">{copilot.recommendedBacktest}</p>
            </div>
            <div className="rounded-lg bg-background/60 p-2.5">
              <p className="text-3xs text-muted-foreground uppercase">Journal</p>
              <p className="text-xs text-foreground mt-0.5">{copilot.recommendedJournalReview}</p>
            </div>
          </div>

          {copilot.observations.length > 0 && (
            <div className="space-y-1.5">
              {copilot.observations.slice(0, 2).map((obs, i) => (
                <div key={i} className={cn(
                  'flex items-start gap-2 rounded-lg p-2',
                  obs.priority === 'high' ? 'bg-danger/5 border border-danger/10' : 'bg-background/40'
                )}>
                  {obs.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-danger-text mt-0.5 shrink-0" /> :
                   obs.type === 'reminder' ? <BookOpen className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" /> :
                   <Lightbulb className="h-3.5 w-3.5 text-chart-4 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{obs.title}</p>
                    <p className="text-3xs text-muted-foreground">{obs.message}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openExplain(
                        obs.type === 'warning' ? 'warning' : 'observation',
                        obs.title, obs.title, { observation: obs as any, warning: obs as any, patterns, debriefs }
                      )}
                      className="text-3xs text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Explain"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                    <FeedbackButtons
                      source="copilot"
                      targetType={obs.type === 'warning' ? 'warning' : 'observation'}
                      targetId={obs.title}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Section Navigation */}
      <div className="flex gap-1 rounded-lg bg-muted/20 p-0.5 w-fit">
        {[
          { key: 'overview' as const, label: 'Overview', icon: Activity },
          { key: 'score' as const, label: 'Score', icon: Target },
          { key: 'dna' as const, label: 'DNA', icon: Brain },
          { key: 'learning' as const, label: 'Learning', icon: BookOpen },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setSection(tab.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              section === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {section === 'overview' && <OverviewSection scores={scores} dna={dna} concepts={concepts} learningPath={learningPath} patterns={patterns} rules={rules} profile={profile} trades={trades} debriefs={debriefs} onGenerate={handleGenerate} generating={generating} openExplain={openExplain} />}
        {section === 'score' && <ScoreSection scores={scores} debriefs={debriefs} patterns={patterns} rules={rules} trades={trades} openExplain={openExplain} />}
        {section === 'dna' && <DNASection dna={dna} profile={profile} debriefs={debriefs} patterns={patterns} rules={rules} trades={trades} openExplain={openExplain} />}
        {section === 'learning' && <LearningSection concepts={concepts} learningPath={learningPath} openExplain={openExplain} />}
      </AnimatePresence>

      <AIQualityPanel />

      <ExplainDialog
        open={explainOpen}
        onOpenChange={setExplainOpen}
        explanation={currentExplanation}
        source={explainMeta.source}
        targetType={explainMeta.targetType}
        targetId={explainMeta.targetId}
      />
    </div>
  );
}

function OverviewSection({ scores, dna, concepts, learningPath, patterns, rules, profile, debriefs, trades, onGenerate, generating, openExplain }: any) {
  return (
    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Score + DNA row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Score Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium flex items-center gap-2"><Target className="h-4 w-4 text-primary-text" />Trading Score</CardTitle>
              {scores && (
                <Button size="xs" variant="ghost" onClick={() => openExplain('score', 'overall', 'Trading Score', { score: scores.overall, categories: scores.categories, ...scores })}>
                  <Info className="h-3 w-3 mr-1" /> Explain
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {scores ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20">
                    <span className="text-xl font-bold text-foreground">{scores.overall}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{interpretScore(scores.overall).level}</p>
                    <p className="text-3xs text-muted-foreground">{interpretScore(scores.overall).description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {scores.categories.slice(0, 5).map((c: any) => (
                    <div key={c.key} className="rounded-lg bg-background p-2 text-center">
                      <p className="text-xs font-bold" style={{ color: c.score >= 70 ? 'hsl(var(--success))' : c.score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' }}>{c.score}</p>
                      <p className="text-3xs text-muted-foreground truncate">{c.label}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-4">
                <p className="text-xs text-muted-foreground">Upload documents and trade to build your score</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DNA Mini */}
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium flex items-center gap-2"><Brain className="h-4 w-4 text-primary-text" />Trader DNA</CardTitle>
              {dna && (
                <Button size="xs" variant="ghost" onClick={() => openExplain('dna', 'trader-dna', 'Trader DNA', { ...dna, patterns, debriefs, profile, rules, trades })}>
                  <Info className="h-3 w-3 mr-1" /> Explain
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {dna ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-3xs">
                  <div><span className="text-muted-foreground">Session</span><p className="text-foreground font-medium">{dna.preferredSession}</p></div>
                  <div><span className="text-muted-foreground">Best Day</span><p className="text-foreground font-medium">{dna.bestDay}</p></div>
                  <div><span className="text-muted-foreground">Top Mistake</span><p className="text-foreground font-medium truncate">{dna.mostFrequentMistake}</p></div>
                  <div><span className="text-muted-foreground">Holding</span><p className="text-foreground font-medium">{dna.averageHoldingMinutes}m</p></div>
                </div>
                {dna.insights?.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-3xs text-chart-4 mb-1">Key Insight</p>
                    <p className="text-3xs text-muted-foreground">{dna.insights[0].title}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <p className="text-xs text-muted-foreground">No DNA data yet</p>
                <Button size="xs" variant="outline" className="mt-2" onClick={() => onGenerate('profile')} isLoading={generating === 'profile'}>
                  <Brain className="h-3 w-3 mr-1" /> Build Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Path + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Goal */}
        <Card>
          <CardHeader className="py-3 px-4"><CardTitle className="text-xs font-medium flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary-text" />Today's Goal</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            {learningPath?.todayGoal ? (
              <div className="space-y-2">
                <div className="rounded-lg bg-chart-4/5 border border-chart-4/10 p-2.5">
                  <p className="text-xs font-medium text-foreground">{learningPath.todayGoal.task}</p>
                  <p className="text-3xs text-muted-foreground mt-0.5">{learningPath.todayGoal.reason}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={learningPath.todayGoal.priority === 'high' ? 'warning' : 'secondary'} size="sm">{learningPath.todayGoal.priority}</Badge>
                    <span className="text-3xs text-muted-foreground">{learningPath.todayGoal.estimatedMinutes} min</span>
                  </div>
                </div>
                {learningPath.weeklyPlan?.length > 0 && (
                  <div>
                    <p className="text-3xs text-muted-foreground uppercase tracking-wider mb-1">Weekly Plan</p>
                    {learningPath.weeklyPlan.map((g: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-3xs text-foreground truncate">{g.task}</p>
                        </div>
                        <span className="text-3xs text-muted-foreground shrink-0">{g.estimatedMinutes}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Start trading and documenting to get personalized goals</p>
            )}
          </CardContent>
        </Card>

        {/* Concept Mastery (top) */}
        <Card>
          <CardHeader className="py-3 px-4"><CardTitle className="text-xs font-medium flex items-center gap-2"><Brain className="h-4 w-4 text-primary-text" />Concept Mastery</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            {concepts.length > 0 ? (
              <div className="space-y-1.5">
                {concepts.slice(0, 6).map((c: any) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-3xs text-foreground truncate">{c.name}</span>
                        <span className={cn(
                          'text-3xs font-medium shrink-0 ml-1',
                          c.understanding >= 70 ? 'text-success' : c.understanding >= 40 ? 'text-warning' : 'text-danger-text'
                        )}>{c.understanding}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                        <div className={cn(
                          'h-full rounded-full transition-all',
                          c.understanding >= 70 ? 'bg-success' : c.understanding >= 40 ? 'bg-warning' : 'bg-danger'
                        )} style={{ width: `${c.understanding}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No concepts tracked yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="py-3 px-4"><CardTitle className="text-xs font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-primary-text" />Activity</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            <div className="flex justify-between py-1"><span className="text-3xs text-muted-foreground">Debriefs</span><span className="text-xs text-foreground font-medium">{debriefs?.length || 0}</span></div>
            <div className="flex justify-between py-1"><span className="text-3xs text-muted-foreground">Patterns</span><span className="text-xs text-foreground font-medium">{patterns?.length || 0}</span></div>
            <div className="flex justify-between py-1"><span className="text-3xs text-muted-foreground">Rules</span><span className="text-xs text-foreground font-medium">{rules?.length || 0}</span></div>
            <div className="flex justify-between py-1"><span className="text-3xs text-muted-foreground">Profile</span><span className="text-xs text-foreground font-medium">{profile ? 'Built' : 'Not built'}</span></div>
            <div className="flex justify-between py-1"><span className="text-3xs text-muted-foreground">Trades</span><span className="text-xs text-foreground font-medium">{trades?.length || 0}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern/Rule Generation */}
      {(!patterns.length || !rules.length) && (
        <div className="flex gap-2 justify-center">
          {!patterns.length && (
            <Button size="sm" variant="outline" onClick={() => onGenerate('patterns')} isLoading={generating === 'patterns'}>
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Detect Patterns
            </Button>
          )}
          {!rules.length && (
            <Button size="sm" variant="outline" onClick={() => onGenerate('rules')} isLoading={generating === 'rules'}>
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Generate Rules
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ScoreSection({ scores, debriefs, patterns, rules, trades, openExplain }: any) {
  if (!scores) return <div className="text-center py-12"><p className="text-sm text-muted-foreground">Not enough data to compute scores</p></div>;
  const { level, description } = interpretScore(scores.overall);
  return (
    <motion.div key="score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Overall Score */}
      <div className="flex items-center gap-6 p-5 rounded-xl border border-border bg-surface">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4" style={{ borderColor: scores.overall >= 70 ? 'hsl(var(--success))' : scores.overall >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' }}>
          <span className="text-2xl font-bold text-foreground">{scores.overall}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-foreground">{level}</p>
            <ConfidenceBadge score={scores.overall} />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-3xs text-muted mt-1">Last updated: {new Date(scores.lastUpdated).toLocaleString()}</p>
        </div>
        <Button size="xs" variant="outline" onClick={() => openExplain('score', 'overall', 'Trading Score', { score: scores.overall, categories: scores.categories, factors: scores.categories.flatMap((c: any) => c.factors), ...scores })}>
          <Info className="h-3 w-3 mr-1" /> Explain Score
        </Button>
      </div>

      {/* Trend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-3xs text-muted-foreground uppercase mb-2">Trend (7d)</p>
            <HistoricalTrend metric="score_overall" period="7d" value={scores.overall} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-3xs text-muted-foreground uppercase mb-2">Trend (30d)</p>
            <HistoricalTrend metric="score_overall" period="30d" value={scores.overall} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-3xs text-muted-foreground uppercase mb-2">Trend (90d)</p>
            <HistoricalTrend metric="score_overall" period="90d" value={scores.overall} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-3xs text-muted-foreground uppercase mb-2">Trend (All)</p>
            <HistoricalTrend metric="score_overall" period="all" value={scores.overall} />
          </CardContent>
        </Card>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scores.categories.map((c: any) => (
          <Card key={c.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{c.label}</span>
                  <ConfidenceBadge score={c.score} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-bold', c.score >= 70 ? 'text-success' : c.score >= 40 ? 'text-warning' : 'text-danger-text')}>{c.score}</span>
                  <Button size="xs" variant="ghost" onClick={() => openExplain('score', c.key, c.label, { score: c.score, factors: c.factors, categories: scores.categories, debriefs, patterns, rules, trades })}>
                    <Info className="h-3 w-3" /> Explain
                  </Button>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden mb-2">
                <div className={cn('h-full rounded-full transition-all', c.score >= 70 ? 'bg-success' : c.score >= 40 ? 'bg-warning' : 'bg-danger')} style={{ width: `${c.score}%` }} />
              </div>
              {c.factors?.map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-3xs text-muted-foreground py-0.5">
                  <span>{f.label}</span>
                  <span className={f.impact === 'positive' ? 'text-success' : f.impact === 'negative' ? 'text-danger-text' : ''}>{f.value}/{f.max}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border/50">
                <HistoricalTrend metric={`score_${c.key}`} period="30d" value={c.score} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

function DNASection({ dna, profile, debriefs, patterns, rules, trades, openExplain }: any) {
  if (!dna) return <div className="text-center py-12"><p className="text-sm text-muted-foreground">Insufficient data for DNA analysis</p></div>;
  return (
    <motion.div key="dna" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Profile Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Preferred Session', value: dna.preferredSession, key: 'preferredSession' },
          { label: 'Best Concept', value: dna.highestWinRateConcept, key: 'highestWinRateConcept' },
          { label: 'Weakest Concept', value: dna.weakestConcept, key: 'weakestConcept' },
          { label: 'Top Mistake', value: dna.mostFrequentMistake, key: 'mostFrequentMistake' },
          { label: 'Common Emotion', value: dna.mostCommonEmotion, key: 'mostCommonEmotion' },
          { label: 'Best Day', value: dna.bestDay, key: 'bestDay' },
          { label: 'Worst Day', value: dna.worstDay, key: 'worstDay' },
          { label: 'Best Asset', value: dna.bestAsset, key: 'bestAsset' },
          { label: 'Worst Asset', value: dna.worstAsset, key: 'worstAsset' },
          { label: 'Best R:R', value: dna.bestRR.toFixed(2), key: 'bestRR' },
          { label: 'Avg Hold Time', value: `${dna.averageHoldingMinutes}m`, key: 'averageHoldingMinutes' },
          { label: 'Research', value: `${dna.researchConsistency}%`, key: 'researchConsistency' },
        ].map((item) => (
          <Card key={item.key}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-3xs text-muted-foreground uppercase">{item.label}</p>
                <button
                  type="button"
                  onClick={() => openExplain('dna', item.key, item.label, { ...dna, patterns, debriefs, profile, rules, trades, label: item.value })}
                  className="text-3xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Explain"
                >
                  <Info className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs font-medium text-foreground mt-0.5 truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {dna.insights?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-3">AI Insights</p>
          <div className="space-y-2">
            {dna.insights.map((insight: any, i: number) => (
              <div key={i} className={cn(
                'rounded-lg border p-3',
                insight.type === 'strength' ? 'border-success/20 bg-success/5' :
                insight.type === 'weakness' ? 'border-danger/20 bg-danger/5' :
                insight.type === 'behavior' ? 'border-chart-4/20 bg-chart-4/5' :
                'border-border/50 bg-background/50'
              )}>
                <div className="flex items-start gap-1.5 mb-1">
                  {insight.type === 'strength' ? <CheckCircle className="h-3.5 w-3.5 text-success mt-0.5" /> :
                   insight.type === 'weakness' ? <AlertTriangle className="h-3.5 w-3.5 text-danger-text mt-0.5" /> :
                   <Lightbulb className="h-3.5 w-3.5 text-chart-4 mt-0.5" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{insight.title}</span>
                      {insight.confidence && <ConfidenceBadge score={insight.confidence} />}
                    </div>
                    <p className="text-3xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openExplain('dna', insight.title, insight.title, { ...dna, insight, patterns, debriefs, profile, rules, trades })}
                      className="text-3xs text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Explain"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                    <FeedbackButtons
                      source="dna"
                      targetType={insight.type}
                      targetId={insight.title}
                    />
                  </div>
                </div>
                {insight.evidence?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {insight.evidence.map((e: string, j: number) => (
                      <Badge key={j} variant="outline" size="sm" className="text-3xs">{e}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function LearningSection({ concepts, learningPath, openExplain }: any) {
  return (
    <motion.div key="learning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Today's Goal */}
      {learningPath?.todayGoal && (
        <Card className="border-chart-4/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-4/10">
                <Target className="h-4 w-4 text-chart-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground">{learningPath.todayGoal.task}</p>
                  <button
                    type="button"
                    onClick={() => openExplain('recommendation', learningPath.todayGoal.task, learningPath.todayGoal.task, { recommendation: learningPath.todayGoal as any, concepts })}
                    className="text-3xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Explain"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-3xs text-muted-foreground mt-0.5">{learningPath.todayGoal.reason}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={learningPath.todayGoal.priority === 'high' ? 'warning' : 'secondary'} size="sm">{learningPath.todayGoal.priority}</Badge>
                  <span className="text-3xs text-muted-foreground">{learningPath.todayGoal.estimatedMinutes} minutes</span>
                </div>
              </div>
              <FeedbackButtons
                source="adaptive-learning"
                targetType="recommendation"
                targetId={learningPath.todayGoal.task}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Plan */}
      {learningPath?.weeklyPlan?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Weekly Study Plan</p>
          <div className="space-y-2">
            {learningPath.weeklyPlan.map((goal: any, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/30 text-3xs font-medium text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-foreground truncate">{goal.task}</p>
                    <button
                      type="button"
                      onClick={() => openExplain('recommendation', goal.task, goal.task, { recommendation: goal as any, concepts })}
                      className="text-3xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Explain"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-3xs text-muted-foreground">{goal.reason}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={goal.priority === 'high' ? 'warning' : 'secondary'} size="sm">{goal.priority}</Badge>
                  <span className="text-3xs text-muted-foreground">{goal.estimatedMinutes}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concept Mastery Full */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Concept Mastery</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {concepts.length > 0 ? concepts.map((c: any) => (
            <Card key={c.name}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground truncate">{c.name}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant={c.aiConfidence === 'high' ? 'success' : c.aiConfidence === 'low' ? 'warning' : 'secondary'} size="sm">{c.aiConfidence}</Badge>
                    <button
                      type="button"
                      onClick={() => openExplain('concept', c.name, c.name, { ...c, concept: c, concepts })}
                      className="text-3xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Explain"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden mb-1.5">
                  <div className={cn('h-full rounded-full', c.understanding >= 70 ? 'bg-success' : c.understanding >= 40 ? 'bg-warning' : 'bg-danger')} style={{ width: `${c.understanding}%` }} />
                </div>
                <div className="flex items-center justify-between text-3xs text-muted-foreground">
                  <span>{c.understanding}%</span>
                  <span>{c.applications} apps · {c.mistakes} mistakes</span>
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">No concepts tracked yet. Upload documents and trade to build concept mastery.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
