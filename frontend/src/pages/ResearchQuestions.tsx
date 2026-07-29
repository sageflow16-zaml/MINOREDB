import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useResearchQuestions, useDeleteRQ, useGenerateHypothesis } from '../hooks/useResearch';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { HelpCircle, Trash2, FlaskConical } from 'lucide-react';

export default function ResearchQuestionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: questions, isLoading, error, refetch } = useResearchQuestions(projectId!);
  const deleteRQ = useDeleteRQ(projectId!);
  const generateHypothesis = useGenerateHypothesis(projectId!);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading questions." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Questions"
        description="Inquiry-driven research questions"
      />

      {!questions || questions.length === 0 ? (
        <EmptyState message="No research questions found." description="Create a research session in the Research page to generate questions." />
      ) : (
        <div className="grid gap-3">
          {questions.map((row: any, i: number) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-2/10">
                        <HelpCircle className="h-4 w-4 text-chart-2" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{row.question_statement}</CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" size="sm">{row.inquiry_origin || 'Unknown'}</Badge>
                          <span className="text-3xs text-muted-foreground">
                            {row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => generateHypothesis.mutate(row.id)}
                        disabled={generateHypothesis.isPending}
                        title="Generate hypothesis"
                      >
                        <FlaskConical className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
        onConfirm={() => { if (deleteId) deleteRQ.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
