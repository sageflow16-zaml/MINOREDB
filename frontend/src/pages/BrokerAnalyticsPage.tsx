import { useParams } from 'react-router-dom';
import type { BrokerAnalytics } from '../api/types';
import {
  useBrokerAnalyticsList, useBrokerConnections, useBrokerDashboard,
} from '../hooks/useBroker';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable, type Column } from '../components/ui/DataTable';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import {
  BarChart3, Activity, Clock, TrendingUp, TrendingDown,
  DollarSign, Zap, Wifi,
} from 'lucide-react';

export default function BrokerAnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: analyticsList, isLoading } = useBrokerAnalyticsList(projectId || '');
  const { data: connections } = useBrokerConnections(projectId || '');
  const { data: dashboard } = useBrokerDashboard(projectId || '');

  if (isLoading) return <LoadingSpinner />;

  const columns: Column<BrokerAnalytics>[] = [
    { id: 'label', header: 'Broker', accessor: (row) => {
      const conn = connections?.find((c) => c.id === row.connection_id);
      return (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${conn?.status === 'connected' ? 'bg-success' : 'bg-muted'}`} />
          <span className="font-medium">{conn?.label || row.connection_id}</span>
        </div>
      );
    }},
    { id: 'total_trades', header: 'Trades', accessor: 'total_trades', sortable: true },
    { id: 'total_profit', header: 'Total Profit', accessor: (row) => (
      <span className={row.total_profit >= 0 ? 'text-success' : 'text-destructive'}>
        ${row.total_profit.toLocaleString()}
      </span>
    ), sortable: true },
    { id: 'total_commission', header: 'Commission', accessor: (row) => `$${row.total_commission.toLocaleString()}` },
    { id: 'avg_execution_ms', header: 'Avg Exec (ms)', accessor: (row) => row.avg_execution_ms ? `${row.avg_execution_ms}ms` : '-', sortable: true },
    { id: 'avg_slippage', header: 'Avg Slippage', accessor: (row) => row.avg_slippage ? `${row.avg_slippage}pips` : '-' },
    { id: 'uptime_pct', header: 'Uptime', accessor: (row) => row.uptime_pct ? `${row.uptime_pct}%` : '-' },
    { id: 'error_rate', header: 'Error Rate', accessor: (row) => row.error_rate ? `${(row.error_rate * 100).toFixed(2)}%` : '0%' },
  ];

  const bestBroker = analyticsList?.length ? [...analyticsList].sort((a, b) => (b.uptime_pct || 0) - (a.uptime_pct || 0))[0] : null;
  const fastestBroker = analyticsList?.length ? [...analyticsList].filter((a) => a.avg_execution_ms).sort((a, b) => (a.avg_execution_ms || 999) - (b.avg_execution_ms || 999))[0] : null;
  const mostProfitable = analyticsList?.length ? [...analyticsList].sort((a, b) => b.total_profit - a.total_profit)[0] : null;
  const cheapestBroker = analyticsList?.length ? [...analyticsList].sort((a, b) => a.total_commission - b.total_commission)[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Broker Analytics</h1>
        <p className="text-muted-foreground">Compare broker performance, execution quality, and costs</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Total Connections" value={dashboard.total_connections} icon={Wifi} />
          <KpiCard title="Total Accounts" value={dashboard.total_accounts} icon={Activity} />
          <KpiCard title="Combined Balance" value={`$${(dashboard.total_balance || 0).toLocaleString()}`} icon={DollarSign} />
          <KpiCard title="Total Trades" value={dashboard.total_trades} icon={BarChart3} />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-success" /> Best Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestBroker ? (
              <div>
                <div className="text-lg font-bold">{bestBroker.uptime_pct}%</div>
                <div className="text-sm text-muted-foreground">
                  {connections?.find((c) => c.id === bestBroker.connection_id)?.label || 'Unknown'}
                </div>
              </div>
            ) : <div className="text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Fastest Execution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fastestBroker ? (
              <div>
                <div className="text-lg font-bold">{fastestBroker.avg_execution_ms}ms</div>
                <div className="text-sm text-muted-foreground">
                  {connections?.find((c) => c.id === fastestBroker.connection_id)?.label || 'Unknown'}
                </div>
              </div>
            ) : <div className="text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> Most Profitable
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostProfitable ? (
              <div>
                <div className="text-lg font-bold text-success">${mostProfitable.total_profit.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {connections?.find((c) => c.id === mostProfitable.connection_id)?.label || 'Unknown'}
                </div>
              </div>
            ) : <div className="text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" /> Lowest Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cheapestBroker ? (
              <div>
                <div className="text-lg font-bold">${cheapestBroker.total_commission.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {connections?.find((c) => c.id === cheapestBroker.connection_id)?.label || 'Unknown'}
                </div>
              </div>
            ) : <div className="text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Broker Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analyticsList || analyticsList.length === 0 ? (
            <EmptyState title="No Analytics Data" description="Sync trades from your brokers to see analytics" />
          ) : (
            <DataTable columns={columns} data={analyticsList} searchable keyExtractor={(r) => r.id} compact />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
