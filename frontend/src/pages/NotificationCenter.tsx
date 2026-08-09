import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { DataTable } from '../components/ui/DataTable';
import {LoadingSpinner, EmptyState} from '../components/ui/Feedback';
import { useNotifications, useSendNotification, useMarkNotificationRead, useMarkAllNotificationsRead, useUnreadCount, useChannels, useCreateChannel, useDeleteChannel, useVerifyChannel } from '../hooks/useAutomation';
import { Bell, Plus, Trash2, Check, CheckCheck, Send, Mail, MessageSquare, Settings, Wifi, WifiOff } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const typeColors: Record<string, string> = {
  info: 'bg-primary/10 text-primary-text',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  error: 'bg-destructive/10 text-destructive',
};

const channelIcons: Record<string, typeof Bell> = {
  in_app: Bell, email: Mail, discord: MessageSquare, telegram: MessageSquare, slack: MessageSquare, webhook: Settings,
};

export default function NotificationCenter() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [activeTab, setActiveTab] = useState<'notifications' | 'channels'>('notifications');
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendForm, setSendForm] = useState({ title: '', message: '', type: 'info', channel: 'in_app' });

  const { data: notifications = [], isLoading: notifLoading } = useNotifications(projectId!);
  const { data: channels = [], isLoading: chanLoading } = useChannels(projectId!);
  const { data: unread } = useUnreadCount(projectId!);
  const sendNotif = useSendNotification(projectId!);
  const markRead = useMarkNotificationRead(projectId!);
  const markAllRead = useMarkAllNotificationsRead(projectId!);
  const createChan = useCreateChannel(projectId!);
  const deleteChan = useDeleteChannel(projectId!);
  const verifyChan = useVerifyChannel(projectId!);

  const [showChanForm, setShowChanForm] = useState(false);
  const [chanForm, setChanForm] = useState({ name: '', channel_type: 'in_app', webhook_url: '' });

  const handleSend = () => {
    sendNotif.mutate(sendForm, { onSuccess: () => { setShowSendForm(false); setSendForm({ title: '', message: '', type: 'info', channel: 'in_app' }); } });
  };

  const handleCreateChannel = () => {
    createChan.mutate({
      name: chanForm.name, channel_type: chanForm.channel_type,
      config: chanForm.channel_type !== 'in_app' ? { webhook_url: chanForm.webhook_url } : {},
    }, { onSuccess: () => { setShowChanForm(false); setChanForm({ name: '', channel_type: 'in_app', webhook_url: '' }); } });
  };

  const ncols = [
    { id: 'indicator', header: '', accessor: (row: Record<string, unknown>) => {
      const t = row.notification_type as string;
      return <div className={`w-2 h-2 rounded-full ${t === 'error' ? 'bg-destructive' : t === 'warning' ? 'bg-warning' : t === 'success' ? 'bg-success' : 'bg-primary'}`} />;
    }},
    { id: 'title', header: 'Title', accessor: (row: Record<string, unknown>) => (
      <div className={(row.read as boolean) ? '' : 'font-semibold'}>{row.title as string} {!row.read && <span className="w-2 h-2 inline-block rounded-full bg-primary ml-1" />}</div>
    )},
    { id: 'notification_type', header: 'Type', accessor: (row: Record<string, unknown>) => <Badge className={typeColors[row.notification_type as string] || ''}>{row.notification_type as string}</Badge> },
    { id: 'channel', header: 'Channel', accessor: (row: Record<string, unknown>) => <Badge variant="outline">{row.channel as string}</Badge> },
    { id: 'created_at', header: 'Time', accessor: (row: Record<string, unknown>) => row.created_at ? new Date(row.created_at as string).toLocaleString() : '-' },
    { id: 'actions', header: '', accessor: (row: Record<string, unknown>) => !row.read && (
      <Button size="icon" variant="ghost" onClick={() => markRead.mutate(row.id as string)}><Check className="w-3.5 h-3.5" /></Button>
    )},
  ];

  const ccols = [
    { id: 'name', header: 'Name', accessor: 'name' },
    { id: 'channel_type', header: 'Type', accessor: (row: Record<string, unknown>) => {
      const v = row.channel_type as string;
      const Icon = channelIcons[v] || Bell;
      return <Badge variant="outline"><Icon className="w-3 h-3 mr-1 inline" />{v}</Badge>;
    }},
    { id: 'enabled', header: 'Status', accessor: (row: Record<string, unknown>) => row.enabled ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Disabled</Badge> },
    { id: 'verified', header: 'Verified', accessor: (row: Record<string, unknown>) => row.verified ? <Badge variant="success"><Wifi className="w-3 h-3 mr-1" />Verified</Badge> : <Badge variant="outline"><WifiOff className="w-3 h-3 mr-1" />Unverified</Badge> },
    { id: 'actions', header: 'Actions', accessor: (row: Record<string, unknown>) => (
      <div className="flex gap-1">
        {!row.verified && <Button size="icon" variant="ghost" onClick={() => verifyChan.mutate(row.id as string)} title="Verify"><CheckCheck className="w-3.5 h-3.5 text-success" /></Button>}
        <Button size="icon" variant="ghost" onClick={() => deleteChan.mutate(row.id as string)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    )},
  ];

  if (notifLoading || chanLoading) return <LoadingSpinner />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Notification Center"
        description={`${unread?.count || 0} unread notifications across ${channels.length || 0} channels`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => markAllRead.mutate()}><CheckCheck className="w-4 h-4 mr-2" />Mark All Read</Button>
            <Button onClick={() => setShowSendForm(!showSendForm)}><Send className="w-4 h-4 mr-2" />Send</Button>
          </div>
        }
      />

      <div className="flex gap-2 border-b border-border pb-px">
        <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notifications' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab('notifications')}>Notifications ({notifications.length})</button>
        <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'channels' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab('channels')}>Channels ({channels.length})</button>
      </div>

      {showSendForm && (
        <Card>
          <CardHeader><CardTitle>Send Notification</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Title</label><Input value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} /></div>
              <div><label className="text-xs font-medium mb-1 block">Type</label>
                <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={sendForm.type} onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}>
                  <option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="error">Error</option>
                </select>
              </div>
              <div className="md:col-span-2"><label className="text-xs font-medium mb-1 block">Message</label><Input value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} /></div>
              <div><label className="text-xs font-medium mb-1 block">Channel</label>
                <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={sendForm.channel} onChange={(e) => setSendForm({ ...sendForm, channel: e.target.value })}>
                  <option value="in_app">In-App</option><option value="email">Email</option><option value="discord">Discord</option><option value="telegram">Telegram</option><option value="slack">Slack</option><option value="webhook">Webhook</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSend} className="mt-4" disabled={!sendForm.title || sendNotif.isPending}>Send</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        notifications.length > 0 ? <DataTable columns={ncols} data={notifications as unknown as Record<string, unknown>[]} /> : <EmptyState title="No notifications" message="Notifications will appear here" />
      )}

      {activeTab === 'channels' && (
        <>
          <Button variant="outline" size="sm" onClick={() => setShowChanForm(!showChanForm)}><Plus className="w-3.5 h-3.5 mr-1" />Add Channel</Button>
          {showChanForm && (
            <Card>
              <CardHeader><CardTitle>Add Notification Channel</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={chanForm.name} onChange={(e) => setChanForm({ ...chanForm, name: e.target.value })} /></div>
                  <div><label className="text-xs font-medium mb-1 block">Type</label>
                    <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={chanForm.channel_type} onChange={(e) => setChanForm({ ...chanForm, channel_type: e.target.value })}>
                      <option value="in_app">In-App</option><option value="email">Email</option><option value="discord">Discord</option><option value="telegram">Telegram</option><option value="slack">Slack</option><option value="webhook">Webhook</option>
                    </select>
                  </div>
                  {chanForm.channel_type !== 'in_app' && <div className="md:col-span-2"><label className="text-xs font-medium mb-1 block">Webhook URL</label><Input value={chanForm.webhook_url} onChange={(e) => setChanForm({ ...chanForm, webhook_url: e.target.value })} placeholder="https://..." /></div>}
                </div>
                <Button onClick={handleCreateChannel} className="mt-4" disabled={!chanForm.name || createChan.isPending}>Add Channel</Button>
              </CardContent>
            </Card>
          )}
          {channels.length > 0 ? <DataTable columns={ccols} data={channels as unknown as Record<string, unknown>[]} /> : <div className="text-sm text-muted-foreground text-center py-4">No channels configured</div>}
        </>
      )}
    </motion.div>
  );
}
