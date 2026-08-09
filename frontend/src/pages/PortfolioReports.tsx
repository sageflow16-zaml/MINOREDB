import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout, PageSection, PageGrid } from '../components/PageHeader';
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/Card';

import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/select';
import {LoadingSpinner, EmptyState} from '../components/ui/Feedback';
import { usePortfolioReport, usePortfolioAskAI, useAccounts } from '../hooks/usePortfolio';
import { FileText, Shield, PieChart, BarChart3, BrainCircuit, Sparkles, Download } from 'lucide-react';
import { cn } from '../lib/utils';

const reportTypes = [
  { id: 'portfolio', label: 'Portfolio Report', icon: BarChart3, description: 'Overall portfolio performance and summary' },
  { id: 'risk', label: 'Risk Report', icon: Shield, description: 'Risk metrics and exposure analysis' },
  { id: 'allocation', label: 'Allocation Report', icon: PieChart, description: 'Capital allocation breakdown' },
  { id: 'comparison', label: 'Performance Comparison', icon: FileText, description: 'Account performance comparison' },
];

export default function PortfolioReportsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [aiReport, setAiReport] = useState<string | null>(null);

  const { data: accounts } = useAccounts(projectId!);
  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } = usePortfolioReport(projectId!, selectedReport || '', selectedAccount || undefined);
  const askAI = usePortfolioAskAI(projectId!);

  const handleGenerateReport = (type: string) => {
    setSelectedReport(type);
    setAiReport(null);
  };

  const handleGenerateAI = async () => {
    try {
      const result = await askAI.mutateAsync('Generate a comprehensive portfolio performance report with recommendations.');
      setAiReport(result.answer);
    } catch {
      setAiReport('AI report generation failed. Please try again.');
    }
  };

  const accountOptions = (accounts ?? []).map((a: any) => ({ label: a.name, value: a.id }));

  const reportContent = reportData?.content || reportData;

  return (
    <PageLayout>
      <PageSection
        title="Reports"
        description="Generate and view portfolio reports"
        headerActions={
          <Button size="sm" onClick={handleGenerateAI} isLoading={askAI.isPending}>
            <BrainCircuit className="h-3.5 w-3.5 mr-1" /> AI Generate Report
          </Button>
        }
      >
        <PageGrid cols={4}>
          {reportTypes.map((rt) => (
            <Card key={rt.id} className={cn('cursor-pointer hover:border-primary/30 transition-colors', selectedReport === rt.id && 'border-primary')} onClick={() => handleGenerateReport(rt.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <rt.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground text-center">{rt.label}</p>
                <p className="text-xs text-muted-foreground text-center mt-1">{rt.description}</p>
              </CardContent>
            </Card>
          ))}
        </PageGrid>

        {selectedReport === 'comparison' && accountOptions.length > 0 && (
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1 block">Filter by Account (optional)</label>
            <Select value={selectedAccount} onChange={setSelectedAccount} options={[{ label: 'All Accounts', value: '' }, ...accountOptions]} className="w-60" />
          </div>
        )}

        {selectedReport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{reportTypes.find((rt) => rt.id === selectedReport)?.label}</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetchReport()}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportLoading ? (
                <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
              ) : reportContent ? (
                <div className="text-sm text-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto">
                  {typeof reportContent === 'string' ? reportContent : JSON.stringify(reportContent, null, 2)}
                </div>
              ) : (
                <EmptyState title="No data" description="Click a report type above to generate it." />
              )}
            </CardContent>
          </Card>
        )}

        {aiReport && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-text" />
                <CardTitle className="text-sm font-medium">AI-Generated Report</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{aiReport}</p>
            </CardContent>
          </Card>
        )}

        {!selectedReport && !aiReport && (
          <EmptyState title="Select a report type" description="Choose a report type above to generate it, or use AI for a comprehensive analysis." />
        )}
      </PageSection>
    </PageLayout>
  );
}
