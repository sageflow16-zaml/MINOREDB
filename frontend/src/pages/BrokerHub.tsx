import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useBrokerDashboard, useBrokerConnections, useBrokerProviders,
  useDeleteBrokerConnection, useTestBrokerConnection,
} from '../hooks/useBroker';
import type { BrokerHubConnection } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Alert } from '../components/ui/alert';
import {Globe, Link2, RefreshCw, Activity, BarChart3, Plus, Zap, Wifi, WifiOff, AlertTriangle, Trash2, ExternalLink, TestTube, Database} from 'lucide-react';

const statusIcon: Record<string, typeof Wifi> = {
  connected: Wifi,
  disconnected: WifiOff,
  error: AlertTriangle,
  pending: Link2,
};

const statusColor: Record<string, string> = {
  connected: 'bg-success/10 text-success border-success/20',
  disconnected: 'bg-muted text-muted-foreground border-border',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  expired: 'bg-muted text-muted-foreground border-border',
};

const providerIcons: Record<string, string> = {
  metatrader4: 'MT4', metatrader5: 'MT5', ctrader: 'cT',
  dxtrade: 'DX', interactive_brokers: 'IB', oanda: 'OA',
  tradelocker: 'TL', binance: 'BN', bybit: 'BB', kraken: 'KR',
  custom_rest: 'API',
};

const providerNames: Record<string, string> = {
  metatrader4: 'MetaTrader 4', metatrader5: 'MetaTrader 5',
  ctrader: 'cTrader', dxtrade: 'DXtrade',
  interactive_brokers: 'Interactive Brokers', oanda: 'OANDA',
  tradelocker: 'TradeLocker', binance: 'Binance',
  bybit: 'Bybit', kraken: 'Kraken', custom_rest: 'Custom REST',
};

export default function BrokerHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: dashboard, isLoading: dashLoading } = useBrokerDashboard(projectId || '');
  const { data: connections, isLoading: connLoading } = useBrokerConnections(projectId || '');
  const { data: providers } = useBrokerProviders(projectId || '');
  const deleteConn = useDeleteBrokerConnection(projectId || '');
  const testConn = useTestBrokerConnection(projectId || '');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await testConn.mutateAsync(id);
      setTestResult(`${result.success ? 'Connected' : 'Failed'}: ${result.message}`);
    } catch {
      setTestResult('Test failed');
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this broker connection?')) return;
    try {
      await deleteConn.mutateAsync(id);
    } catch { /* ignore */ }
  };

  if (dashLoading || connLoading) return <LoadingSpinner />;

  const columns: Column<BrokerHubConnection>[] = [
    { id: 'label', header: 'Connection', accessor: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-text">
          {providerIcons[row.provider] || '?'}
        </div>
        <div>
          <div className="font-medium">{row.label}</div>
          <div className="text-xs text-muted-foreground">{providerNames[row.provider] || row.provider}</div>
        </div>
      </div>
    )},
    { id: 'status', header: 'Status', accessor: (row) => {
      const Icon = statusIcon[row.status] || Link2;
      return (
        <Badge variant="outline" className={statusColor[row.status] || ''}>
          <Icon className="w-3 h-3 mr-1" />
          {row.status}
        </Badge>
      );
    }},
    { id: 'error_count', header: 'Errors', accessor: (row) => (
      <span className={row.error_count > 0 ? 'text-destructive' : 'text-muted-foreground'}>{row.error_count}</span>
    )},
    { id: 'last_connected_at', header: 'Last Connected', accessor: (row) => (
      <span className="text-sm text-muted-foreground">{row.last_connected_at ? new Date(row.last_connected_at).toLocaleString() : 'Never'}</span>
    )},
    { id: 'actions', header: '', accessor: (row) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => navigate(`broker/${row.id}`)} title="View details">
          <ExternalLink className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleTest(row.id)} disabled={testingId === row.id} title="Test connection">
          <TestTube className={`w-4 h-4 ${testingId === row.id ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)} title="Delete">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Broker Integration Hub</h1>
          <p className="text-muted-foreground">Manage broker connections, sync trading data, and monitor execution</p>
        </div>
        <Button onClick={() => navigate('setup')}>
          <Plus className="w-4 h-4 mr-2" />
          New Connection
        </Button>
      </div>

      {testResult && (
        <Alert variant={testResult.startsWith('Connected') ? 'success' : 'error'} title={testResult} />
      )}

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KpiCard title="Connections" value={dashboard.total_connections} icon={Link2} />
          <KpiCard title="Connected" value={dashboard.connected_count} icon={Wifi} variant="success" />
          <KpiCard title="Accounts" value={dashboard.total_accounts} icon={Database} />
          <KpiCard title="Total Balance" value={`$${(dashboard.total_balance || 0).toLocaleString()}`} icon={BarChart3} />
          <KpiCard title="Total Equity" value={`$${(dashboard.total_equity || 0).toLocaleString()}`} icon={Activity} />
          <KpiCard title="Imported Trades" value={dashboard.total_trades} icon={RefreshCw} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Broker Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!connections || connections.length === 0 ? (
            <EmptyState
              title="No Broker Connections"
              description="Connect your first broker to start syncing trading data"
              action={<Button onClick={() => navigate('setup')}>Add Connection</Button>}
            />
          ) : (
            <DataTable columns={columns} data={connections} searchable keyExtractor={(r) => r.id} />
          )}
        </CardContent>
      </Card>

      {providers && providers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Available Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {providers.map((p) => (
                <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-text">
                    {providerIcons[p.name] || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.display_name}</div>
                    <div className="text-xs text-muted-foreground">{p.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
