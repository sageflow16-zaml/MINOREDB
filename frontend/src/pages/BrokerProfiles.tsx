import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout, PageSection, PageGrid } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Dialog } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrokers } from '../hooks/usePortfolio';
import { portfolioService } from '../api/portfolio';
import type { BrokerProfile, BrokerPlatform, CommissionModel, ExecutionModel } from '../api/types';
import { cn } from '../lib/utils';
import { Plus, Edit3, Trash2, ExternalLink, Building } from 'lucide-react';

const platformColors: Record<string, string> = {
  mt4: 'bg-blue-500/10 text-blue-500',
  mt5: 'bg-green-500/10 text-green-500',
  ctrader: 'bg-purple-500/10 text-purple-500',
  tradingview: 'bg-amber-500/10 text-amber-500',
  ninjatrader: 'bg-cyan-500/10 text-cyan-500',
  tradestation: 'bg-rose-500/10 text-rose-500',
  ibkr: 'bg-indigo-500/10 text-indigo-500',
  custom: 'bg-gray-500/10 text-gray-500',
};

const platformOptions = [
  { label: 'MT4', value: 'mt4' }, { label: 'MT5', value: 'mt5' }, { label: 'cTrader', value: 'ctrader' },
  { label: 'TradingView', value: 'tradingview' }, { label: 'NinjaTrader', value: 'ninjatrader' },
  { label: 'TradeStation', value: 'tradestation' }, { label: 'IBKR', value: 'ibkr' }, { label: 'Custom', value: 'custom' },
];

const commissionOptions = [
  { label: 'Per Lot', value: 'per_lot' }, { label: 'Per Trade', value: 'per_trade' },
  { label: 'Per Share', value: 'per_share' }, { label: 'Per Contract', value: 'per_contract' }, { label: 'None', value: 'none' },
];

const executionOptions = [
  { label: 'Market', value: 'market' }, { label: 'Limit', value: 'limit' }, { label: 'Stop', value: 'stop' },
  { label: 'DMA', value: 'dma' }, { label: 'STP', value: 'stp' }, { label: 'ECN', value: 'ecn' },
];

export default function BrokerProfilesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: brokers, isLoading, isError, refetch } = useBrokers(projectId!);
  const [showCreate, setShowCreate] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrokerProfile | null>(null);
  const [form, setForm] = useState({ broker_name: '', platform: 'mt4' as BrokerPlatform, server: '', base_currency: 'USD', commission_model: 'none' as CommissionModel, spread_profile: '', execution_model: 'market' as ExecutionModel });

  const createBroker = useMutation({
    mutationFn: (data: Partial<BrokerProfile>) => portfolioService.createBroker(projectId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'brokers'] }); setShowCreate(false); resetForm(); },
  });

  const updateBroker = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BrokerProfile> }) => portfolioService.updateBroker(projectId!, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'brokers'] }); setEditingBroker(null); resetForm(); },
  });

  const deleteBroker = useMutation({
    mutationFn: (id: string) => portfolioService.deleteBroker(projectId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'brokers'] }); setDeleteTarget(null); },
  });

  const resetForm = () => setForm({ broker_name: '', platform: 'mt4', server: '', base_currency: 'USD', commission_model: 'none', spread_profile: '', execution_model: 'market' });

  const openEdit = (broker: BrokerProfile) => {
    setEditingBroker(broker);
    setForm({
      broker_name: broker.broker_name,
      platform: broker.platform,
      server: broker.server || '',
      base_currency: broker.base_currency,
      commission_model: broker.commission_model,
      spread_profile: broker.spread_profile || '',
      execution_model: broker.execution_model,
    });
  };

  const handleSave = () => {
    if (editingBroker) updateBroker.mutate({ id: editingBroker.id, data: form as any });
    else createBroker.mutate(form as any);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex h-[60vh] items-center justify-center"><LoadingSpinner /></div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout>
        <ErrorState message="Error loading brokers." description="There was a problem fetching broker profiles." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title="Broker Profiles"
        description="Manage broker connections and profiles"
        headerActions={
          <Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Broker
          </Button>
        }
      >
        {brokers && brokers.length > 0 ? (
          <PageGrid cols={3}>
            {brokers.map((broker) => (
              <Card key={broker.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{broker.broker_name}</div>
                        <Badge className={cn('text-xs mt-0.5', platformColors[broker.platform] || platformColors.custom)} size="sm">{broker.platform.toUpperCase()}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(broker)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(broker)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    {broker.server && <div className="flex justify-between"><span className="text-muted-foreground">Server</span><span className="text-foreground font-medium">{broker.server}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="text-foreground font-medium">{broker.base_currency}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Commission</span><span className="text-foreground font-medium">{broker.commission_model.replace(/_/g, ' ')}</span></div>
                    {broker.spread_profile && <div className="flex justify-between"><span className="text-muted-foreground">Spread</span><span className="text-foreground font-medium">{broker.spread_profile}</span></div>}
                  </div>
                  <button onClick={() => navigate(`/projects/${projectId}/portfolio/accounts?broker_id=${broker.id}`)} className="flex items-center gap-1 mt-3 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> View Accounts
                  </button>
                </CardContent>
              </Card>
            ))}
          </PageGrid>
        ) : (
          <EmptyState title="No broker profiles" description="Add your first broker to link accounts." action={<Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}><Plus className="h-3.5 w-3.5 mr-1" /> Add Broker</Button>} />
        )}
      </PageSection>

      <Dialog open={showCreate || !!editingBroker} onOpenChange={(open: boolean) => { if (!open) { setShowCreate(false); setEditingBroker(null); } }}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingBroker ? 'Edit Broker' : 'Add Broker'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Broker Name</label>
              <Input value={form.broker_name} onChange={(e) => setForm({ ...form, broker_name: e.target.value })} placeholder="e.g. IC Markets" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Platform</label>
              <Select value={form.platform} onChange={(v) => setForm({ ...form, platform: v as BrokerPlatform })} options={platformOptions} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Server</label>
              <Input value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} placeholder="e.g. ICMarkets-Live" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Base Currency</label>
              <Input value={form.base_currency} onChange={(e) => setForm({ ...form, base_currency: e.target.value })} placeholder="USD" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Commission Model</label>
              <Select value={form.commission_model} onChange={(v) => setForm({ ...form, commission_model: v as CommissionModel })} options={commissionOptions} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Spread Profile</label>
              <Input value={form.spread_profile} onChange={(e) => setForm({ ...form, spread_profile: e.target.value })} placeholder="e.g. Raw/Raw+Spread" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Execution Model</label>
              <Select value={form.execution_model} onChange={(v) => setForm({ ...form, execution_model: v as ExecutionModel })} options={executionOptions} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setEditingBroker(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} isLoading={createBroker.isPending || updateBroker.isPending}>Save</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Broker"
        message={`Are you sure you want to delete "${deleteTarget?.broker_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteBroker.mutate(deleteTarget.id)}
      />
    </PageLayout>
  );
}
