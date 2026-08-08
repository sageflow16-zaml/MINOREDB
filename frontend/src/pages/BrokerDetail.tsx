import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
  BrokerAccount, SyncHistoryRecord, BrokerLog, BrokerHealth, BrokerAnalytics,
} from '../api/types';
import {
  useBrokerConnection, useBrokerAccounts, useSyncHistory,
  useSyncConnection, useSyncAccountTrades, useBrokerLogs,
  useBrokerHealth, useCheckBrokerHealth, useConnectionAnalytics,
} from '../hooks/useBroker';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable, type Column } from '../components/ui/DataTable';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert } from '../components/ui/alert';
import {
  ArrowLeft, RefreshCw, Activity, Database, Clock,
  CheckCircle2, XCircle,
  BarChart3,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
  running: 'bg-warning/10 text-warning',
};

const logLevelColors: Record<string, string> = {
  info: 'text-primary-text',
  warning: 'text-warning',
  error: 'text-destructive',
  debug: 'text-muted-foreground',
};

export default function BrokerDetail() {
  const { connectionId, projectId } = useParams<{ connectionId: string; projectId: string }>();
  const navigate = useNavigate();

  const { data: connection, isLoading: connLoading } = useBrokerConnection(projectId || '', connectionId || '');
  const { data: accounts, isLoading: accLoading } = useBrokerAccounts(projectId || '', connectionId || '');
  const { data: syncHistory } = useSyncHistory(projectId || '', connectionId || '');
  const { data: health } = useBrokerHealth(projectId || '', connectionId || '');
  const { data: logs } = useBrokerLogs(projectId || '', connectionId || '');
  const { data: analytics } = useConnectionAnalytics(projectId || '', connectionId || '');

  const syncConn = useSyncConnection(projectId || '');
  const syncTrades = useSyncAccountTrades(projectId || '');
  const checkHealth = useCheckBrokerHealth(projectId || '');

  const [syncing, setSyncing] = useState(false);
  const [healthMsg, setHealthMsg] = useState<string | null>(null);

  const handleSyncAll = async () => {
    if (!connectionId) return;
    setSyncing(true);
    try {
      await syncConn.mutateAsync(connectionId);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    if (!connectionId) return;
    try {
      await syncTrades.mutateAsync({ connectionId, accountId });
    } catch { /* ignore */ }
  };

  const handleHealthCheck = async () => {
    if (!connectionId) return;
    try {
      const result = await checkHealth.mutateAsync(connectionId);
      setHealthMsg(result.is_reachable ? 'Connected successfully' : `Unreachable: ${result.error_message || 'Unknown'}`);
    } catch {
      setHealthMsg('Health check failed');
    }
    setTimeout(() => setHealthMsg(null), 5000);
  };

  if (connLoading || accLoading) return <LoadingSpinner />;
  if (!connection) return <EmptyState title="Connection Not Found" description="This broker connection does not exist" />;

  const accountCols: Column<BrokerAccount>[] = [
    { id: 'name', header: 'Account', accessor: 'name', sortable: true },
    { id: 'external_id', header: 'External ID', accessor: 'external_id' },
    { id: 'account_type', header: 'Type', accessor: (row) => row.account_type ? <Badge variant="outline">{row.account_type}</Badge> : '-' },
    { id: 'currency', header: 'CCY', accessor: 'currency' },
    { id: 'balance', header: 'Balance', accessor: (row) => `$${row.balance.toLocaleString()}` },
    { id: 'equity', header: 'Equity', accessor: (row) => `$${row.equity.toLocaleString()}` },
    { id: 'open_pl', header: 'Open P&L', accessor: (row) => (
      <span className={row.open_pl >= 0 ? 'text-success' : 'text-destructive'}>
        ${row.open_pl.toLocaleString()}
      </span>
    )},
    { id: 'last_synced_at', header: 'Last Sync', accessor: (row) => row.last_synced_at ? new Date(row.last_synced_at).toLocaleString() : 'Never' },
    { id: 'actions', header: '', accessor: (row) => (
      <Button variant="ghost" size="icon" onClick={() => handleSyncAccount(row.id)} title="Sync trades">
        <RefreshCw className="w-4 h-4" />
      </Button>
    )},
  ];

  const syncCols: Column<SyncHistoryRecord>[] = [
    { id: 'started_at', header: 'Started', accessor: (row) => new Date(row.started_at).toLocaleString() },
    { id: 'sync_type', header: 'Type', accessor: (row) => <Badge variant="outline">{row.sync_type}</Badge> },
    { id: 'status', header: 'Status', accessor: (row) => (
      <Badge variant="outline" className={statusColors[row.status] || ''}>{row.status}</Badge>
    )},
    { id: 'items_synced', header: 'Synced', accessor: 'items_synced' },
    { id: 'items_created', header: 'Created', accessor: 'items_created' },
    { id: 'items_duplicates', header: 'Duplicates', accessor: 'items_duplicates' },
    { id: 'duration_seconds', header: 'Duration', accessor: (row) => row.duration_seconds ? `${row.duration_seconds.toFixed(1)}s` : '-' },
    { id: 'error_message', header: 'Error', accessor: (row) => row.error_message ? <span className="text-destructive text-sm">{row.error_message}</span> : '-' },
  ];

  const logCols: Column<BrokerLog>[] = [
    { id: 'created_at', header: 'Time', accessor: (row) => new Date(row.created_at).toLocaleString() },
    { id: 'level', header: 'Level', accessor: (row) => (
      <span className={`font-medium ${logLevelColors[row.level] || ''}`}>{row.level}</span>
    )},
    { id: 'message', header: 'Message', accessor: 'message' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('../broker')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{connection.label}</h1>
              <Badge variant="outline" className={connection.status === 'connected' ? 'bg-success/10 text-success' : connection.status === 'error' ? 'bg-destructive/10 text-destructive' : ''}>
                {connection.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{connection.provider} connection</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleHealthCheck} disabled={checkHealth.isPending}>
            <Activity className="w-4 h-4 mr-2" />
            Health Check
          </Button>
          <Button onClick={handleSyncAll} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </div>

      {healthMsg && (
        <Alert variant={healthMsg.startsWith('Connected') ? 'success' : 'error'} title={healthMsg} />
      )}

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KpiCard title="Total Trades" value={analytics.total_trades} icon={BarChart3} />
          <KpiCard title="Total Profit" value={`$${(analytics.total_profit || 0).toLocaleString()}`} icon={Activity} variant={analytics.total_profit >= 0 ? 'success' : undefined} />
          <KpiCard title="Commission" value={`$${(analytics.total_commission || 0).toLocaleString()}`} />
          <KpiCard title="Avg Execution" value={analytics.avg_execution_ms ? `${analytics.avg_execution_ms}ms` : '-'} icon={Clock} />
          <KpiCard title="Avg Slippage" value={analytics.avg_slippage ? `${analytics.avg_slippage}pips` : '-'} icon={Activity} />
          <KpiCard title="Rejected Orders" value={analytics.rejected_orders} variant={analytics.rejected_orders > 0 ? 'danger' : 'success'} />
        </div>
      )}

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts"><Database className="w-4 h-4 mr-2" />Accounts</TabsTrigger>
          <TabsTrigger value="sync"><RefreshCw className="w-4 h-4 mr-2" />Sync History</TabsTrigger>
          <TabsTrigger value="health"><Activity className="w-4 h-4 mr-2" />Health</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Broker Accounts ({accounts?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!accounts || accounts.length === 0 ? (
                <EmptyState title="No Accounts" description="Sync this connection to discover accounts" />
              ) : (
                <DataTable columns={accountCols} data={accounts} searchable keyExtractor={(r) => r.id} compact />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
            </CardHeader>
            <CardContent>
              {!syncHistory || syncHistory.length === 0 ? (
                <EmptyState title="No Sync History" description="Run a sync to see history here" />
              ) : (
                <DataTable columns={syncCols} data={syncHistory} keyExtractor={(r) => r.id} compact />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Health</CardTitle>
            </CardHeader>
            <CardContent>
              {health ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      {health.is_reachable ? (
                        <><CheckCircle2 className="w-5 h-5 text-success" /><span className="font-semibold text-success">Reachable</span></>
                      ) : (
                        <><XCircle className="w-5 h-5 text-destructive" /><span className="font-semibold text-destructive">Unreachable</span></>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border">
                    <div className="text-sm text-muted-foreground">Latency</div>
                    <div className="text-xl font-bold mt-1">{health.latency_ms ? `${health.latency_ms}ms` : '-'}</div>
                  </div>
                  <div className="p-4 rounded-xl border">
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="text-xl font-bold mt-1">{health.uptime_percentage ? `${health.uptime_percentage}%` : '-'}</div>
                  </div>
                  <div className="p-4 rounded-xl border">
                    <div className="text-sm text-muted-foreground">Last Check</div>
                    <div className="text-xl font-bold mt-1">{health.last_check_at ? new Date(health.last_check_at).toLocaleString() : 'Never'}</div>
                  </div>
                  {health.error_message && (
                    <div className="col-span-full p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                      <div className="text-sm text-destructive font-medium">Error: {health.error_message}</div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState title="No Health Data" description="Run a health check to see connection status" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {!logs || logs.length === 0 ? (
                <EmptyState title="No Logs" description="Logs will appear as activity occurs" />
              ) : (
                <DataTable columns={logCols} data={logs} keyExtractor={(r) => r.id} compact />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
