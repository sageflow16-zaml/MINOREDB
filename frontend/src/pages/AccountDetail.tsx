import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout, PageSection } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog } from '../components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  useAccount, useAccountHealth, useAccountRules, useAccountNotes, useFundingHistory,
  useBalanceHistory, useEquityHistory, useCheckRules,
} from '../hooks/usePortfolio';
import { portfolioService } from '../api/portfolio';
import {
  ArrowLeft, DollarSign, Wallet, TrendingUp, Shield, Activity, Plus, Trash2, Pin, PinOff, AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { chartTooltipStyle } from '../lib/chart';

const tooltipStyle = chartTooltipStyle.contentStyle;

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export default function AccountDetailPage() {
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('balance');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showFundingDialog, setShowFundingDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState(0);
  const [fundDesc, setFundDesc] = useState('');

  const { data: account, isLoading, isError, refetch } = useAccount(projectId!, accountId!);
  const { data: health } = useAccountHealth(projectId!, accountId!);
  const { data: rules, refetch: refetchRules } = useAccountRules(projectId!, accountId!);
  const { data: notes, refetch: refetchNotes } = useAccountNotes(projectId!, accountId!);
  const { data: funding, refetch: refetchFunding } = useFundingHistory(projectId!, accountId!);
  const { data: balanceHistory } = useBalanceHistory(projectId!, accountId!);
  const { data: equityHistory } = useEquityHistory(projectId!, accountId!);

  const checkRules = useCheckRules(projectId!);

  const createNote = useMutation({
    mutationFn: () => portfolioService.createAccountNote(projectId!, accountId!, { title: noteTitle, content: noteContent }),
    onSuccess: () => { refetchNotes(); setShowNoteDialog(false); setNoteTitle(''); setNoteContent(''); },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => portfolioService.deleteAccountNote(projectId!, noteId),
    onSuccess: () => refetchNotes(),
  });

  const addFunding = useMutation({
    mutationFn: () => portfolioService.addFunding(projectId!, accountId!, { amount: fundAmount, description: fundDesc }),
    onSuccess: () => { refetchFunding(); setShowFundingDialog(false); setFundAmount(0); setFundDesc(''); },
  });

  const balanceData = (balanceHistory ?? []).map((p: any) => ({ ...p, date: new Date(p.recorded_at).toLocaleDateString() }));
  const equityData = (equityHistory ?? []).map((p: any) => ({ ...p, date: new Date(p.recorded_at).toLocaleDateString() }));

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex h-[60vh] items-center justify-center"><LoadingSpinner /></div>
      </PageLayout>
    );
  }

  if (isError || !account) {
    return (
      <PageLayout>
        <ErrorState message="Error loading account." description="There was a problem fetching this account." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title={account.name}
        description={`${account.account_type} · ${account.status}`}
        headerActions={
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}/portfolio/accounts`)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><DollarSign className="h-3 w-3" /> Balance</div>
            <div className="text-lg font-semibold text-foreground">{formatCurrency(account.current_balance)}</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Wallet className="h-3 w-3" /> Equity</div>
            <div className="text-lg font-semibold text-foreground">{formatCurrency(account.current_equity)}</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><TrendingUp className="h-3 w-3" /> Open PnL</div>
            <div className={cn('text-lg font-semibold', account.open_pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(account.open_pnl)}</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Shield className="h-3 w-3" /> Margin Level</div>
            <div className={cn('text-lg font-semibold', account.margin_level != null && account.margin_level > 200 ? 'text-success' : account.margin_level != null && account.margin_level > 100 ? 'text-warning' : 'text-destructive')}>
              {account.margin_level != null ? `${account.margin_level.toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Activity className="h-3 w-3" /> Free Margin</div>
            <div className="text-lg font-semibold text-foreground">{formatCurrency(account.free_margin)}</div>
          </div>
        </div>
      </PageSection>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="balance">Balance History</TabsTrigger>
          <TabsTrigger value="equity">Equity History</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Balance Over Time</CardTitle></CardHeader>
            <CardContent>
              {balanceData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceData}>
                      <defs><linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="balance" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#balGrad)" name="Balance" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="No balance history" description="Balance data will appear once recorded." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equity">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Equity Over Time</CardTitle></CardHeader>
            <CardContent>
              {equityData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityData}>
                      <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="equity" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#eqGrad)" name="Equity" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="No equity history" description="Equity data will appear once recorded." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Account Health</CardTitle></CardHeader>
            <CardContent>
              {health ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Health Score</div>
                    <div className={cn('text-lg font-bold mt-1', health.health_score != null && health.health_score >= 80 ? 'text-success' : health.health_score != null && health.health_score >= 50 ? 'text-warning' : 'text-destructive')}>{health.health_score ?? '—'}</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Margin Usage</div>
                    <div className="text-lg font-bold text-foreground mt-1">{health.margin_usage != null ? `${health.margin_usage.toFixed(1)}%` : '—'}</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Drawdown</div>
                    <div className={cn('text-lg font-bold mt-1', health.drawdown_current != null && health.drawdown_limit != null && health.drawdown_current >= health.drawdown_limit ? 'text-destructive' : 'text-foreground')}>
                      {health.drawdown_current != null ? `${health.drawdown_current.toFixed(1)}%` : '—'}{health.drawdown_limit != null ? ` / ${health.drawdown_limit.toFixed(1)}%` : ''}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Daily Loss</div>
                    <div className={cn('text-lg font-bold mt-1', health.daily_loss_current != null && health.daily_loss_limit != null && Math.abs(health.daily_loss_current) >= health.daily_loss_limit ? 'text-destructive' : 'text-foreground')}>
                      {health.daily_loss_current != null ? `${Math.abs(health.daily_loss_current).toFixed(0)}` : '—'}{health.daily_loss_limit != null ? ` / ${health.daily_loss_limit.toFixed(0)}` : ''}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Trailing Drawdown</div>
                    <div className="text-lg font-bold text-foreground mt-1">{health.trailing_drawdown != null ? `${health.trailing_drawdown.toFixed(1)}%` : '—'}{health.trailing_drawdown_limit != null ? ` / ${health.trailing_drawdown_limit.toFixed(1)}%` : ''}</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Violations</div>
                    <div className={cn('text-lg font-bold mt-1', health.violation_count > 0 ? 'text-destructive' : 'text-success')}>{health.violation_count}</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Max Loss</div>
                    <div className="text-lg font-bold text-foreground mt-1">{health.max_loss != null ? `${Math.abs(health.max_loss).toFixed(0)}` : '—'}{health.max_loss_limit != null ? ` / ${health.max_loss_limit.toFixed(0)}` : ''}</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Max Daily Loss</div>
                    <div className="text-lg font-bold text-foreground mt-1">{health.max_daily_loss != null ? `${Math.abs(health.max_daily_loss).toFixed(0)}` : '—'}{health.max_daily_loss_limit != null ? ` / ${health.max_daily_loss_limit.toFixed(0)}` : ''}</div>
                  </div>
                </div>
              ) : (
                <EmptyState title="No health data" description="Health monitoring data is not available for this account." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Account Rules</CardTitle>
                <Button size="sm" variant="outline" onClick={() => checkRules.mutateAsync(accountId!).then(() => refetchRules())}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Check Violations
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rules && rules.length > 0 ? (
                <DataTable
                  data={rules}
                  columns={[
                    { id: 'rule_name', header: 'Rule', accessor: (r: any) => r.rule_name, width: '160px' },
                    { id: 'rule_type', header: 'Type', accessor: (r: any) => <Badge variant="info" size="sm">{r.rule_type}</Badge>, width: '90px' },
                    { id: 'severity', header: 'Severity', accessor: (r: any) => (
                      <Badge variant={r.severity === 'critical' ? 'destructive' : r.severity === 'high' ? 'warning' : 'info'} size="sm">{r.severity}</Badge>
                    ), width: '80px' },
                    { id: 'threshold', header: 'Threshold', accessor: (r: any) => r.threshold_value ?? '—', width: '80px' },
                    { id: 'current', header: 'Current', accessor: (r: any) => r.current_value ?? '—', width: '80px' },
                    { id: 'status', header: 'Status', accessor: (r: any) => (
                      <span className={cn('text-xs font-medium', r.is_violated ? 'text-destructive' : 'text-success')}>{r.is_violated ? 'Violated' : 'OK'}</span>
                    ), width: '70px' },
                    { id: 'active', header: 'Active', accessor: (r: any) => r.is_active ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="info" size="sm">Inactive</Badge>, width: '70px' },
                  ]}
                  searchable={false}
                  pageSize={10}
                />
              ) : (
                <EmptyState title="No rules" description="This account has no rules configured." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
                <Button size="sm" onClick={() => setShowNoteDialog(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Note</Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes && notes.length > 0 ? (
                <div className="space-y-2">
                  {notes.map((note: any) => (
                    <div key={note.id} className="flex items-start justify-between rounded-lg bg-muted/30 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{note.title}</span>
                          {note.pinned && <Pin className="h-3 w-3 text-primary" />}
                        </div>
                        {note.content && <p className="text-xs text-muted-foreground mt-1">{note.content}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{new Date(note.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteNote.mutate(note.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No notes yet" description="Add notes to track account observations." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funding">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Funding History</CardTitle>
                <Button size="sm" onClick={() => setShowFundingDialog(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Funding</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {funding && funding.length > 0 ? (
                <DataTable
                  data={funding}
                  columns={[
                    { id: 'date', header: 'Date', accessor: (f: any) => new Date(f.created_at).toLocaleDateString(), width: '100px' },
                    { id: 'type', header: 'Type', accessor: (f: any) => <Badge variant={f.event_type === 'deposit' ? 'success' : 'warning'} size="sm">{f.event_type}</Badge>, width: '90px' },
                    { id: 'amount', header: 'Amount', accessor: (f: any) => <span className={cn('font-medium', f.event_type === 'deposit' ? 'text-success' : 'text-destructive')}>{f.event_type === 'deposit' ? '+' : '-'}{formatCurrency(f.amount)}</span>, width: '100px' },
                    { id: 'currency', header: 'Currency', accessor: (f: any) => f.currency, width: '70px' },
                    { id: 'description', header: 'Description', accessor: (f: any) => f.description || '—', width: '140px', hideOnMobile: true },
                    { id: 'balance_after', header: 'Balance After', accessor: (f: any) => f.balance_after != null ? formatCurrency(f.balance_after) : '—', width: '100px', hideOnMobile: true },
                  ]}
                  searchable={false}
                  pageSize={10}
                />
              ) : (
                <EmptyState title="No funding history" description="Funding events will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Note</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Content</label>
              <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none h-24" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write your note..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={() => createNote.mutate()} isLoading={createNote.isPending}>Save</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showFundingDialog} onOpenChange={setShowFundingDialog}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Funding Event</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
              <Input type="number" value={fundAmount} onChange={(e) => setFundAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Input value={fundDesc} onChange={(e) => setFundDesc(e.target.value)} placeholder="Funding description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowFundingDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addFunding.mutate()} isLoading={addFunding.isPending}>Add</Button>
          </div>
        </div>
      </Dialog>
    </PageLayout>
  );
}
