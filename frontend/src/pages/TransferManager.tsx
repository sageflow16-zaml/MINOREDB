import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout, PageSection } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Dialog } from '../components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortfolioTransfers, useAccounts } from '../hooks/usePortfolio';
import { portfolioService } from '../api/portfolio';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const transferTypeOptions = [
  { label: 'Internal', value: 'internal' },
  { label: 'External', value: 'external' },
  { label: 'Funding', value: 'funding' },
  { label: 'Withdrawal', value: 'withdrawal' },
];

const typeBadge: Record<string, string> = {
  internal: 'bg-blue-500/10 text-blue-500',
  external: 'bg-purple-500/10 text-purple-500',
  funding: 'bg-green-500/10 text-green-500',
  withdrawal: 'bg-amber-500/10 text-amber-500',
};

const statusBadge: Record<string, string> = {
  completed: 'text-success',
  pending: 'text-warning',
  failed: 'text-destructive',
  cancelled: 'text-muted-foreground',
};

export default function TransferManagerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ transfer_type: 'internal', from_account_id: '', to_account_id: '', amount: 0, currency: 'USD', description: '' });

  const { data: transfers, isLoading, isError, refetch } = usePortfolioTransfers(projectId!);
  const { data: accounts } = useAccounts(projectId!);

  const createTransfer = useMutation({
    mutationFn: (data: any) => portfolioService.createTransfer(projectId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'transfers'] }); setShowCreate(false); resetForm(); },
  });

  const resetForm = () => setForm({ transfer_type: 'internal', from_account_id: '', to_account_id: '', amount: 0, currency: 'USD', description: '' });

  const handleSave = () => {
    createTransfer.mutate(form);
  };

  const accountOptions = (accounts ?? []).map((a: any) => ({ label: a.name, value: a.id }));

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
        <ErrorState message="Error loading transfers." description="There was a problem fetching transfer data." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title="Transfer Manager"
        description="Track fund movements between accounts"
        headerActions={
          <Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Transfer
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Transfers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transfers && transfers.length > 0 ? (
              <DataTable
                data={transfers}
                columns={[
                  { id: 'type', header: 'Type', accessor: (r: any) => (
                    <Badge className={cn('text-xs', typeBadge[r.transfer_type])} size="sm">{r.transfer_type}</Badge>
                  ), width: '80px' },
                  { id: 'from', header: 'From', accessor: (r: any) => r.from_account_id ? r.from_account_id.slice(0, 8) + '...' : 'External', width: '100px' },
                  { id: 'to', header: 'To', accessor: (r: any) => r.to_account_id ? r.to_account_id.slice(0, 8) + '...' : 'External', width: '100px' },
                  { id: 'amount', header: 'Amount', accessor: (r: any) => (
                    <span className="font-medium">{formatCurrency(r.amount)}</span>
                  ), width: '100px' },
                  { id: 'currency', header: 'Currency', accessor: (r: any) => r.currency || 'USD', width: '70px' },
                  { id: 'status', header: 'Status', accessor: (r: any) => (
                    <span className={cn('text-xs font-medium', statusBadge[r.status] || 'text-muted-foreground')}>{r.status}</span>
                  ), width: '80px' },
                  { id: 'date', header: 'Date', accessor: (r: any) => new Date(r.created_at).toLocaleDateString(), width: '90px', hideOnMobile: true },
                  { id: 'desc', header: 'Description', accessor: (r: any) => r.description || '—', width: '140px', hideOnMobile: true },
                ]}
                searchable={false}
                pageSize={15}
              />
            ) : (
              <EmptyState title="No transfers" description="Create your first transfer to start tracking fund movements." action={
                <Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}><Plus className="h-3.5 w-3.5 mr-1" /> New Transfer</Button>
              } />
            )}
          </CardContent>
        </Card>
      </PageSection>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">New Transfer</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Transfer Type</label>
              <Select value={form.transfer_type} onChange={(v) => setForm({ ...form, transfer_type: v })} options={transferTypeOptions} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From Account</label>
              <Select value={form.from_account_id} onChange={(v) => setForm({ ...form, from_account_id: v })} options={[{ label: 'External (None)', value: '' }, ...accountOptions]} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To Account</label>
              <Select value={form.to_account_id} onChange={(v) => setForm({ ...form, to_account_id: v })} options={[{ label: 'External (None)', value: '' }, ...accountOptions]} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Transfer description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} isLoading={createTransfer.isPending}>Create</Button>
          </div>
        </div>
      </Dialog>
    </PageLayout>
  );
}
