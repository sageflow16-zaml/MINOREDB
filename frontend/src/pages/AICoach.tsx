import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { useCoachingSessions, useGenerateCoaching } from '../hooks/useAIFoundation';
import {
  BookOpen, Calendar, TrendingUp, Target, AlertTriangle,
  CheckCircle, RefreshCw, ChevronDown,
} from 'lucide-react';
import type { CoachingSession } from '../api/types';

type SessionType = 'daily' | 'weekly' | 'monthly' | 'psychology' | 'risk' | 'strategy' | 'execution';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const sessionTypes: { value: SessionType; label: string; icon: React.ElementType }[] = [
  { value: 'daily', label: 'Daily', icon: Calendar },
  { value: 'weekly', label: 'Weekly', icon: Calendar },
  { value: 'monthly', label: 'Monthly', icon: Calendar },
  { value: 'psychology', label: 'Psychology', icon: BookOpen },
  { value: 'risk', label: 'Risk', icon: Target },
  { value: 'strategy', label: 'Strategy', icon: TrendingUp },
  { value: 'execution', label: 'Execution', icon: CheckCircle },
];

const typeColor = (t: string) => {
  switch (t) {
    case 'psychology': return 'info';
    case 'risk': return 'warning';
    case 'strategy': return 'success';
    case 'execution': return 'secondary';
    default: return 'info';
  }
};

export default function AICoachPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedType, setSelectedType] = useState<SessionType>('daily');
  const [filterType, setFilterType] = useState<SessionType | ''>('');

  const coaching = useCoachingSessions(projectId!, filterType || undefined);
  const generateCoaching = useGenerateCoaching(projectId!);

  const sessions = coaching.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="AI Coach"
          description="Structured coaching sessions to improve your trading"
          actions={
            <div className="flex gap-2 items-center">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as SessionType)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              >
                {sessionTypes.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
              <Button size="sm" onClick={() => generateCoaching.mutate({ sessionType: selectedType })} disabled={generateCoaching.isPending}>
                <RefreshCw className={`h-4 w-4 mr-1 ${generateCoaching.isPending ? 'animate-spin' : ''}`} />
                Generate {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Coaching
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* Filter */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filterType === '' ? 'default' : 'outline'} onClick={() => setFilterType('')}>
          All
        </Button>
        {sessionTypes.map((st) => {
          const Icon = st.icon;
          return (
            <Button key={st.value} size="sm" variant={filterType === st.value ? 'default' : 'outline'} onClick={() => setFilterType(st.value)}>
              <Icon className="h-3.5 w-3.5 mr-1" />{st.label}
            </Button>
          );
        })}
      </motion.div>

      {/* Sessions */}
      {coaching.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : coaching.error ? (
        <ErrorState message="Failed to load coaching sessions" description={coaching.error?.message || 'An unexpected error occurred'} onRetry={() => coaching.refetch()} />
      ) : sessions.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {sessions.map((session: CoachingSession) => (
            <motion.div key={session.id} variants={item}>
              <Card>
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      (session.score ?? 0) >= 70 ? 'bg-success/10' : (session.score ?? 0) >= 50 ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      <BookOpen className={`h-5 w-5 ${
                        (session.score ?? 0) >= 70 ? 'text-success' : (session.score ?? 0) >= 50 ? 'text-warning' : 'text-destructive'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold capitalize">{session.session_type} Coaching</h3>
                        <Badge variant={typeColor(session.session_type) as 'info'}>{session.session_type}</Badge>
                        {session.score != null && (
                          <Badge variant={(session.score ?? 0) >= 70 ? 'success' : (session.score ?? 0) >= 50 ? 'warning' : 'destructive'}>
                            {session.score.toFixed(0)}/100
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.session_date}
                        {session.period_start && session.period_end && ` · ${session.period_start} to ${session.period_end}`}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  {session.summary && (
                    <p className="text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-muted/20">{session.summary}</p>
                  )}

                  {/* Metrics Snapshot */}
                  {session.metrics_snapshot && (
                    <div className="grid grid-cols-3 gap-3 mb-4 md:grid-cols-6">
                      {Object.entries(session.metrics_snapshot).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <p className="text-lg font-semibold text-foreground">{typeof val === 'number' ? val.toFixed(key.includes('pnl') ? 2 : 1) : String(val)}</p>
                          <p className="text-3xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {session.strengths && session.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Strengths
                        </p>
                        <ul className="space-y-1.5">
                          {session.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {session.weaknesses && session.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-warning mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Weaknesses
                        </p>
                        <ul className="space-y-1.5">
                          {session.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-warning shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Key Findings */}
                  {session.key_findings && session.key_findings.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold mb-2">Key Findings</p>
                      <div className="space-y-2">
                        {session.key_findings.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Badge variant={f.impact === 'positive' ? 'success' : f.impact === 'negative' ? 'destructive' : 'secondary'} className="shrink-0 text-3xs">
                              {f.category}
                            </Badge>
                            <span className="text-muted-foreground">{f.finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {session.action_items && session.action_items.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold mb-2">Action Items</p>
                      <div className="space-y-2">
                        {session.action_items.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/20">
                            <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${a.completed ? 'text-success' : 'text-muted-foreground'}`} />
                            <span className={a.completed ? 'line-through text-muted-foreground' : ''}>{a.action}</span>
                            <Badge variant={a.priority === 'high' ? 'warning' : 'secondary'} className="ml-auto text-3xs">{a.priority}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState message="No coaching sessions yet. Select a type and click Generate to create one." />
      )}
    </motion.div>
  );
}
