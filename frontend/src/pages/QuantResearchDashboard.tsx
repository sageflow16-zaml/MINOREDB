import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { DataTable } from '../components/ui/DataTable';
import { cn } from '../lib/utils';
import { useQuantDashboard, useExperiments, useCurrentEdgeHealth, useEdgeHealthSnapshots } from '../hooks/useQuantResearch';
import { useBacktests } from '../hooks/useQuantResearch';
import {
  FlaskConical, Beaker, CheckCircle2, XCircle, Activity,
  TrendingUp, BarChart3, Brain, AlertTriangle, Clock,
  PlayCircle, FileText, GitBranch, ArrowRight,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  running: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

const hypothesisStatusColors: Record<string, string> = {
  supported: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  inconclusive: 'bg-warning/10 text-warning',
  proposed: 'bg-muted text-muted-foreground',
  testing: 'bg-primary/10 text-primary',
};

export default function QuantResearchDashboard() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuantDashboard(projectId!);
  const { data: experiments = [] } = useExperiments(projectId!);
  const { data: backtests = [] } = useBacktests(projectId!);
  const { data: edgeHealth } = useCurrentEdgeHealth(projectId!);
  const { data: snapshots = [] } = useEdgeHealthSnapshots(projectId!);

  if (dashLoading) return <LoadingSpinner />;
  if (dashError) return <ErrorState message="Failed to load research dashboard" />;
  if (!dashboard) return <EmptyState title="No research data" message="Create your first experiment" />;

  const recentBacktests = backtests.slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Quantitative Research Lab"
        description="Scientific experimentation platform for discovering, validating, and monitoring trading edges"
        actions={
          <Link to={`/projects/${projectId}/quant-research/experiments`}>
            <Button><Beaker className="w-4 h-4 mr-2" />New Experiment</Button>
          </Link>
        }
      />

      {/* KPI Row */}
      <motion.div variants={itemAnim} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard title="Experiments" value={dashboard.total_experiments} icon={FlaskConical} trend={dashboard.active_experiments > 0 ? { value: dashboard.active_experiments, positive: true } : undefined} />
        <KpiCard title="Active" value={dashboard.active_experiments} icon={PlayCircle} variant="info" />
        <KpiCard title="Completed" value={dashboard.completed_experiments} icon={CheckCircle2} variant="success" />
        <KpiCard title="Edge Health" value={dashboard.overall_confidence > 0 ? `${(dashboard.overall_confidence * 100).toFixed(0)}%` : 'N/A'} icon={Activity} variant={dashboard.overall_confidence > 0.6 ? 'success' : dashboard.overall_confidence > 0.3 ? 'warning' : 'danger'} />
        <KpiCard title="Progress" value={`${dashboard.research_progress}%`} icon={TrendingUp} variant="info" />
        <KpiCard title="Queue" value={dashboard.experiment_queue_count} icon={Clock} variant={dashboard.experiment_queue_count > 0 ? 'warning' : 'default'} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hypothesis Status */}
        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader>
              <CardTitle><Brain className="w-4 h-4 mr-2 inline" />Hypothesis Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg border border-success/10">
                  <span className="text-sm font-medium">Supported</span>
                  <Badge variant="success">{dashboard.supported_hypotheses}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                  <span className="text-sm font-medium">Rejected</span>
                  <Badge variant="destructive">{dashboard.rejected_hypotheses}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total</span>
                  <Badge variant="outline">{dashboard.supported_hypotheses + dashboard.rejected_hypotheses}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edge Health */}
        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader>
              <CardTitle><Activity className="w-4 h-4 mr-2 inline" />Edge Health</CardTitle>
            </CardHeader>
            <CardContent>
              {edgeHealth ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className={cn(
                      'text-3xl font-bold',
                      (edgeHealth.overall_health ?? 0) > 0.6 ? 'text-success' : (edgeHealth.overall_health ?? 0) > 0.3 ? 'text-warning' : 'text-destructive'
                    )}>
                      {((edgeHealth.overall_health ?? 0) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Overall Health</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Stability </span>{(edgeHealth.edge_stability ?? 0).toFixed(2)}</div>
                    <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Drift </span>{(edgeHealth.performance_drift ?? 0).toFixed(2)}</div>
                    <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Drawdown </span>{(edgeHealth.drawdown_severity ?? 0).toFixed(2)}</div>
                    <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Decay </span>{(edgeHealth.confidence_decay ?? 0).toFixed(2)}</div>
                  </div>
                  {edgeHealth.signals && edgeHealth.signals.length > 0 && (
                    <div className="mt-2">
                      {edgeHealth.signals.slice(0, 2).map((s, i) => (
                        <div key={i} className={cn(
                          'flex items-center gap-2 p-2 rounded text-xs mt-1',
                          s.severity === 'high' ? 'bg-destructive/10 text-destructive' : s.severity === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        )}>
                          <AlertTriangle className="w-3 h-3" />
                          {s.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState title="No health data" message="Run an edge health check" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Best Model */}
        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader>
              <CardTitle><BarChart3 className="w-4 h-4 mr-2 inline" />Best Model</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.best_model ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">{dashboard.best_model.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Sharpe: </span>{dashboard.best_model.sharpe_ratio?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">Win Rate: </span>{(dashboard.best_model.win_rate ?? 0 * 100).toFixed(1)}%</div>
                    <div><span className="text-muted-foreground">Profit Factor: </span>{dashboard.best_model.profit_factor?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">Trades: </span>{dashboard.best_model.total_trades}</div>
                  </div>
                </div>
              ) : (
                <EmptyState title="No models" message="Run backtests to find your best model" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Discoveries & Backtests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader>
              <CardTitle><FileText className="w-4 h-4 mr-2 inline" />Recent Discoveries</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.recent_discoveries && dashboard.recent_discoveries.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.recent_discoveries.map((d: any) => (
                    <div key={d.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{d.hypothesis}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.test_type} | Confidence: {d.confidence ? `${(d.confidence * 100).toFixed(0)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No discoveries yet" message="Hypothesis tests will appear here" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader>
              <CardTitle><TrendingUp className="w-4 h-4 mr-2 inline" />Recent Backtests</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBacktests.length > 0 ? (
                <div className="space-y-2">
                  {recentBacktests.map((bt) => (
                    <Link key={bt.id} to={`/projects/${projectId}/quant-research/backtests/${bt.id}`} className="block">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                        <div>
                          <div className="text-sm font-medium">{bt.name}</div>
                          <div className="text-xs text-muted-foreground">{bt.symbols?.join(', ') || 'N/A'} | {bt.start_date} - {bt.end_date}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant={bt.status === 'completed' ? 'success' : bt.status === 'running' ? 'info' : 'outline'}>{bt.status}</Badge>
                          {bt.sharpe_ratio != null && <div className="text-xs text-muted-foreground mt-1">Sharpe: {bt.sharpe_ratio.toFixed(2)}</div>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="No backtests" message="Run your first backtest" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Experiments */}
      <motion.div variants={itemAnim}>
        <Card>
          <CardHeader>
            <CardTitle><FlaskConical className="w-4 h-4 mr-2 inline" />Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={experiments}
              columns={[
                { id: 'name', header: 'Name', accessor: (row: any) => (
                  <Link to={`/projects/${projectId}/quant-research/experiments/${row.id}`} className="text-primary hover:underline font-medium">{row.name}</Link>
                )},
                { id: 'status', header: 'Status', accessor: (row: any) => <Badge className={statusColors[row.status]}>{row.status}</Badge> },
                { id: 'hypothesis_status', header: 'Hypothesis', accessor: (row: any) => row.hypothesis_status ? <Badge className={hypothesisStatusColors[row.hypothesis_status]}>{row.hypothesis_status}</Badge> : <span className="text-muted-foreground text-sm">—</span> },
                { id: 'confidence_score', header: 'Confidence', accessor: (row: any) => row.confidence_score != null ? `${(row.confidence_score * 100).toFixed(0)}%` : '—' },
              ]}
              searchable
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
