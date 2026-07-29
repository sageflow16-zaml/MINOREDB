import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import {
  useMarketAlerts, useCreateAlert, useReadAlert, useDismissAlert, useCheckNewsAlerts,
} from '../hooks/useMarketIntelligence';
import type { MarketAlert } from '../api/types';
import { Bell, Plus, X, CheckCircle, Trash2, AlertTriangle, Clock, RefreshCw, Eye, BellOff } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const SEVERITY_VARIANT: Record<string, 'destructive' | 'warning' | 'info' | 'default'> = {
  critical: 'destructive', warning: 'warning', info: 'info', low: 'default',
};

type FilterType = 'all' | 'unread' | 'critical';

export default function AlertManagerPage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    alert_type: 'price', title: '', message: '', severity: 'info',
  });

  const { data: allAlerts = [], isLoading } = useMarketAlerts(projectId!);
  const createMutation = useCreateAlert(projectId!);
  const readMutation = useReadAlert(projectId!);
  const dismissMutation = useDismissAlert(projectId!);
  const checkNewsMutation = useCheckNewsAlerts(projectId!);

  const alerts = allAlerts.filter((a: MarketAlert) => {
    if (filter === 'unread') return !a.is_read;
    if (filter === 'critical') return a.severity === 'critical' || a.severity === 'warning';
    return true;
  });

  const unreadCount = allAlerts.filter((a: MarketAlert) => !a.is_read).length;
  const criticalCount = allAlerts.filter((a: MarketAlert) => a.severity === 'critical').length;

  const handleCreate = () => {
    createMutation.mutate(formData);
    setShowForm(false);
    setFormData({ alert_type: 'price', title: '', message: '', severity: 'info' });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Manager"
        description="Manage market alerts, news alerts and custom notifications"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => checkNewsMutation.mutate()} disabled={checkNewsMutation.isPending}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', checkNewsMutation.isPending && 'animate-spin')} /> Check News
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Custom Alert
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{allAlerts.length}</p>
            <p className="text-xs text-muted-foreground">Total Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{unreadCount}</p>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1 border-b border-border/50">
        {(['all', 'unread', 'critical'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              filter === f ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-3xs font-bold text-primary">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
        {alerts.length === 0 && <EmptyState />}
        {alerts.map((a: MarketAlert) => (
          <motion.div key={a.id} variants={item}>
            <Card className={cn('transition-colors', !a.is_read && 'border-primary/30 bg-primary/5')}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0', a.severity === 'critical' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant={SEVERITY_VARIANT[a.severity] ?? 'default'}>{a.severity}</Badge>
                    <Badge variant="outline">{a.alert_type}</Badge>
                    {a.is_read && <Badge variant="default">read</Badge>}
                  </div>
                  <p className={cn('text-sm font-medium', a.is_read ? 'text-muted-foreground' : 'text-foreground')}>{a.title}</p>
                  {a.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>}
                  <span className="text-3xs text-muted-foreground mt-1 inline-block">{a.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!a.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => readMutation.mutate(a.id)} title="Mark read">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => dismissMutation.mutate(a.id)} title="Dismiss">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Create dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Create Custom Alert</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <select value={formData.alert_type} onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {['price', 'news', 'regime', 'volatility', 'custom'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Alert title" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Message (optional)" value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-20 resize-none" />
              <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {['info', 'warning', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.title}>Create</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
