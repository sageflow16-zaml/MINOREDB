import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useAuth } from '../auth/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useDeleteProject } from '../hooks/useProjectMutations';
import { supabase } from '../lib/supabase';
import { settingsService, DEFAULT_SETTINGS, type UserSettings } from '../api/settings';
import { tradeImportExportService } from '../api/tradeImportExport';
import { LoadingSpinner } from '../components/ui/Feedback';
import {
  User, Monitor, Link, Shield, Bell, Palette, Key, Database,
  Settings as SettingsIcon, Download, Upload, Trash2, Check,
} from 'lucide-react';

type SettingsTab = 'profile' | 'workspace' | 'integrations' | 'security' | 'notifications' | 'appearance' | 'api-keys' | 'data';

const tabs: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Monitor },
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'data', label: 'Data', icon: Database },
];

function SettingsSection({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      {desc && <p className="text-xs text-muted mb-4">{desc}</p>}
      {children}
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0"><p className="text-sm text-foreground">{label}</p>{desc && <p className="text-xs text-muted mt-0.5">{desc}</p>}</div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-border')}
    >
      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  );
}

const EXPORT_FIELDS = ['pair', 'direction', 'result', 'pnl', 'rr', 'entry_price', 'exit_price', 'stop_loss', 'take_profit', 'position_size', 'risk_percent', 'open_time', 'close_time', 'notes', 'emotion', 'weekly_bias', 'daily_bias', 'h4_bias', 'liquidity_sweep', 'bos', 'mss', 'order_block', 'fvg'];

