import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout, PageSection } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { usePortfolioRiskAssessment, useAccounts, usePortfolioAskAI } from '../hooks/usePortfolio';
import { Shield, BrainCircuit, AlertTriangle, DollarSign, Percent, BarChart3, Target } from 'lucide-react';
import { cn } from '../lib/utils';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export default function PortfolioRiskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [aiResult, setAiResult] = useState<string | null>(null);

  const { data: dashboard, isLoading, isError, refetch } = usePortfolioRiskAssessment(projectId!);
  const { data: accounts } = useAccounts(projectId!);
  const askAI = usePortfolioAskAI(projectId!);
  const risk = dashboard?.risk;

  const handleRiskAssessment = async () => {
    try {
      const result = await askAI.mutateAsync('Perform a comprehensive portfolio risk assessment. What are my biggest risks and how can I mitigate them?');
      setAiResult(result.answer);
    } catch {
      setAiResult('Risk assessment failed. Please try again.');
    }
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
        <ErrorState message="Error loading risk data." description="There was a problem fetching your risk assessment." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title="Portfolio Risk"
        description="Risk monitoring and assessment"
        headerActions={
          <Button size="sm" onClick={handleRiskAssessment} isLoading={askAI.isPending}>
            <BrainCircuit className="h-3.5 w-3.5 mr-1" /> AI Risk Assessment
          </Button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><DollarSign className="h-3 w-3" /> Total Exposure</div>
            <div className="text-lg font-semibold text-foreground">{formatCurrency(risk?.total_exposure)}</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Percent className="h-3 w-3" /> Margin Ratio</div>
            <div className={cn('text-lg font-semibold', risk?.margin_ratio != null && risk.margin_ratio > 80 ? 'text-destructive' : risk?.margin_ratio != null && risk.margin_ratio > 50 ? 'text-warning' : 'text-success')}>
              {risk?.margin_ratio != null ? `${risk.margin_ratio.toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><BarChart3 className="h-3 w-3" /> Portfolio Drawdown</div>
            <div className={cn('text-lg font-semibold', risk?.portfolio_drawdown != null && risk.portfolio_drawdown > 20 ? 'text-destructive' : risk?.portfolio_drawdown != null && risk.portfolio_drawdown > 10 ? 'text-warning' : 'text-success')}>
              {risk?.portfolio_drawdown != null ? `${risk.portfolio_drawdown.toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Target className="h-3 w-3" /> Concentration Risk</div>
            <div className={cn('text-lg font-semibold', risk?.concentration_risk != null && risk.concentration_risk > 50 ? 'text-destructive' : risk?.concentration_risk != null && risk.concentration_risk > 25 ? 'text-warning' : 'text-success')}>
              {risk?.concentration_risk != null ? `${risk.concentration_risk.toFixed(0)}%` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Shield className="h-3 w-3" /> Risk Score</div>
            <div className={cn('text-lg font-semibold', risk?.risk_score != null && risk.risk_score > 70 ? 'text-destructive' : risk?.risk_score != null && risk.risk_score > 40 ? 'text-warning' : 'text-success')}>
              {risk?.risk_score != null ? `${risk.risk_score}/100` : '—'}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Account Risk Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            {accounts && accounts.length > 0 ? (
              <DataTable
                data={accounts}
                columns={[
                  { id: 'name', header: 'Account', accessor: (r: any) => r.name, width: '140px' },
                  { id: 'balance', header: 'Balance', accessor: (r: any) => formatCurrency(r.current_balance), width: '100px' },
                  { id: 'equity', header: 'Equity', accessor: (r: any) => formatCurrency(r.current_equity), width: '100px' },
                  { id: 'margin_level', header: 'Margin Level', accessor: (r: any) => (
                    <span className={cn('font-medium', r.margin_level > 200 ? 'text-success' : r.margin_level > 100 ? 'text-warning' : 'text-destructive')}>
                      {r.margin_level != null ? `${r.margin_level.toFixed(0)}%` : '—'}
                    </span>
                  ), width: '100px' },
                  { id: 'exposure', header: 'Used Margin', accessor: (r: any) => formatCurrency(r.used_margin), width: '100px' },
                  { id: 'free_margin', header: 'Free Margin', accessor: (r: any) => formatCurrency(r.free_margin), width: '100px', hideOnMobile: true },
                ]}
                searchable={false}
                pageSize={15}
              />
            ) : (
              <EmptyState title="No accounts" description="Add accounts to see risk breakdown." />
            )}
          </CardContent>
        </Card>

        {risk && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Risk Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Total Open Positions</div>
                  <div className="text-lg font-bold text-foreground mt-1">{risk.total_open_positions}</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className={cn('text-lg font-bold mt-1', (risk.win_rate ?? 0) >= 50 ? 'text-success' : 'text-destructive')}>{risk.win_rate != null ? `${risk.win_rate}%` : '—'}</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Loss Count</div>
                  <div className="text-lg font-bold text-destructive mt-1">{risk.loss_count}</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Max Symbol Exposure</div>
                  <div className="text-lg font-bold text-foreground mt-1">{formatCurrency(risk.max_symbol_exposure)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {aiResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary-text" />
                <CardTitle className="text-sm font-medium">AI Risk Assessment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{aiResult}</p>
            </CardContent>
          </Card>
        )}
      </PageSection>
    </PageLayout>
  );
}
