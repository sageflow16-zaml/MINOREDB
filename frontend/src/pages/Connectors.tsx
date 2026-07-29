import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useConnectors, useCreateConnector, useDeleteConnector, useTestConnector, useSyncConnector } from '../hooks/useAutomation';
import {
  Plus, Trash2, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle,
  Calendar, BookOpen, Globe, MessageSquare, Music, HardDrive,
  Github, Mail, Server,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const connectorIcons: Record<string, typeof Globe> = {
  google_calendar: Calendar, notion: BookOpen, obsidian: BookOpen,
  tradingview: Globe, discord: MessageSquare, telegram: MessageSquare,
  slack: MessageSquare, google_drive: HardDrive, dropbox: HardDrive,
  github: Github, email_smtp: Mail, rest_api: Server,
};

const statusColors: Record<string, string> = {
  connected: 'bg-success/10 text-success',
  disconnected: 'bg-muted text-muted-foreground',
  error: 'bg-destructive/10 text-destructive',
  pending: 'bg-warning/10 text-warning',
};

export default function Connectors() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const { data: connectors = [], isLoading, error } = useConnectors(projectId!);
  const createConn = useCreateConnector(projectId!);
  const deleteConn = useDeleteConnector(projectId!);
  const testConn = useTestConnector(projectId!);
  const syncConn = useSyncConnector(projectId!);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', connector_type: 'rest_api', api_key: '', webhook_url: '', base_url: '' });

  const handleCreate = () => {
    createConn.mutate({
      name: form.name, connector_type: form.connector_type,
      config: { api_key: form.api_key, webhook_url: form.webhook_url, base_url: form.base_url },
    }, { onSuccess: () => { setShowForm(false); setForm({ name: '', connector_type: 'rest_api', api_key: '', webhook_url: '', base_url: '' }); } });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load connectors" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Connectors"
        description="Integrate with external services: Discord, Telegram, Slack, Google Calendar, Notion, and more"
        actions={<Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Connector</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Connector</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Discord" /></div>
              <div><label className="text-xs font-medium mb-1 block">Type</label>
                <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.connector_type} onChange={(e) => setForm({ ...form, connector_type: e.target.value })}>
                  <option value="rest_api">REST API</option><option value="discord">Discord</option><option value="telegram">Telegram</option><option value="slack">Slack</option>
                  <option value="email_smtp">Email (SMTP)</option><option value="google_calendar">Google Calendar</option>
                  <option value="notion">Notion</option><option value="obsidian">Obsidian</option>
                  <option value="tradingview">TradingView</option><option value="github">GitHub</option>
                  <option value="google_drive">Google Drive</option><option value="dropbox">Dropbox</option>
                </select>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Webhook URL</label><Input value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://hooks.example.com/..." /></div>
              <div><label className="text-xs font-medium mb-1 block">Base URL</label><Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.example.com" /></div>
              <div className="md:col-span-2"><label className="text-xs font-medium mb-1 block">API Key</label><Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="sk-..." /></div>
            </div>
            <Button onClick={handleCreate} className="mt-4" disabled={!form.name || createConn.isPending}>Create Connector</Button>
          </CardContent>
        </Card>
      )}

      {connectors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((c) => {
            const Icon = connectorIcons[c.connector_type] || Server;
            return (
              <Card key={c.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {c.name}
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-3">
                    Type: <Badge variant="outline" className="text-3xs">{c.connector_type}</Badge>
                    {c.last_sync_at && <div className="mt-1">Last sync: {new Date(c.last_sync_at).toLocaleString()}</div>}
                    {c.error && <div className="mt-1 text-destructive">{c.error}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => testConn.mutate(c.id)} disabled={testConn.isPending}>
                      <Wifi className="w-3.5 h-3.5 mr-1" />Test
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => syncConn.mutate(c.id)} disabled={syncConn.isPending}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />Sync
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteConn.mutate(c.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No connectors" message="Add a connector to integrate with external services" />
      )}
    </motion.div>
  );
}
