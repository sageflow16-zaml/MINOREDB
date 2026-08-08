import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { KpiCard } from '../components/ui/KpiCard';
import {
  useAIDashboard, useGenerateInsights, useGenerateRecommendations,
  useDetectPatterns, useAnalyzeProfile, useDismissInsight,
  useDismissRecommendation,
} from '../hooks/useAIFoundation';
import {
  Sparkles, Brain, Target, Shield, TrendingUp, AlertTriangle,
  RefreshCw, ChevronRight, CheckCircle, XCircle, Lightbulb,
  BarChart3, Activity, BookOpen,
} from 'lucide-react';
import type { AIInsight, AIRecommendation, DetectedPattern, CoachingSession } from '../api/types';

type TabType = 'overview' | 'insights' | 'patterns' | 'coaching' | 'recommendations';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'patterns', label: 'Patterns', icon: Activity },
  { id: 'coaching', label: 'Coaching', icon: BookOpen },
  { id: 'recommendations', label: 'Actions', icon: Target },
];

export default function AIDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const dashboard = useAIDashboard(projectId!);
  const generateInsights = useGenerateInsights(projectId!);
  const generateRecs = useGenerateRecommendations(projectId!);
  const detectPatterns = useDetectPatterns(projectId!);
  const analyzeProfile = useAnalyzeProfile(projectId!);
  const dismissInsight = useDismissInsight(projectId!);
  const dismissRec = useDismissRecommendation(projectId!);

  const data = dashboard.data;

  if (dashboard.isLoading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>;

  if (dashboard.error) {
    return <ErrorState message="Failed to load AI dashboard" description={dashboard.error?.message || 'An unexpected error occurred'} onRetry={() => dashboard.refetch()} />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="AI Coach"
          description="Intelligent trading insights, patterns, and personalized coaching"
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => analyzeProfile.mutate()} disabled={analyzeProfile.isPending}>
                <Brain className="h-4 w-4 mr-1" />Analyze Profile
              </Button>
              <Button size="sm" variant="outline" onClick={() => detectPatterns.mutate()} disabled={detectPatterns.isPending}>
                <Activity className="h-4 w-4 mr-1" />Detect Patterns
              </Button>
              <Button size="sm" variant="outline" onClick={() => generateInsights.mutate()} disabled={generateInsights.isPending}>
                <Lightbulb className="h-4 w-4 mr-1" />Generate Insights
              </Button>
              <Button size="sm" onClick={() => generateRecs.mutate()} disabled={generateRecs.isPending}>
                <Target className="h-4 w-4 mr-1" />Get Recommendations
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 rounded-xl bg-muted/30 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && data && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Overall Score */}
          <motion.div variants={item}>
            <div className="flex items-center gap-6 rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <span className="text-2xl font-bold text-primary-text">{data.overall_score?.toFixed(0) ?? '—'}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Trader Score</h3>
                <p className="text-sm text-muted-foreground">
                  Based on {data.profile?.total_trades_analyzed ?? 0} trades analyzed
                  {data.profile?.trading_style ? ` · ${data.profile.trading_style} trader` : ''}
                </p>
              </div>
              {data.profile?.risk_profile && (
                <Badge variant={data.profile.risk_profile === 'conservative' ? 'info' : data.profile.risk_profile === 'aggressive' ? 'destructive' : 'secondary'} className="ml-auto">
                  {data.profile.risk_profile}
                </Badge>
              )}
            </div>
          </motion.div>

          {/* KPIs */}
          <motion.div variants={item} className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard title="Insights" value={(data.latest_insights ?? []).length} icon={Lightbulb} />
            <KpiCard title="Patterns" value={(data.detected_patterns ?? []).length} icon={Activity} />
            <KpiCard title="Recommendations" value={(data.recommendations ?? []).length} icon={Target} />
            <KpiCard title="Coaching Sessions" value={(data.coaching_cards ?? []).length} icon={BookOpen} />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Latest Insights */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4" />Latest Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(data.latest_insights ?? []).length > 0 ? (
                    <div className="space-y-3">
                      {(data.latest_insights ?? []).slice(0, 4).map((ins: AIInsight) => (
                        <div key={ins.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            ins.category === 'positive' ? 'bg-success' : ins.category === 'warning' ? 'bg-warning' : 'bg-destructive'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{ins.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ins.description}</p>
                          </div>
                          <Badge variant={ins.category === 'positive' ? 'success' : ins.category === 'warning' ? 'warning' : 'destructive'} className="shrink-0 text-3xs">
                            {(ins.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Generate insights to get started" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommendations */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4" />Top Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(data.recommendations ?? []).length > 0 ? (
                    <div className="space-y-3">
                      {(data.recommendations ?? []).slice(0, 4).map((rec: AIRecommendation) => (
                        <div key={rec.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                          <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'warning' : 'secondary'} className="shrink-0 mt-0.5">
                            {rec.priority}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{rec.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Generate recommendations to get started" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Improvements & Areas */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />Recent Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(data.recent_improvements ?? []).length > 0 ? (
                    <ul className="space-y-2">
                      {(data.recent_improvements ?? []).map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No improvements detected yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-warning" />Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(data.areas_to_improve ?? []).length > 0 ? (
                    <ul className="space-y-2">
                      {(data.areas_to_improve ?? []).map((area, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-warning shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No areas flagged for improvement</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Profile Summary */}
          {data.profile && (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4" />Trader Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                    <div><span className="text-muted-foreground">Style:</span> <span className="font-medium">{data.profile.trading_style || '—'}</span></div>
                    <div><span className="text-muted-foreground">Sessions:</span> <span className="font-medium">{data.profile.preferred_sessions?.join(', ') || '—'}</span></div>
                    <div><span className="text-muted-foreground">Avg R:R:</span> <span className="font-medium">{data.profile.avg_rr ?? '—'}</span></div>
                    <div><span className="text-muted-foreground">Risk Profile:</span> <span className="font-medium">{data.profile.risk_profile || '—'}</span></div>
                    <div><span className="text-muted-foreground">Win Rate:</span> <span className="font-medium">{data.profile.learning_progress?.level || '—'}</span></div>
                    <div><span className="text-muted-foreground">Trades Analyzed:</span> <span className="font-medium">{data.profile.total_trades_analyzed}</span></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {data?.latest_insights && data.latest_insights.length > 0 ? (
            data.latest_insights.map((ins: AIInsight) => (
              <motion.div key={ins.id} variants={item}>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ins.category === 'positive' ? 'bg-success/10' : ins.category === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      <Lightbulb className={`h-5 w-5 ${
                        ins.category === 'positive' ? 'text-success' : ins.category === 'warning' ? 'text-warning' : 'text-destructive'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{ins.title}</h4>
                        <Badge variant="outline" className="text-3xs">{ins.insight_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{ins.description}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => dismissInsight.mutate(ins.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <EmptyState message="No insights yet. Click 'Generate Insights' to analyze your trading patterns." />
          )}
        </motion.div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {data?.detected_patterns && data.detected_patterns.length > 0 ? (
            data.detected_patterns.map((pat: DetectedPattern) => (
              <motion.div key={pat.id} variants={item}>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      pat.is_positive ? 'bg-success/10' : 'bg-destructive/10'
                    }`}>
                      <Activity className={`h-5 w-5 ${pat.is_positive ? 'text-success' : 'text-destructive'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold capitalize">{pat.pattern_type} Pattern</h4>
                        <Badge variant={pat.is_positive ? 'success' : 'destructive'} className="text-3xs">
                          {pat.pattern_key}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pat.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Win Rate: <span className="font-medium text-foreground">{pat.win_rate?.toFixed(1)}%</span></span>
                        <span>Avg P&L: <span className="font-medium text-foreground">${pat.avg_pnl?.toFixed(2)}</span></span>
                        <span>Sample: <span className="font-medium text-foreground">{pat.sample_size}</span></span>
                        <span>Confidence: <span className="font-medium text-foreground">{(pat.confidence * 100).toFixed(0)}%</span></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <EmptyState message="No patterns detected yet. Click 'Detect Patterns' to scan your history." />
          )}
        </motion.div>
      )}

      {/* Coaching Tab */}
      {activeTab === 'coaching' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {data?.coaching_cards && data.coaching_cards.length > 0 ? (
            data.coaching_cards.map((session: CoachingSession) => (
              <motion.div key={session.id} variants={item}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="info" className="capitalize">{session.session_type}</Badge>
                      <span className="text-sm font-medium">{session.session_date}</span>
                      {session.score != null && (
                        <Badge variant={session.score >= 70 ? 'success' : session.score >= 50 ? 'warning' : 'destructive'}>
                          Score: {session.score.toFixed(0)}
                        </Badge>
                      )}
                    </div>
                    {session.summary && <p className="text-sm text-muted-foreground mb-3">{session.summary}</p>}
                    {session.strengths && session.strengths.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-success mb-1">Strengths</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {session.strengths.map((s, i) => <li key={i} className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-success" />{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {session.weaknesses && session.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-warning mb-1">Weaknesses</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {session.weaknesses.map((w, i) => <li key={i} className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" />{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <EmptyState message="No coaching sessions yet. Generate a coaching session to get feedback." />
          )}
        </motion.div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {data?.recommendations && data.recommendations.length > 0 ? (
            data.recommendations.map((rec: AIRecommendation) => (
              <motion.div key={rec.id} variants={item}>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      rec.priority === 'critical' ? 'bg-destructive/10' : rec.priority === 'high' ? 'bg-warning/10' : 'bg-primary/10'
                    }`}>
                      <Target className={`h-5 w-5 ${
                        rec.priority === 'critical' ? 'text-destructive' : rec.priority === 'high' ? 'text-warning' : 'text-primary-text'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{rec.title}</h4>
                        <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'warning' : 'secondary'} className="text-3xs">
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline" className="text-3xs">{rec.recommendation_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      {rec.rationale && <p className="text-xs text-muted-foreground/70 mt-1 italic">{rec.rationale}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => dismissRec.mutate(rec.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <EmptyState message="No recommendations yet. Click 'Get Recommendations' to generate action items." />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
