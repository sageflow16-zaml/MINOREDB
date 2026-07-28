import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import {
  User, Monitor, Link, Shield, Bell, Palette, Key, Database,
  ChevronRight, Save, CheckCircle, AlertTriangle, Globe,
  Moon, Sun, Smartphone, Mail, Lock, RefreshCw, Plus,
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
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
      <h3 className="text-sm font-medium text-[#FAFAFA] mb-1">{title}</h3>
      {desc && <p className="text-xs text-[#71717A] mb-4">{desc}</p>}
      {children}
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#27272A]/50 last:border-0">
      <div className="flex-1 min-w-0"><p className="text-sm text-[#FAFAFA]">{label}</p>{desc && <p className="text-xs text-[#71717A] mt-0.5">{desc}</p>}</div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5]/10"><Settings className="h-5 w-5 text-[#4F46E5]" /></div>
          <div><h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Settings</h1><p className="text-sm text-[#71717A] mt-0.5">Configure your workspace</p></div>
        </div>
        <Button size="sm" onClick={handleSave} className={saved ? 'bg-[#22C55E]' : ''}>
          {saved ? <CheckCircle className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          {saved ? 'Saved' : 'Save Changes'}
        </Button>
      </motion.div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="hidden lg:flex flex-col gap-1 w-48 shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left', activeTab === t.id ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#111113]')}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Mobile tab bar */}
        <div className="flex lg:hidden gap-1 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1', activeTab === t.id ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] bg-[#111113]')}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {activeTab === 'profile' && (
            <>
              <SettingsSection title="Profile" desc="Manage your personal information">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4F46E5]/10 text-xl font-bold text-[#4F46E5]">T</div>
                    <div><p className="text-sm font-medium text-[#FAFAFA]">Trader Name</p><p className="text-xs text-[#71717A]">trader@example.com</p><Button variant="ghost" size="sm" className="mt-1 text-[11px]">Change Avatar</Button></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-[#71717A] mb-1 block">Name</label><Input defaultValue="Trader" className="text-xs" /></div>
                    <div><label className="text-xs text-[#71717A] mb-1 block">Email</label><Input defaultValue="trader@example.com" className="text-xs" /></div>
                    <div><label className="text-xs text-[#71717A] mb-1 block">Trading Style</label><select className="w-full rounded-lg border border-[#27272A] bg-[#111113] px-3 py-2 text-xs text-[#A1A1AA]"><option>Swing Trader</option><option>Day Trader</option><option>Scalper</option><option>Position Trader</option></select></div>
                    <div><label className="text-xs text-[#71717A] mb-1 block">Experience</label><select className="w-full rounded-lg border border-[#27272A] bg-[#111113] px-3 py-2 text-xs text-[#A1A1AA]"><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Professional</option></select></div>
                  </div>
                </div>
              </SettingsSection>
            </>
          )}

          {activeTab === 'workspace' && (
            <SettingsSection title="Workspace" desc="Configure your default workspace settings">
              <SettingRow label="Default Dashboard" desc="Choose your landing page"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>Dashboard</option><option>Portfolio</option><option>Analytics</option></select></SettingRow>
              <SettingRow label="Default Date Range" desc="Chart date range preset"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>1 Month</option><option>3 Months</option><option>6 Months</option><option>1 Year</option></select></SettingRow>
              <SettingRow label="Default Currency" desc="Display currency"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option></select></SettingRow>
              <SettingRow label="Trade Timezone" desc="Time zone for all trading data"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>UTC</option><option>EST</option><option>GMT</option></select></SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'integrations' && (
            <SettingsSection title="Integrations" desc="Connect your tools and services">
              <div className="space-y-3">
                {[
                  { name: 'TradingView', desc: 'Charts & indicators', connected: true },
                  { name: 'MetaTrader 4', desc: 'Trade execution', connected: false },
                  { name: 'MetaTrader 5', desc: 'Trade execution', connected: false },
                  { name: 'cTrader', desc: 'Trade execution', connected: false },
                  { name: 'Discord', desc: 'Trade notifications', connected: false },
                  { name: 'Telegram', desc: 'Trade alerts', connected: false },
                ].map((i) => (
                  <div key={i.name} className="flex items-center justify-between rounded-lg bg-[#111113] px-4 py-3">
                    <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#27272A]"><Link className="h-4 w-4 text-[#71717A]" /></div>
                      <div><p className="text-sm text-[#FAFAFA]">{i.name}</p><p className="text-xs text-[#71717A]">{i.desc}</p></div></div>
                    <Badge variant={i.connected ? 'success' : 'secondary'} size="sm">{i.connected ? 'Connected' : 'Disconnected'}</Badge>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {activeTab === 'security' && (
            <SettingsSection title="Security" desc="Manage your account security">
              <SettingRow label="Two-Factor Authentication" desc="Add an extra layer of security"><Button variant="outline" size="sm">Enable 2FA</Button></SettingRow>
              <SettingRow label="Session Duration" desc="Auto-logout after inactivity"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>8 hours</option></select></SettingRow>
              <SettingRow label="Login Alerts" desc="Get notified of new logins"><Button variant="outline" size="sm">Configure</Button></SettingRow>
              <SettingRow label="Active Sessions" desc="Manage logged-in devices"><Button variant="outline" size="sm">View All</Button></SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'notifications' && (
            <SettingsSection title="Notifications" desc="Control how you receive updates">
              <SettingRow label="Email Notifications" desc="Receive trade summaries via email"><div className="flex items-center gap-2"><Button variant="outline" size="sm">Configure</Button></div></SettingRow>
              <SettingRow label="Push Notifications" desc="Browser push alerts for key events"><div className="flex items-center gap-2"><Badge variant="success" size="sm">Active</Badge></div></SettingRow>
              <SettingRow label="Risk Alerts" desc="Notify on risk rule violations"><div className="flex items-center gap-2"><Badge variant="success" size="sm">Active</Badge></div></SettingRow>
              <SettingRow label="Daily Digest" desc="Receive a daily trading summary"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>Enabled</option><option>Disabled</option></select></SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'appearance' && (
            <SettingsSection title="Appearance" desc="Customize the look and feel">
              <SettingRow label="Theme" desc="Dark mode is the default"><Badge variant="default" size="sm">Dark Only</Badge></SettingRow>
              <SettingRow label="Font Size" desc="UI text size"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>Small</option><option>Medium</option><option>Large</option></select></SettingRow>
              <SettingRow label="Density" desc="Content density"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>Compact</option><option>Comfortable</option><option>Spacious</option></select></SettingRow>
              <SettingRow label="Animations" desc="UI motion effects"><select className="rounded-lg border border-[#27272A] bg-[#111113] px-2 py-1.5 text-xs text-[#A1A1AA]"><option>Enabled</option><option>Reduced</option></select></SettingRow>
            </SettingsSection>
          )}

          {activeTab === 'api-keys' && (
            <SettingsSection title="API Keys" desc="Manage your API access keys">
              <div className="space-y-3">
                {[
                  { name: 'Production Key', key: 'sk_prod_••••••••••', created: '2024-06-01' },
                  { name: 'Development Key', key: 'sk_dev_•••••••••••', created: '2024-07-15' },
                ].map((k) => (
                  <div key={k.name} className="flex items-center justify-between rounded-lg bg-[#111113] px-4 py-3">
                    <div><p className="text-sm text-[#FAFAFA]">{k.name}</p><p className="text-xs text-[#71717A] font-mono">{k.key}</p><p className="text-[10px] text-[#71717A]">Created: {k.created}</p></div>
                    <div className="flex gap-2"><Button variant="ghost" size="sm">Copy</Button><Button variant="ghost" size="sm" className="text-[#EF4444]">Revoke</Button></div>
                  </div>
                ))}
                <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Generate New Key</Button>
              </div>
            </SettingsSection>
          )}

          {activeTab === 'data' && (
            <SettingsSection title="Data Management" desc="Manage your trading data">
              <SettingRow label="Export All Trades" desc="Download all trade data as CSV"><Button variant="outline" size="sm">Export CSV</Button></SettingRow>
              <SettingRow label="Export Analytics" desc="Download complete analytics report"><Button variant="outline" size="sm">Export Report</Button></SettingRow>
              <SettingRow label="Import Trades" desc="Import trades from another platform"><Button variant="outline" size="sm">Import</Button></SettingRow>
              <SettingRow label="Clear All Data" desc="Permanently delete all trading data"><Button variant="outline" size="sm" className="text-[#EF4444] border-[#EF4444]/30">Clear Data</Button></SettingRow>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}


