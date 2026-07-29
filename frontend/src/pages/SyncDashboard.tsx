import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { KpiCard } from '../components/ui/KpiCard';
import { useSyncDashboard, useSyncLogs, useConflicts, useResolveConflict } from '../hooks/useObsidian';
import { RefreshCw, CheckCircle, AlertTriangle, Clock, ArrowRight, GitBranch, Activity } from 'lucide-react';
import type { SyncLog, SyncConflict } from '../api/types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type TabType = 'overview' | 'logs' | 'conflicts';
const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'logs', label: 'Sync History', icon: Clock },
  { id: 'conflicts', label: 'Conflicts', icon: GitBranch },
];

export default function SyncDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedVault, setSelectedVault] = useState('');

  const dashboard = useSyncDashboard(projectId!);
  const data = dashboard.data;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader title="Sync Dashboard" description="Monitor synchronization status, history, and conflicts" />
      </motion.div>

      <motion.div variants={item} className="flex gap-1 rounded-xl bg-muted/30 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          );
        })}
      </motion.div>

      {dashboard.isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : data && (
        <>
          {activeTab === 'overview' && (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
              <motion.div variants={item} className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <KpiCard title="Total Notes" value={data.total_notes} icon={Activity} />
                <KpiCard title="Synced" value={data.total_synced} icon={CheckCircle} />
                <KpiCard title="Pending" value={data.total_pending} icon={Clock} />
                <KpiCard title="Conflicts" value={data.total_conflicts} icon={AlertTriangle} />
              </motion.div>

              <motion.div variants={item}>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Connected Vaults</CardTitle></CardHeader>
                  <CardContent>
                    {data.vaults.length > 0 ? (
                      <div className="space-y-2">
                        {data.vaults.map((v) => (
                          <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                            <div className={`h-3 w-3 rounded-full ${v.is_connected ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                            <span className="text-sm font-medium">{v.name}</span>
                            <Badge variant={v.is_connected ? 'success' : 'secondary'} className="text-3xs">{v.health_status}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">{v.path}</span>
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState message="No vaults connected" />}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              {data.recent_syncs.length > 0 ? data.recent_syncs.map((log: SyncLog) => (
                <motion.div key={log.id} variants={item}>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        log.status === 'completed' ? 'bg-success/10' : log.status === 'failed' ? 'bg-destructive/10' : 'bg-warning/10'
                      }`}>
                        {log.status === 'completed' ? <CheckCircle className="h-5 w-5 text-success" /> : log.status === 'failed' ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-warning" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-3xs">{log.sync_type}</Badge>
                          <Badge variant={log.status === 'completed' ? 'success' : log.status === 'failed' ? 'destructive' : 'warning'} className="text-3xs">{log.status}</Badge>
                          <span className="text-xs text-muted-foreground">{log.direction} · {log.trigger}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.files_processed} processed · {log.files_imported} imported · {log.files_exported} exported · {log.files_conflicted} conflicts
                          {log.duration_ms != null && ` · ${(log.duration_ms / 1000).toFixed(1)}s`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleString()}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              )) : <EmptyState message="No sync history yet" />}
            </motion.div>
          )}

          {activeTab === 'conflicts' && (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              {data.active_conflicts.length > 0 ? data.active_conflicts.map((conflict: SyncConflict) => (
                <ConflictCard key={conflict.id} conflict={conflict} projectId={projectId!} />
              )) : <EmptyState message="No active conflicts" />}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

function ConflictCard({ conflict, projectId }: { conflict: SyncConflict; projectId: string }) {
  const resolveConflict = useResolveConflict(projectId);

  return (
    <motion.div variants={item}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium font-mono">{conflict.file_path}</span>
                <Badge variant="warning" className="text-3xs">{conflict.conflict_type}</Badge>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Local v{conflict.local_version}</span>
                <span>Remote v{conflict.remote_version}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => resolveConflict.mutate({ conflictId: conflict.id, resolution: 'keep_local' })}>Keep Local</Button>
                <Button size="sm" variant="outline" onClick={() => resolveConflict.mutate({ conflictId: conflict.id, resolution: 'keep_remote' })}>Keep Remote</Button>
                <Button size="sm" variant="outline" onClick={() => resolveConflict.mutate({ conflictId: conflict.id, resolution: 'merge' })}>Merge</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
