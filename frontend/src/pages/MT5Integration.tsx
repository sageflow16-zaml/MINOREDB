import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import {
  useMT5Status,
  useMT5Logs,
  useMT5Connect,
  useMT5Disconnect,
  useMT5Sync,
} from '../hooks/useMT5';

const statusColor: Record<string, string> = {
  connected: 'bg-green-100 text-green-800',
  simulated: 'bg-blue-100 text-blue-800',
  disconnected: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  authorization_failed: 'bg-yellow-100 text-yellow-800',
  init_failed: 'bg-orange-100 text-orange-800',
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
  const logData = logs.data || [];

  const handleConnect = () => {
    if (!account || !server) return;
    connect.mutate({ account, server, terminal_path: terminalPath });
  };

  const handleSync = (mode: string) => {
    sync.mutate(mode);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader title="MT5 Integration" />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Status" value={data?.connected ? 'Connected' : 'Disconnected'} />
        <StatCard title="Account" value={data?.account ?? '--'} />
        <StatCard title="Total Trades" value={data?.total_trades ?? 0} />
        <StatCard title="Total Synced" value={data?.total_synced ?? 0} />
      </div>

      {/* Connection Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Connection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="12345678"
              className="w-full border rounded-lg px-3 py-2"
              disabled={data?.connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Server</label>
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="MetaQuotes-Demo"
              className="w-full border rounded-lg px-3 py-2"
              disabled={data?.connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Path</label>
            <input
              type="text"
              value={terminalPath}
              onChange={(e) => setTerminalPath(e.target.value)}
              placeholder="C:\Program Files\MetaTrader 5\terminal64.exe"
              className="w-full border rounded-lg px-3 py-2"
              disabled={data?.connected}
            />
          </div>
        </div>
        <div className="flex gap-3">
          {!data?.connected ? (
            <button
              onClick={handleConnect}
              disabled={connect.isPending || !account || !server}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {connect.isPending ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {disconnect.isPending ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>
        {data?.last_sync && (
          <p className="text-sm text-gray-500 mt-3">
            Last sync: {new Date(data.last_sync).toLocaleString()}
          </p>
        )}
      </div>

      {/* Sync Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sync</h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleSync('incremental')}
            disabled={!data?.connected || sync.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sync.isPending ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={() => handleSync('full')}
            disabled={!data?.connected || sync.isPending}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {sync.isPending ? 'Rebuilding...' : 'Full Rebuild'}
          </button>
        </div>
        {sync.data && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p>Imported: {sync.data.trades_imported} | Skipped: {sync.data.trades_skipped} | Duration: {sync.data.duration_ms}ms</p>
          </div>
        )}
      </div>

      {/* Sync History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sync History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Ticket</th>
                <th className="text-left py-2 px-3">Broker</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Message</th>
                <th className="text-left py-2 px-3">Sync Time</th>
              </tr>
            </thead>
            <tbody>
              {logData.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{log.trade_ticket}</td>
                  <td className="py-2 px-3">{log.broker}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[log.status] || 'bg-gray-100'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{log.message || '--'}</td>
                  <td className="py-2 px-3">{new Date(log.sync_time).toLocaleString()}</td>
                </tr>
              ))}
              {logData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">No sync logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
