import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useMT5Status, useMT5Logs, useMT5Connect, useMT5Disconnect, useMT5Sync } from '../hooks/useMT5';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';


const statusVariant: Record<string, 'success' | 'info' | 'default' | 'destructive' | 'warning'> = {
  connected: 'success', simulated: 'info', disconnected: 'default',
  error: 'destructive', authorization_failed: 'warning', init_failed: 'warning',
};

export default function MT5IntegrationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [account, setAccount] = useState('');
  const [server, setServer] = useState('');
  const [terminalPath, setTerminalPath] = useState('');

  const status = useMT5Status();
  const logs = useMT5Logs(50);
  const connect = useMT5Connect();
  const disconnect = useMT5Disconnect();
  const sync = useMT5Sync(projectId!);

  if (status.isLoading) return <LoadingSpinner />;
  if (status.isError) return <ErrorState message="Error loading MT5 status." onRetry={() => status.refetch()} />;

  const data = status.data;

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="MT5 Integration" description="Connect and sync with MetaTrader 5" />
        <EmptyState
          message="No MT5 connection"
          description="Connect your MetaTrader 5 account to sync your trading data."
        />
      </div>
    );
  }
  const logData = logs.data || [];

  const handleConnect = () => { if (!account || !server) return; connect.mutate({ account, server, terminal_path: terminalPath }); };
  const handleSync = (mode: string) => { sync.mutate(mode); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="MT5 Integration"
        description="Connect and sync with MetaTrader 5"
      />

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1">
              {data?.connected ? <Wifi className="h-3.5 w-3.5 text-success" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
              <p className="text-[10px] text-muted-foreground">Status</p>
            </div>
            <p className="text-sm font-bold text-foreground">{data?.connected ? 'Connected' : 'Disconnected'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-[10px] text-muted-foreground mb-1">Account</p>
            <p className="text-sm font-bold text-foreground">{data?.account ?? '--'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-[10px] text-muted-foreground mb-1">Total Trades</p>
            <p className="text-sm font-bold text-foreground">{data?.total_trades ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-[10px] text-muted-foreground mb-1">Total Synced</p>
            <p className="text-sm font-bold text-foreground">{data?.total_synced ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">Account</label>
              <Input placeholder="12345678" value={account} onChange={(e) => setAccount(e.target.value)} disabled={data?.connected} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">Server</label>
              <Input placeholder="MetaQuotes-Demo" value={server} onChange={(e) => setServer(e.target.value)} disabled={data?.connected} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">Terminal Path</label>
              <Input placeholder="C:\Program Files\..." value={terminalPath} onChange={(e) => setTerminalPath(e.target.value)} disabled={data?.connected} />
            </div>
          </div>
          <div className="flex gap-2">
            {!data?.connected ? (
              <Button onClick={handleConnect} disabled={connect.isPending || !account || !server} isLoading={connect.isPending}>
                <Wifi className="mr-1.5 h-4 w-4" /> Connect
              </Button>
            ) : (
              <Button onClick={() => disconnect.mutate()} disabled={disconnect.isPending} variant="destructive">
                Disconnect
              </Button>
            )}
          </div>
          {data?.last_sync && (
            <p className="text-xs text-muted-foreground">Last sync: {new Date(data.last_sync).toLocaleString()}</p>
          )}
        </CardContent>
      </Card>

      {/* Sync */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => handleSync('incremental')} disabled={!data?.connected || sync.isPending} isLoading={sync.isPending}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Sync Now
            </Button>
            <Button onClick={() => handleSync('full')} disabled={!data?.connected || sync.isPending} variant="outline">
              <Database className="mr-1.5 h-4 w-4" /> Full Rebuild
            </Button>
          </div>
          {sync.data && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground"
            >
              Imported: {sync.data.trades_imported} | Skipped: {sync.data.trades_skipped} | Duration: {sync.data.duration_ms}ms
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sync History</CardTitle>
        </CardHeader>
        {logData.length === 0 ? (
          <CardContent><p className="text-xs text-muted-foreground text-center py-4">No sync logs yet</p></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Ticket</th>
                  <th className="px-4 py-2.5">Broker</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Message</th>
                  <th className="px-4 py-2.5">Sync Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logData.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-foreground">{log.trade_ticket}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{log.broker}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={statusVariant[log.status] || 'default'} size="sm">{log.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{log.message || '--'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{new Date(log.sync_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
