import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout, PageSection, PageGrid } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dialog } from '../components/ui/dialog';
import {
  useAccounts, useCreateAccount, useUpdateAccount, useArchiveAccount, useDeleteAccount,
  useAccountGroups, useCreateAccountGroup, useUpdateAccountGroup, useDeleteAccountGroup,
} from '../hooks/usePortfolio';
import type { AccountType, AccountStatus } from '../api/types';
import {
  Plus, Eye, Edit3, Archive, Trash2, Users, Settings2, Wallet, Search,
} from 'lucide-react';
import { cn } from '../lib/utils';

const typeOptions: { label: string; value: AccountType | '' }[] = [
  { label: 'All Types', value: '' },
  { label: 'Personal', value: 'personal' },
  { label: 'Prop Firm', value: 'prop_firm' },
  { label: 'Evaluation', value: 'evaluation' },
  { label: 'Live', value: 'live' },
  { label: 'Demo', value: 'demo' },
];

const statusOptions: { label: string; value: AccountStatus | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
  { label: 'Closed', value: 'closed' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Pending', value: 'pending' },
];

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const typeColors: Record<string, string> = {
  personal: 'bg-blue-500/10 text-blue-500',
  prop_firm: 'bg-purple-500/10 text-purple-500',
  evaluation: 'bg-amber-500/10 text-amber-500',
  live: 'bg-green-500/10 text-green-500',
  demo: 'bg-gray-500/10 text-gray-500',
};

const statusColors: Record<string, string> = {
  active: 'text-success',
  archived: 'text-muted-foreground',
  closed: 'text-destructive',
  suspended: 'text-warning',
  pending: 'text-chart-1',
};

export default function AccountListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<AccountType | ''>('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'account' | 'group'; id: string; name: string } | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [formData, setFormData] = useState({ name: '', account_type: 'personal' as AccountType, initial_balance: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: accounts, isLoading, isError, refetch } = useAccounts(projectId!, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const { data: groups } = useAccountGroups(projectId!);
  const createAccount = useCreateAccount(projectId!);
  const updateAccount = useUpdateAccount(projectId!);
  const archiveAccount = useArchiveAccount(projectId!);
  const deleteAccount = useDeleteAccount(projectId!);
  const createGroup = useCreateAccountGroup(projectId!);
  const updateGroup = useUpdateAccountGroup(projectId!);
  const deleteGroup = useDeleteAccountGroup(projectId!);

  const handleCreateAccount = async () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'Name is required';
    if (formData.initial_balance < 0) errors.initial_balance = 'Balance cannot be negative';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    await createAccount.mutateAsync(formData as any);
    setShowCreate(false);
    setFormData({ name: '', account_type: 'personal', initial_balance: 0 });
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    await updateAccount.mutateAsync({ accountId: editingAccount.id, data: { name: formData.name } });
    setEditingAccount(null);
    setFormData({ name: '', account_type: 'personal', initial_balance: 0 });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'account') await deleteAccount.mutateAsync(deleteTarget.id);
    else await deleteGroup.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({ name: account.name, account_type: account.account_type, initial_balance: account.initial_balance });
  };

  const handleCreateGroup = async () => {
    if (!groupName) return;
    if (editingGroup) {
      await updateGroup.mutateAsync({ groupId: editingGroup.id, data: { name: groupName, description: groupDescription } });
    } else {
      await createGroup.mutateAsync({ name: groupName, description: groupDescription });
    }
    setShowGroupCreate(false);
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
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
        <ErrorState message="Error loading accounts." description="There was a problem fetching your data." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title="Accounts"
        description="Manage your trading accounts and groups"
        headerActions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setShowGroupCreate(true); setEditingGroup(null); setGroupName(''); setGroupDescription(''); }}>
              <Users className="h-3.5 w-3.5 mr-1" /> New Group
            </Button>
            <Button size="sm" onClick={() => { setShowCreate(true); setFormData({ name: '', account_type: 'personal', initial_balance: 0 }); setFormErrors({}); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Account
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={typeFilter} onChange={(v) => setTypeFilter(v as AccountType | '')} options={typeOptions} className="w-28 h-8 text-xs" />
          <Select value={statusFilter} onChange={(v) => setStatusFilter(v as AccountStatus | '')} options={statusOptions} className="w-28 h-8 text-xs" />
        </div>
      </PageSection>

      <Card>
        <CardContent className="p-0">
          {accounts && accounts.length > 0 ? (
            <DataTable
              data={accounts}
              columns={[
                { id: 'name', header: 'Name', accessor: (row: any) => (
                  <button onClick={() => navigate(`/projects/${projectId}/portfolio/accounts/${row.id}`)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{row.name}</button>
                ), width: '140px' },
                { id: 'type', header: 'Type', accessor: (row: any) => (
                  <Badge className={cn('text-xs', typeColors[row.account_type])} size="sm">{row.account_type}</Badge>
                ), width: '90px' },
                { id: 'status', header: 'Status', accessor: (row: any) => (
                  <span className={cn('text-xs font-medium', statusColors[row.status])}>{row.status}</span>
                ), width: '80px' },
                { id: 'balance', header: 'Balance', accessor: (row: any) => formatCurrency(row.current_balance), width: '100px' },
                { id: 'equity', header: 'Equity', accessor: (row: any) => formatCurrency(row.current_equity), width: '100px' },
                { id: 'pnl', header: 'Open PnL', accessor: (row: any) => (
                  <span className={cn('font-medium', row.open_pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(row.open_pnl)}</span>
                ), width: '100px' },
                { id: 'broker', header: 'Broker', accessor: (row: any) => row.broker_profile_id ? 'Linked' : '—', width: '70px', hideOnMobile: true },
                { id: 'actions', header: '', accessor: (row: any) => (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/projects/${projectId}/portfolio/accounts/${row.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => archiveAccount.mutate(row.id)}><Archive className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: 'account', id: row.id, name: row.name })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ), width: '120px' },
              ]}
              searchable={false}
              pageSize={15}
            />
          ) : (
            <EmptyState title="No accounts yet" description="Create your first account to start tracking your portfolio." action={
              <Button size="sm" onClick={() => { setShowCreate(true); setFormData({ name: '', account_type: 'personal', initial_balance: 0 }); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Account
              </Button>
            } />
          )}
        </CardContent>
      </Card>

      {groups && groups.length > 0 && (
        <PageSection title="Account Groups" description="Organize accounts into groups">
          <PageGrid cols={4}>
            {groups.map((g) => (
              <Card key={g.id} className="cursor-default">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingGroup(g); setGroupName(g.name); setGroupDescription(g.description || ''); setShowGroupCreate(true); }}>
                        <Settings2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteTarget({ type: 'group', id: g.id, name: g.name })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="info" size="sm">{g.account_ids?.length ?? 0} accounts</Badge>
                    {g.description && <span className="text-xs text-muted-foreground truncate">{g.description}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </PageGrid>
        </PageSection>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Account</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="My Trading Account" />
              {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <Select value={formData.account_type} onChange={(v) => setFormData({ ...formData, account_type: v as AccountType })} options={typeOptions.filter((o) => o.value) as any} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Initial Balance</label>
              <Input type="number" value={formData.initial_balance} onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })} />
              {formErrors.initial_balance && <p className="text-xs text-destructive mt-1">{formErrors.initial_balance}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateAccount} isLoading={createAccount.isPending}>Create</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!editingAccount} onOpenChange={(open: boolean) => { if (!open) setEditingAccount(null); }}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Edit Account</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditingAccount(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} isLoading={updateAccount.isPending}>Save</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showGroupCreate} onOpenChange={setShowGroupCreate}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="My Group" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
              <Input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Group description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowGroupCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateGroup} isLoading={createGroup.isPending || updateGroup.isPending}>
              {editingGroup ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title={deleteTarget?.type === 'account' ? 'Delete Account' : 'Delete Group'}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageLayout>
  );
}