export default function SettingsPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { setProjectId } = useProject();
  const deleteProjectMutation = useDeleteProject();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    settingsService.get(user.id).then(setSettings).catch(() => setSettings(DEFAULT_SETTINGS));
  }, [user?.id]);

  useEffect(() => {
    if (!user || !settings) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await settingsService.save(user.id, settings);
        setSaveState('saved');
      } catch {
        setSaveState('idle');
      }
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [settings, user]);

  const update = <K extends keyof UserSettings>(section: K, patch: Partial<NonNullable<UserSettings[K]>>) => {
    setSettings((prev) => prev ? ({ ...prev, [section]: { ...prev[section], ...patch } }) : prev);
  };

  const exportCsv = async () => {
    const blob = await tradeImportExportService.exportTrades(projectId, 'csv');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = async () => {
    const blob = await tradeImportExportService.exportTrades(projectId, 'json');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    setImportResult(null);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) { setImportResult('File has no data rows'); return; }
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: Record<string, unknown>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',');
      const row: Record<string, unknown> = {};
      headers.forEach((h, idx) => { row[h] = cells[idx]?.trim() || null; });
      rows.push(row);
    }
    let created = 0;
    for (const r of rows) {
      const insert: Record<string, unknown> = { project_id: projectId };
      for (const f of EXPORT_FIELDS) {
        const v = r[f];
        if (v == null || v === '') continue;
        if (['pnl', 'rr', 'entry_price', 'exit_price', 'stop_loss', 'take_profit', 'position_size', 'risk_percent'].includes(f)) {
          const num = Number(v);
          insert[f] = Number.isFinite(num) ? num : null;
        } else {
          insert[f] = v;
        }
      }
      if (!insert.pair) continue;
      const { error } = await supabase.from('trade').insert(insert);
      if (!error) created++;
    }
    setImportResult(`Imported ${created} of ${rows.length} rows.`);
  };

  const clearAllData = async () => {
    if (!window.confirm('Permanently delete ALL trades for this project? This cannot be undone.')) return;
    const { error } = await supabase
      .from('trade')
      .update({ deleted_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .is('deleted_at', null);
    setImportResult(error ? `Failed: ${error.message}` : 'All trades deleted.');
  };

  const deleteProject = async () => {
    if (!projectId || !window.confirm('Permanently delete this project and ALL of its data? This cannot be undone.')) return;
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      setProjectId(null);
      navigate('/projects');
    } catch {
      // mutation error surfaced by hook toast
    }
  };

  const integrations = useMemo(() => [
    { name: 'TradingView', desc: 'Charts & indicators — webhook configured on the TradingView page', connected: true },
    { name: 'Alpha Vantage', desc: 'Market data — configured via Collectors', connected: true },
    { name: 'Twelve Data', desc: 'Market data / replay — configured via Collectors', connected: true },
    { name: 'MetaTrader 5', desc: 'Trade execution — connect on the MT5 page', connected: false },
    { name: 'Obsidian', desc: 'Knowledge vault — connect on the Vault page', connected: false },
    { name: 'Discord / Telegram', desc: 'Notifications — not integrated', connected: false },
  ], []);

  if (!user) return <LoadingSpinner />;
  if (!settings) return <LoadingSpinner />;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><SettingsIcon className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1><p className="text-sm text-muted mt-0.5">Configure your workspace</p></div>
        </div>
        {saveState === 'saving' && <span className="text-xs text-muted">Saving…</span>}
        {saveState === 'saved' && <span className="flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" />Saved</span>}
      </motion.div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="hidden lg:flex flex-col gap-1 w-48 shrink-0" role="tablist" aria-label="Settings tabs">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} role="tab" aria-selected={activeTab === t.id} aria-controls={`panel-${t.id}`}
                onClick={() => setActiveTab(t.id)}
                className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left', activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted hover:text-secondary hover:bg-surface')}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Mobile tab bar */}
        <div className="flex lg:hidden gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Settings tabs">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} role="tab" aria-selected={activeTab === t.id} aria-controls={`panel-${t.id}`}
                onClick={() => setActiveTab(t.id)}
                className={cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1', activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted bg-surface')}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5" role="tabpanel" id={`panel-${activeTab}`}>
          {activeTab === 'profile' && (
            <>
              <SettingsSection title="Profile" desc="Your trading identity and style">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                    {(settings.profile?.name || user.email?.[0] || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{settings.profile?.name || user.email || 'Trader'}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label htmlFor="settings-name" className="text-xs text-muted mb-1 block">Name</label><Input id="settings-name" value={settings.profile?.name ?? ''} onChange={(e) => update('profile', { name: e.target.value })} className="text-xs" /></div>
                  <div><label htmlFor="settings-email" className="text-xs text-muted mb-1 block">Email</label><Input id="settings-email" value={user.email ?? ''} disabled className="text-xs opacity-60" /></div>
                  <div><label htmlFor="settings-style" className="text-xs text-muted mb-1 block">Trading Style</label>
                    <select id="settings-style" value={settings.profile?.trading_style} onChange={(e) => update('profile', { trading_style: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-secondary">
                      <option>Swing Trader</option><option>Day Trader</option><option>Scalper</option><option>Position Trader</option>
                    </select></div>
                  <div><label htmlFor="settings-exp" className="text-xs text-muted mb-1 block">Experience</label>
                    <select id="settings-exp" value={settings.profile?.experience} onChange={(e) => update('profile', { experience: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-secondary">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Professional</option>
                    </select></div>
                </div>
              </SettingsSection>
            </>
          )}

          {activeTab === 'workspace' && (
            <SettingsSection title="Workspace" desc="Configure your default workspace settings">
              <SettingRow label="Default Dashboard" desc="Choose your landing page">
                <select value={settings.workspace?.default_dashboard} onChange={(e) => update('workspace', { default_dashboard: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>Dashboard</option><option>Portfolio</option><option>Analytics</option>
                </select></SettingRow>
              <SettingRow label="Default Date Range" desc="Chart date range preset">
                <select value={settings.workspace?.default_date_range} onChange={(e) => update('workspace', { default_date_range: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>1 Month</option><option>3 Months</option><option>6 Months</option><option>1 Year</option>
                </select></SettingRow>
              <SettingRow label="Default Currency" desc="Display currency">
                <select value={settings.workspace?.currency} onChange={(e) => update('workspace', { currency: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option>
                </select></SettingRow>
              <SettingRow label="Trade Timezone" desc="Time zone for all trading data">
                <select value={settings.workspace?.timezone} onChange={(e) => update('workspace', { timezone: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>UTC</option><option>EST</option><option>GMT</option>
                </select></SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'integrations' && (
            <SettingsSection title="Integrations" desc="Connect your tools and services">
              <div className="space-y-3">
                {integrations.map((i) => (
                  <div key={i.name} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                    <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-elevated"><Link className="h-4 w-4 text-muted" /></div>
                      <div><p className="text-sm text-foreground">{i.name}</p><p className="text-xs text-muted">{i.desc}</p></div></div>
                    <Badge variant={i.connected ? 'success' : 'secondary'} size="sm">{i.connected ? 'Connected' : 'Disconnected'}</Badge>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {activeTab === 'security' && (
            <SettingsSection title="Security" desc="Account security is managed by Supabase Auth">
              <SettingRow label="Session Duration" desc="Auto-logout after inactivity">
                <select value={settings.workspace?.session_duration ?? '8 hours'} onChange={(e) => update('workspace', { session_duration: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>8 hours</option>
                </select></SettingRow>
              <SettingRow label="Password" desc="Reset your account password">
                <Button variant="outline" size="sm" onClick={() => window.location.assign('/forgot-password')}>Reset Password</Button>
              </SettingRow>
              <SettingRow label="Sign Out" desc="End this session">
                <Button variant="outline" size="sm" className="text-danger border-danger/30" onClick={() => window.location.assign('/login')}>Sign Out</Button>
              </SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'notifications' && (
            <SettingsSection title="Notifications" desc="Control how you receive updates">
              <SettingRow label="Email Notifications" desc="Receive trade summaries via email"><Toggle checked={settings.notifications?.email_notifications ?? false} onChange={(v) => update('notifications', { email_notifications: v })} /></SettingRow>
              <SettingRow label="Push Notifications" desc="Browser push alerts for key events"><Toggle checked={settings.notifications?.push_notifications ?? true} onChange={(v) => update('notifications', { push_notifications: v })} /></SettingRow>
              <SettingRow label="Risk Alerts" desc="Notify on risk rule violations"><Toggle checked={settings.notifications?.risk_alerts ?? true} onChange={(v) => update('notifications', { risk_alerts: v })} /></SettingRow>
              <SettingRow label="Daily Digest" desc="Receive a daily trading summary"><Toggle checked={settings.notifications?.daily_digest ?? false} onChange={(v) => update('notifications', { daily_digest: v })} /></SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'appearance' && (
            <SettingsSection title="Appearance" desc="Customize the look and feel">
              <SettingRow label="Theme" desc="Dark mode is the default"><Badge variant="default" size="sm">Dark Only</Badge></SettingRow>
              <SettingRow label="Font Size" desc="UI text size">
                <select value={settings.appearance?.font_size} onChange={(e) => update('appearance', { font_size: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>Small</option><option>Medium</option><option>Large</option>
                </select></SettingRow>
              <SettingRow label="Density" desc="Content density">
                <select value={settings.appearance?.density} onChange={(e) => update('appearance', { density: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>Compact</option><option>Comfortable</option><option>Spacious</option>
                </select></SettingRow>
              <SettingRow label="Animations" desc="UI motion effects">
                <select value={settings.appearance?.animations} onChange={(e) => update('appearance', { animations: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-secondary">
                  <option>Enabled</option><option>Reduced</option>
                </select></SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'api-keys' && (
            <SettingsSection title="API Keys" desc="Integration credentials are managed per feature">
              <div className="space-y-3">
                <div className="rounded-lg bg-surface px-4 py-3">
                  <p className="text-sm text-foreground">Market data & AI providers</p>
                  <p className="text-xs text-muted mt-1">Alpha Vantage, Twelve Data and OpenRouter keys are configured as project secrets by the operator and are not exposed in the UI.</p>
                </div>
                <div className="rounded-lg bg-surface px-4 py-3">
                  <p className="text-sm text-foreground">Webhook secrets</p>
                  <p className="text-xs text-muted mt-1">TradingView webhook secret is managed on the TradingView page. MT5 / Obsidian credentials are managed on their respective pages.</p>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === 'data' && (
            <SettingsSection title="Data Management" desc="Manage your trading data">
              <SettingRow label="Export All Trades" desc="Download all trade data as CSV">
                <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-3.5 w-3.5 mr-1" />Export CSV</Button>
              </SettingRow>
              <SettingRow label="Export as JSON" desc="Raw trade data for backup">
                <Button variant="outline" size="sm" onClick={exportJson}><Download className="h-3.5 w-3.5 mr-1" />Export JSON</Button>
              </SettingRow>
              <SettingRow label="Import Trades" desc="Import trades from CSV (same format as export)">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5 mr-1" />Import</Button>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} />
                  {importResult && <span className="text-xs text-muted">{importResult}</span>}
                </div>
              </SettingRow>
              <SettingRow label="Clear All Data" desc="Permanently delete all trading data">
                <Button variant="outline" size="sm" className="text-danger border-danger/30" onClick={clearAllData}><Trash2 className="h-3.5 w-3.5 mr-1" />Clear Data</Button>
              </SettingRow>
              <SettingRow label="Delete Project" desc="Permanently delete this project and all of its data">
                <Button variant="outline" size="sm" className="text-danger border-danger/30" onClick={deleteProject}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete Project</Button>
              </SettingRow>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}
