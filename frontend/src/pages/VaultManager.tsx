import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { KpiCard } from '../components/ui/KpiCard';
import { useVaults, useCreateVault, useDeleteVault, useVaultHealth, useVaultStatistics, useSyncImport, useSyncExport } from '../hooks/useObsidian';
import { FolderOpen, Plus, Trash2, RefreshCw, CheckCircle, AlertTriangle, Database, Activity, HardDrive, Link2 } from 'lucide-react';
import type { Vault } from '../api/types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function VaultManagerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', path: '', vault_type: 'local' });

  const vaults = useVaults(projectId!);
  const createVault = useCreateVault(projectId!);
  const deleteVault = useDeleteVault(projectId!);
  const syncImport = useSyncImport(projectId!);
  const syncExport = useSyncExport(projectId!);

  const vaultsData = vaults.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Obsidian Vaults"
          description="Manage connected Obsidian vaults and sync configuration"
          actions={
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-1" />Connect Vault
            </Button>
          }
        />
      </motion.div>

      {showCreate && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vault Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Trading Vault" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vault Path</label>
                  <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/path/to/vault" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                  <select value={form.vault_type} onChange={(e) => setForm({ ...form, vault_type: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="local">Local</option>
                    <option value="remote">Remote</option>
                    <option value="cloud">Cloud</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => {
                  createVault.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ name: '', path: '', vault_type: 'local' }); }});
                }} disabled={!form.name || !form.path || createVault.isPending}>Connect</Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {vaults.isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : vaultsData.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {vaultsData.map((vault: Vault) => (
            <VaultCard key={vault.id} vault={vault} projectId={projectId!} onDelete={() => deleteVault.mutate(vault.id)} onSync={() => syncImport.mutate({ vaultId: vault.id })} />
          ))}
        </motion.div>
      ) : (
        <EmptyState message="No vaults connected. Click 'Connect Vault' to get started." />
      )}
    </motion.div>
  );
}

function VaultCard({ vault, projectId, onDelete, onSync }: { vault: Vault; projectId: string; onDelete: () => void; onSync: () => void }) {
  const health = useVaultHealth(projectId, vault.id);
  const stats = useVaultStatistics(projectId, vault.id);
  const syncLogs = useSyncImport(projectId);

  return (
    <motion.div variants={item}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
              vault.is_connected ? 'bg-success/10' : 'bg-muted/30'
            }`}>
              <Database className={`h-6 w-6 ${vault.is_connected ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold">{vault.name}</h3>
                <Badge variant={vault.is_connected ? 'success' : 'secondary'}>{vault.is_connected ? 'Connected' : 'Disconnected'}</Badge>
                <Badge variant={vault.health_status === 'healthy' ? 'success' : vault.health_status === 'warning' ? 'warning' : 'secondary'}>
                  {vault.health_status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono mb-2">{vault.path}</p>
              <div className="flex gap-6 text-xs text-muted-foreground">
                <span>Type: <span className="font-medium text-foreground">{vault.vault_type}</span></span>
                <span>Permission: <span className="font-medium text-foreground">{vault.permission_level}</span></span>
                {vault.last_synced_at && <span>Last sync: <span className="font-medium text-foreground">{new Date(vault.last_synced_at).toLocaleDateString()}</span></span>}
              </div>
              {stats.data && (
                <div className="flex gap-4 mt-3">
                  <KpiCard title="Notes" value={stats.data.total_notes} size="sm" />
                  <KpiCard title="Synced" value={stats.data.synced_notes} size="sm" />
                  <KpiCard title="Tags" value={stats.data.total_tags} size="sm" />
                  <KpiCard title="Links" value={stats.data.total_wiki_links} size="sm" />
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={onSync} disabled={syncLogs.isPending}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncLogs.isPending ? 'animate-spin' : ''}`} />Sync
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
