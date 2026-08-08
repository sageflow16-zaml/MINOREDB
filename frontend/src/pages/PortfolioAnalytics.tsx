import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout, PageSection } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { usePortfolioAnalytics, usePortfolioAskAI, useAccounts, useBrokers } from '../hooks/usePortfolio';
import {
  BarChart3, TrendingUp, TrendingDown, Building, BrainCircuit, Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const aiQuestions = [
  { id: 'best', label: 'Best Performing Account', question: 'Which account is performing best and why?' },
  { id: 'worst', label: 'Worst Performing Account', question: 'Which account needs the most attention?' },
  { id: 'rebalance', label: 'Rebalancing Suggestions', question: 'Do you have any rebalancing suggestions for my portfolio?' },
  { id: 'broker', label: 'Broker Analysis', question: 'How do my brokers compare in terms of performance and costs?' },
];

export default function PortfolioAnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState('accounts');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const { data: analytics, isLoading, isError, refetch } = usePortfolioAnalytics(projectId!);
  const { data: accounts } = useAccounts(projectId!);
  const { data: brokers } = useBrokers(projectId!);
  const askAI = usePortfolioAskAI(projectId!);

  const handleAskAI = async (question: string, id: string) => {
    setAiLoading(id);
    try {
      const result = await askAI.mutateAsync(question);
      setAiResult(result.answer);
    } catch {
      setAiResult('AI analysis failed. Please try again.');
    }
    setAiLoading(null);
  };

  const accountData = accounts ?? [];
  const brokerData = brokers ?? [];

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
        <ErrorState message="Error loading analytics." description="There was a problem fetching your data." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection title="Portfolio Analytics" description="Cross-account analysis and AI-powered insights">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="accounts"><BarChart3 className="h-3.5 w-3.5 mr-1" /> Account Comparison</TabsTrigger>
            <TabsTrigger value="brokers"><Building className="h-3.5 w-3.5 mr-1" /> Broker Comparison</TabsTrigger>
            <TabsTrigger value="ai"><BrainCircuit className="h-3.5 w-3.5 mr-1" /> AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Account Performance Comparison</CardTitle></CardHeader>
              <CardContent className="p-0">
                {accountData.length > 0 ? (
                  <DataTable
                    data={accountData}
                    columns={[
                      { id: 'name', header: 'Name', accessor: (r: any) => r.name, width: '120px' },
                      { id: 'type', header: 'Type', accessor: (r: any) => <Badge variant="info" size="sm">{r.account_type}</Badge>, width: '90px' },
                      { id: 'trades', header: 'Trades', accessor: (r: any) => r.trade_count ?? '-', width: '70px', hideOnMobile: true },
                      { id: 'win_rate', header: 'Win Rate', accessor: (r: any) => r.win_rate != null ? `${r.win_rate}%` : '-', width: '80px' },
                      { id: 'total_pnl', header: 'Total PnL', accessor: (r: any) => (
                        <span className={cn('font-medium', (r.total_pnl || r.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
                          {formatCurrency(r.total_pnl ?? r.pnl)}
                        </span>
                      ), width: '100px' },
                      { id: 'avg_pnl', header: 'Avg PnL', accessor: (r: any) => formatCurrency(r.avg_pnl), width: '100px', hideOnMobile: true },
                      { id: 'profit_factor', header: 'Profit Factor', accessor: (r: any) => r.profit_factor?.toFixed(2) ?? '-', width: '90px', hideOnMobile: true },
                    ]}
                    searchable={false}
                    pageSize={15}
                  />
                ) : (
                  <EmptyState title="No accounts" description="Add accounts to see comparisons." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brokers">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Broker Performance Comparison</CardTitle></CardHeader>
              <CardContent className="p-0">
                {brokerData.length > 0 ? (
                  <DataTable
                    data={brokerData}
                    columns={[
                      { id: 'broker_name', header: 'Broker', accessor: (r: any) => r.broker_name, width: '140px' },
                      { id: 'platform', header: 'Platform', accessor: (r: any) => <Badge variant="info" size="sm">{r.platform}</Badge>, width: '80px' },
                      { id: 'accounts', header: 'Accounts', accessor: (r: any) => r.account_count ?? '-', width: '80px', hideOnMobile: true },
                      { id: 'server', header: 'Server', accessor: (r: any) => r.server || '-', width: '120px', hideOnMobile: true },
                      { id: 'total_pnl', header: 'Total PnL', accessor: (r: any) => (
                        <span className={cn('font-medium', (r.total_pnl ?? 0) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(r.total_pnl)}</span>
                      ), width: '100px' },
                    ]}
                    searchable={false}
                    pageSize={15}
                  />
                ) : (
                  <EmptyState title="No brokers" description="Add broker profiles to see comparisons." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {aiQuestions.map((q) => (
                <Card key={q.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => handleAskAI(q.question, q.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      <Sparkles className="h-5 w-5 text-primary-text" />
                    </div>
                    <p className="text-xs text-center text-foreground font-medium">{q.label}</p>
                    {aiLoading === q.id && <p className="text-xs text-center text-muted-foreground mt-1">Analyzing...</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
            {aiResult && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-primary-text" />
                    <CardTitle className="text-sm font-medium">AI Analysis Result</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{aiResult}</p>
                </CardContent>
              </Card>
            )}
            {!aiResult && (
              <EmptyState title="Ask AI for insights" description="Click a question above to get AI-powered portfolio analysis." />
            )}
          </TabsContent>
        </Tabs>
      </PageSection>
    </PageLayout>
  );
}
