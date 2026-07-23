import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import { useEdgeHealthSnapshots, useCurrentEdgeHealth, useCreateEdgeSnapshot } from '../hooks/useQuantResearch';
import {
  Activity, Heart, AlertTriangle, TrendingDown, Shield,
  RefreshCw, Clock, Zap, ArrowUp, ArrowDown,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function QuantEdgeHealth() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const createSnapshot = useCreateEdgeSnapshot(projectId!);
  const { data: current, isLoading: currentLoading } = useCurrentEdgeHealth(projectId!);
  const { data: snapshots = [], isLoading, error } = useEdgeHealthSnapshots(projectId!);

  if (isLoading || currentLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load edge health data" />;

  const healthPct = current?.overall_health != null ? (current.overall_health * 100).toFixed(0) : '—';
  const healthColor = (current?.overall_health ?? 0) > 0.6 ? 'text-success' : (current?.overall_health ?? 0) > 0.3 ? 'text-warning' : 'text-destructive';
  const healthBg = (current?.overall_health ?? 0) > 0.6 ? 'bg-success/10' : (current?.overall_health ?? 0) > 0.3 ? 'bg-warning/10' : 'bg-destructive/10';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Edge Health Monitor"
        description="Continuous evaluation of strategy edge stability, drift, and degradation"
        actions={
                <Button onClick={() => createSnapshot.mutate({})} disabled={createSnapshot.isPending}>
            <RefreshCw className="w-4 h-4 mr-2" />{createSnapshot.isPending ? 'Checking...' : 'Check Now'}
          </Button>
        }
      />

      {/* Current Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className={cn('w-5 h-5', healthColor)} />
              Current Edge Health
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={cn('text-5xl font-bold mb-2', healthColor)}>{healthPct}%</div>
            <div className="w-full bg-muted rounded-full h-3 mt-2">
              <div className={cn('h-3 rounded-full transition-all', (current?.overall_health ?? 0) > 0.6 ? 'bg-success' : (current?.overall_health ?? 0) > 0.3 ? 'bg-warning' : 'bg-destructive')}
                style={{ width: `${Math.min(100, (current?.overall_health ?? 0) * 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Health Sub-Metrics */}
        <Card>
          <CardHeader><CardTitle><Activity className="w-4 h-4 mr-2 inline" />Sub-Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Edge Stability', value: current?.edge_stability, icon: Shield, invert: false },
                { label: 'Performance Drift', value: current?.performance_drift, icon: TrendingDown, invert: true },
                { label: 'Drawdown Severity', value: current?.drawdown_severity, icon: ArrowDown, invert: true },
                { label: 'Confidence Decay', value: current?.confidence_decay, icon: Zap, invert: true },
              ].map((m) => {
                const val = m.value ?? 0;
                const good = m.invert ? val < 0.3 : val > 0.5;
                return (
                  <div key={m.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <m.icon className={cn('w-4 h-4', good ? 'text-success' : 'text-warning')} />
                      <span>{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className={cn('h-2 rounded-full', good ? 'bg-success' : 'bg-warning')} style={{ width: `${Math.min(100, val * 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">{(val * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Signals & Recommendations */}
        <Card>
          <CardHeader><CardTitle><AlertTriangle className="w-4 h-4 mr-2 inline" />Signals</CardTitle></CardHeader>
          <CardContent>
            {current?.signals && current.signals.length > 0 ? (
              <div className="space-y-2">
                {current.signals.map((s, i) => (
                  <div key={i} className={cn(
                    'flex items-start gap-2 p-2 rounded text-sm',
                    s.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                    s.severity === 'medium' ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  )}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{s.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No signals" message="Run an edge health check" icon={<AlertTriangle className="h-6 w-6" />} />
            )}
            {current?.recommendations && current.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs font-medium text-muted-foreground mb-2">Recommendations</div>
                <ul className="space-y-1">
                  {current.recommendations.map((r, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <ArrowUp className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader><CardTitle><Clock className="w-4 h-4 mr-2 inline" />Health History</CardTitle></CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <EmptyState title="No history" message="Check edge health to start tracking" icon={<Clock className="h-6 w-6" />} />
          ) : (
            <DataTable
              data={snapshots}
              columns={[
                { id: 'snapshot_date', header: 'Date', accessor: 'snapshot_date' },
                { id: 'overall_health', header: 'Health', accessor: (row: any) => {
                  const pct = row.overall_health != null ? (row.overall_health * 100).toFixed(0) : '—';
                  const c = (row.overall_health ?? 0) > 0.6 ? 'text-success' : (row.overall_health ?? 0) > 0.3 ? 'text-warning' : 'text-destructive';
                  return <span className={cn('font-medium', c)}>{pct}%</span>;
                }},
                { id: 'edge_stability', header: 'Stability', accessor: (row: any) => row.edge_stability?.toFixed(3) ?? '—' },
                { id: 'performance_drift', header: 'Drift', accessor: (row: any) => row.performance_drift?.toFixed(3) ?? '—' },
                { id: 'drawdown_severity', header: 'Drawdown', accessor: (row: any) => row.drawdown_severity?.toFixed(3) ?? '—' },
                { id: 'confidence_decay', header: 'Decay', accessor: (row: any) => row.confidence_decay?.toFixed(3) ?? '—' },
                { id: 'signals', header: 'Signals', accessor: (row: any) => {
                  const warnings = (row.signals || []).filter((s: any) => s.severity === 'high' || s.severity === 'medium').length;
                  return warnings > 0 ? <Badge variant="warning">{warnings}</Badge> : <Badge variant="success">OK</Badge>;
                }},
              ]}
              searchable
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
