import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { Input } from '../components/ui/input';
import {
  useBrainDashboard, useBrainAsk, useBrainInsights, useGenerateBrainInsights,
  useDismissBrainInsight, useDetectObservations, useDismissObservation,
  useLatestCoaching, useGenerateCoaching, useDNA, useRefreshDNA,
} from '../hooks/useBrain';
import {
  Brain, MessageSquare, Sparkles, TrendingUp, Target, Shield,
  AlertTriangle, CheckCircle, XCircle, Lightbulb, BookOpen,
  Activity, RefreshCw, ChevronRight, BarChart3, User, Clock,
  Award, Zap, Heart, TrendingDown,
} from 'lucide-react';
import type { BrainDecision, PersonalInsight, LearningObservation, BrainCoaching } from '../api/types';

type TabType = 'overview' | 'ask' | 'insights' | 'observe' | 'coaching' | 'timeline' | 'dna';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'ask', label: 'Ask Brain', icon: MessageSquare },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'observe', label: 'Observations', icon: Activity },
  { id: 'coaching', label: 'Coaching', icon: BookOpen },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'dna', label: 'Trading DNA', icon: User },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function BrainDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [askQuestion, setAskQuestion] = useState('');
  const [askResult, setAskResult] = useState<BrainDecision | null>(null);

  const dashboard = useBrainDashboard(projectId!);
  const dna = useDNA(projectId!);
  const insights = useBrainInsights(projectId!);
  const coaching = useLatestCoaching(projectId!);
  const generateInsightsMut = useGenerateBrainInsights(projectId!);
  const dismissInsightMut = useDismissBrainInsight(projectId!);
  const detectObsMut = useDetectObservations(projectId!);
  const dismissObsMut = useDismissObservation(projectId!);
  const generateCoachMut = useGenerateCoaching(projectId!);
  const refreshDNAMut = useRefreshDNA(projectId!);
  const askBrain = useBrainAsk(projectId!);

  const data = dashboard.data;

  const handleAsk = async () => {
    if (!askQuestion.trim()) return;
    const result = askBrain.mutateAsync({ question: askQuestion }).then((r: import('../api/types').BrainAskResponse) => {
      setAskResult({
        id: r.decision_id,
        project_id: projectId!,
        question: r.question,
        verdict: r.verdict,
        confidence_score: r.confidence_score,
        recommendation: r.recommendation,
        reasoning: r.reasoning,
        scores: r.scores,
        reasoning_steps: r.reasoning_steps,
        evidence_sources: r.evidence_sources,
        context_snapshot: null,
        actual_outcome: null,
        user_feedback: null,
        learning_result: null,
        created_at: new Date().toISOString(),
      });
    });
    setAskQuestion('');
  };

  if (dashboard.isLoading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>;
  if (dashboard.isError) return <ErrorState message="Failed to load Brain Dashboard" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="AI Trading Brain"
          description="Central intelligence system with evidence-based reasoning"
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refreshDNAMut.mutate()} disabled={refreshDNAMut.isPending}>
                <RefreshCw className="h-4 w-4 mr-1" />Refresh DNA
              </Button>
              <Button size="sm" variant="outline" onClick={() => detectObsMut.mutate()} disabled={detectObsMut.isPending}>
                <Activity className="h-4 w-4 mr-1" />Scan Observations
              </Button>
              <Button size="sm" onClick={() => generateCoachMut.mutate({ coaching_type: 'daily' })} disabled={generateCoachMut.isPending}>
                <BookOpen className="h-4 w-4 mr-1" />Daily Coach
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 rounded-xl bg-muted/30 p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* ═══════════════════════ OVERVIEW ═══════════════════════ */}
      {activeTab === 'overview' && data && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Today's Intelligence */}
          {data.today_intelligence && (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />Today's Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {data.today_intelligence.style && (
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Style</p>
                        <p className="text-sm font-semibold capitalize">{data.today_intelligence.style}</p>
                      </div>
                    )}
                    {data.today_intelligence.best_session && (
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Best Session</p>
                        <p className="text-sm font-semibold">{data.today_intelligence.best_session}</p>
                      </div>
                    )}
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Discipline</p>
                      <p className="text-sm font-semibold">{data.today_intelligence.overall_score?.toFixed(0) ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Psychology</p>
                      <p className="text-sm font-semibold">{data.today_intelligence.psychology_score?.toFixed(0) ?? '—'}</p>
                    </div>
                  </div>
                  {data.today_intelligence.insights && data.today_intelligence.insights.length > 0 && (
                    <div className="space-y-2">
                      {data.today_intelligence.insights.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Brain className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                          {ins}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* KPIs */}
          <motion.div variants={item} className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard title="Decisions" value={data.recent_decisions.length} icon={Brain} />
            <KpiCard title="Insights" value={data.top_insights.length} icon={Lightbulb} />
            <KpiCard title="Observations" value={data.active_observations.length} icon={Activity} />
            <KpiCard title="Memories" value={data.memory_summary?.active ?? 0} icon={BookOpen} />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Insights */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4" />Personal Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.top_insights.length > 0 ? (
                    <div className="space-y-3">
                      {data.top_insights.slice(0, 5).map((ins) => (
                        <div key={ins.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            ins.impact === 'positive' ? 'bg-success' : ins.impact === 'warning' ? 'bg-warning' : 'bg-destructive'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{ins.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ins.description}</p>
                          </div>
                          <Badge variant={ins.impact === 'positive' ? 'success' : ins.impact === 'warning' ? 'warning' : 'destructive'} className="shrink-0 text-3xs">
                            {ins.confidence ? `${(ins.confidence * 100).toFixed(0)}%` : '—'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Generate insights to learn about your trading patterns" />
                  )}
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => generateInsightsMut.mutate()} disabled={generateInsightsMut.isPending}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />Generate Insights
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Decisions */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4" />Recent Decisions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recent_decisions.length > 0 ? (
                    <div className="space-y-3">
                      {data.recent_decisions.slice(0, 5).map((dec) => (
                        <div key={dec.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                          <Badge variant={dec.confidence_score && dec.confidence_score >= 65 ? 'success' : dec.confidence_score && dec.confidence_score >= 40 ? 'warning' : 'destructive'} className="shrink-0 mt-0.5">
                            {dec.confidence_score?.toFixed(0) ?? '?'}%
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{dec.question}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Verdict: <span className="font-medium">{dec.verdict ?? 'pending'}</span>
                              {dec.created_at && ` · ${new Date(dec.created_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Ask the Brain a question to get started" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Latest Coaching */}
            {data.latest_coaching && (
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4" />Coaching Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="info" className="capitalize">{data.latest_coaching.coaching_type}</Badge>
                      {data.latest_coaching.score != null && (
                        <Badge variant={data.latest_coaching.score >= 70 ? 'success' : data.latest_coaching.score >= 50 ? 'warning' : 'destructive'}>
                          Score: {data.latest_coaching.score.toFixed(0)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{data.latest_coaching.summary}</p>
                    {data.latest_coaching.strengths && data.latest_coaching.strengths.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-success mb-1">Strengths</p>
                        {data.latest_coaching.strengths.map((s, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle className="h-3 w-3 text-success" />{s}</div>
                        ))}
                      </div>
                    )}
                    {data.latest_coaching.weaknesses && data.latest_coaching.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-warning mb-1">Weaknesses</p>
                        {data.latest_coaching.weaknesses.map((w, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground"><AlertTriangle className="h-3 w-3 text-warning" />{w}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Active Observations */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4" />Learning Observations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.active_observations.length > 0 ? (
                    <div className="space-y-3">
                      {data.active_observations.slice(0, 4).map((obs) => (
                        <div key={obs.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            obs.severity === 'positive' ? 'bg-success' : obs.severity === 'warning' ? 'bg-warning' : obs.severity === 'high' ? 'bg-destructive' : 'bg-muted'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{obs.title}</p>
                            {obs.description && <p className="text-xs text-muted-foreground mt-0.5">{obs.description}</p>}
                          </div>
                          {obs.is_actionable && <Badge variant="warning" className="shrink-0 text-3xs">Action</Badge>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Scan for observations to detect patterns" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════ ASK BRAIN ═══════════════════════ */}
      {activeTab === 'ask' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex gap-3">
            <Input
              placeholder="Ask the Brain anything... (e.g., Should I buy EURUSD?)"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              className="flex-1"
            />
            <Button onClick={handleAsk} disabled={askBrain.isPending || !askQuestion.trim()}>
              {askBrain.isPending ? <LoadingSpinner /> : <MessageSquare className="h-4 w-4 mr-1" />}
              Ask Brain
            </Button>
          </motion.div>

          {askResult && (
            <motion.div variants={item} className="space-y-4">
              {/* Verdict */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Question</p>
                      <p className="text-lg font-semibold">{askResult.question}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className={`text-2xl font-bold ${
                        askResult.confidence_score && askResult.confidence_score >= 65 ? 'text-success' :
                        askResult.confidence_score && askResult.confidence_score >= 40 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {askResult.confidence_score?.toFixed(0) ?? '—'}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={
                      askResult.verdict === 'strong_buy' || askResult.verdict === 'buy' ? 'success' :
                      askResult.verdict === 'strong_sell' || askResult.verdict === 'sell' ? 'destructive' :
                      'warning'
                    } className="text-sm px-3 py-1">
                      {askResult.verdict?.replace('_', ' ').toUpperCase() ?? 'PENDING'}
                    </Badge>
                    {askResult.recommendation && (
                      <span className="text-sm text-muted-foreground">{askResult.recommendation}</span>
                    )}
                  </div>
                  {askResult.reasoning && (
                    <div className="rounded-lg bg-muted/30 p-4">
                      <p className="text-sm font-medium mb-2">Reasoning</p>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{askResult.reasoning}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scores */}
              {askResult.scores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(askResult.scores).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/30 p-3 text-center">
                          <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className={`text-lg font-bold ${
                            value >= 65 ? 'text-success' : value >= 40 ? 'text-warning' : 'text-destructive'
                          }`}>{value.toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reasoning Steps */}
              {askResult.reasoning_steps && askResult.reasoning_steps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Reasoning Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {askResult.reasoning_steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                          <div className={`h-2 w-2 rounded-full ${
                            step.status === 'completed' ? 'bg-success' : step.status === 'error' ? 'bg-destructive' : 'bg-muted'
                          }`} />
                          <span className="text-sm font-medium capitalize flex-1">{step.step.replace(/_/g, ' ')}</span>
                          <Badge variant={
                            step.status === 'completed' ? 'success' : step.status === 'error' ? 'destructive' : 'secondary'
                          } className="text-3xs">{step.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evidence */}
              {askResult.evidence_sources && askResult.evidence_sources.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Evidence Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(askResult.evidence_sources as { source: string }[]).map((src, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                          <span className="font-medium capitalize">{src.source?.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {askBrain.isPending && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
              <span className="ml-3 text-sm text-muted-foreground">Brain is thinking...</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════ INSIGHTS ═══════════════════════ */}
      {activeTab === 'insights' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={item} className="flex gap-2">
            <Button size="sm" onClick={() => generateInsightsMut.mutate()} disabled={generateInsightsMut.isPending}>
              <Sparkles className="h-4 w-4 mr-1" />Generate Insights
            </Button>
          </motion.div>
          {insights.data && insights.data.length > 0 ? (
            insights.data.map((ins: PersonalInsight) => (
              <motion.div key={ins.id} variants={item}>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ins.impact === 'positive' ? 'bg-success/10' : ins.impact === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      <Lightbulb className={`h-5 w-5 ${
                        ins.impact === 'positive' ? 'text-success' : ins.impact === 'warning' ? 'text-warning' : 'text-destructive'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{ins.title}</h4>
                        <Badge variant="outline" className="text-3xs">{ins.category}</Badge>
                      </div>
                      {ins.description && <p className="text-xs text-muted-foreground mt-1">{ins.description}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => dismissInsightMut.mutate(ins.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <EmptyState message="No insights yet. Generate insights to discover your trading patterns." />
          )}
        </motion.div>
      )}

      {/* ═══════════════════════ OBSERVATIONS ═══════════════════════ */}
      {activeTab === 'observe' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={item} className="flex gap-2">
            <Button size="sm" onClick={() => detectObsMut.mutate()} disabled={detectObsMut.isPending}>
              <Activity className="h-4 w-4 mr-1" />Scan for Observations
            </Button>
          </motion.div>
          {data?.active_observations && data.active_observations.length > 0 ? (
            data.active_observations.map((obs: LearningObservation) => (
              <motion.div key={obs.id} variants={item}>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      obs.severity === 'positive' ? 'bg-success/10' : obs.severity === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      <Activity className={`h-5 w-5 ${
                        obs.severity === 'positive' ? 'text-success' : obs.severity === 'warning' ? 'text-warning' : 'text-destructive'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{obs.title}</h4>
                        <Badge variant={
                          obs.severity === 'positive' ? 'success' : obs.severity === 'warning' ? 'warning' : 'destructive'
                        } className="text-3xs">{obs.category}</Badge>
                        {obs.is_actionable && <Badge variant="warning" className="text-3xs">Actionable</Badge>}
                      </div>
                      {obs.description && <p className="text-xs text-muted-foreground mt-1">{obs.description}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => dismissObsMut.mutate(obs.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <EmptyState message="No observations detected. Scan your trading history to find patterns." />
          )}
        </motion.div>
      )}

      {/* ═══════════════════════ COACHING ═══════════════════════ */}
      {activeTab === 'coaching' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={item} className="flex gap-2 flex-wrap">
            {(['daily', 'weekly', 'monthly', 'execution', 'psychology', 'risk'] as const).map((type) => (
              <Button key={type} size="sm" variant="outline" onClick={() => generateCoachMut.mutate({ coaching_type: type })} disabled={generateCoachMut.isPending}>
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </motion.div>

          {coaching.data && (
            <motion.div variants={item}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="info" className="capitalize">{coaching.data.coaching_type}</Badge>
                    <span className="text-sm font-medium">{coaching.data.title}</span>
                    {coaching.data.score != null && (
                      <Badge variant={coaching.data.score >= 70 ? 'success' : coaching.data.score >= 50 ? 'warning' : 'destructive'}>
                        Score: {coaching.data.score.toFixed(0)}
                      </Badge>
                    )}
                  </div>
                  {coaching.data.summary && <p className="text-sm text-muted-foreground mb-4">{coaching.data.summary}</p>}

                  <div className="grid gap-4 md:grid-cols-2">
                    {coaching.data.strengths && coaching.data.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-success mb-2">Strengths</p>
                        <div className="space-y-1">
                          {coaching.data.strengths.map((s, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-success shrink-0" />{s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {coaching.data.weaknesses && coaching.data.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-warning mb-2">Weaknesses</p>
                        <div className="space-y-1">
                          {coaching.data.weaknesses.map((w, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <AlertTriangle className="h-3 w-3 text-warning shrink-0" />{w}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {coaching.data.action_items && coaching.data.action_items.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-primary mb-2">Action Items</p>
                      <div className="space-y-1">
                        {coaching.data.action_items.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Target className="h-3 w-3 text-primary shrink-0" />
                            <span>{a.action}</span>
                            <Badge variant={a.priority === 'high' ? 'destructive' : a.priority === 'medium' ? 'warning' : 'secondary'} className="text-3xs">{a.priority}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          {!coaching.data && <EmptyState message="Generate a coaching session to get personalized feedback." />}
        </motion.div>
      )}

      {/* ═══════════════════════ TIMELINE ═══════════════════════ */}
      {activeTab === 'timeline' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {data?.recent_decisions && data.recent_decisions.length > 0 ? (
            data.recent_decisions.map((dec: BrainDecision) => (
              <motion.div key={dec.id} variants={item}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        dec.confidence_score && dec.confidence_score >= 65 ? 'bg-success/10' : dec.confidence_score && dec.confidence_score >= 40 ? 'bg-warning/10' : 'bg-destructive/10'
                      }`}>
                        <Brain className={`h-5 w-5 ${
                          dec.confidence_score && dec.confidence_score >= 65 ? 'text-success' : dec.confidence_score && dec.confidence_score >= 40 ? 'text-warning' : 'text-destructive'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">{dec.question}</h4>
                          <Badge variant={
                            dec.verdict === 'strong_buy' || dec.verdict === 'buy' ? 'success' :
                            dec.verdict === 'sell' || dec.verdict === 'strong_sell' ? 'destructive' : 'warning'
                          } className="text-3xs">{dec.verdict}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Confidence: <strong>{dec.confidence_score?.toFixed(0) ?? '—'}%</strong></span>
                          {dec.actual_outcome && <span>Outcome: <strong>{dec.actual_outcome}</strong></span>}
                          {dec.created_at && <span>{new Date(dec.created_at).toLocaleString()}</span>}
                        </div>
                        {dec.reasoning && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{dec.reasoning}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <EmptyState message="No decisions yet. Ask the Brain a question to start building your timeline." />
          )}
        </motion.div>
      )}

      {/* ═══════════════════════ DNA ═══════════════════════ */}
      {activeTab === 'dna' && dna.data && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />Trading DNA Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Style</p>
                    <p className="text-sm font-semibold capitalize">{dna.data.trading_style || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Best Session</p>
                    <p className="text-sm font-semibold capitalize">{dna.data.preferred_session || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Avg R:R</p>
                    <p className="text-sm font-semibold">{dna.data.preferred_rr?.toFixed(2) ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Risk Profile</p>
                    <p className="text-sm font-semibold capitalize">{dna.data.risk_behavior || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Discipline</p>
                    <p className="text-sm font-semibold">{dna.data.discipline_score?.toFixed(0) ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Psychology</p>
                    <p className="text-sm font-semibold">{dna.data.psychology_score?.toFixed(0) ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Patience</p>
                    <p className="text-sm font-semibold">{dna.data.patience_index?.toFixed(0) ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Trades Analyzed</p>
                    <p className="text-sm font-semibold">{dna.data.total_trades_analyzed}</p>
                  </div>
                </div>

                {/* Best Models */}
                {dna.data.best_models && dna.data.best_models.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-success mb-2">Best Models</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {dna.data.best_models.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-border/50 p-2 text-xs">
                          <Award className="h-3.5 w-3.5 text-success shrink-0" />
                          <span className="font-medium">{m.name}</span>
                          <span className="text-muted-foreground">{m.win_rate}% WR</span>
                          <span className="text-muted-foreground">${m.total_pnl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DNA Summary */}
                {dna.data.dna_summary && (
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm font-medium mb-2">Summary</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Win Rate</p>
                        <p className="font-semibold">{dna.data.dna_summary.win_rate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Discipline Level</p>
                        <p className="font-semibold capitalize">{dna.data.dna_summary.discipline_level}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Psychology Level</p>
                        <p className="font-semibold capitalize">{dna.data.dna_summary.psychology_level}</p>
                      </div>
                      {dna.data.dna_summary.strengths.length > 0 && (
                        <div>
                          <p className="text-muted-foreground">Strengths</p>
                          {dna.data.dna_summary.strengths.map((s, i) => (
                            <p key={i} className="font-semibold text-success text-3xs">+ {s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Raw Insights */}
          {dna.data.raw_insights && dna.data.raw_insights.length > 0 && (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4" />Personal Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dna.data.raw_insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        {ins}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Improvement Timeline */}
          {dna.data.improvement_timeline && dna.data.improvement_timeline.length > 0 && (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />Improvement Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dna.data.improvement_timeline.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">{entry.month}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-success transition-all"
                            style={{ width: `${Math.min(100, entry.improvements * 20)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{entry.improvements}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
