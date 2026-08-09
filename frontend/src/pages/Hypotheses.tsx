import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHypotheses, useDeleteHypothesis } from '../hooks/useResearch';
import { PageHeader } from '../components/PageHeader';
import {Card, CardHeader, CardTitle} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FlaskConical, Trash2 } from 'lucide-react';

export default function HypothesesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: hypotheses, isLoading, error, refetch } = useHypotheses(projectId!);
  const deleteHypothesis = useDeleteHypothesis(projectId!);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading hypotheses." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hypotheses"
        description="Generated research hypotheses"
      />

      {!hypotheses || hypotheses.length === 0 ? (
        <EmptyState message="No hypotheses found." description="Combine claims and interpretations to form hypotheses." />
      ) : (
        <div className="grid gap-3">
          {hypotheses.map((row: any, i: number) => (
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
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
                        <FlaskConical className="h-4 w-4 text-chart-3" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{row.hypothesis_statement}</CardTitle>
                        {row.variable_specification && (
                          <p className="text-xs text-muted-foreground mt-0.5">Variables: {row.variable_specification}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}
                      </span>
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
        title="Delete Hypothesis"
        message="Are you sure you want to delete this hypothesis?"
        onConfirm={() => { if (deleteId) deleteHypothesis.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
