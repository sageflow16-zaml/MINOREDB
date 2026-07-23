import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInterpretations, useDeleteInterpretation } from '../hooks/useInterpretations';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InterpretationDrawer } from '../components/InterpretationDrawer';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BookOpen, Eye, Trash2 } from 'lucide-react';
import type { InterpretationRead } from '../types';

export default function InterpretationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: interpretations, isLoading, error, refetch } = useInterpretations(projectId!);
  const deleteInterpretation = useDeleteInterpretation(projectId!);

  const [viewInterp, setViewInterp] = useState<InterpretationRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading interpretations." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interpretations"
        description="Claim interpretations and their foundations"
      />

      {!interpretations || interpretations.length === 0 ? (
        <EmptyState message="No interpretations found." description="Analyze your claims to generate interpretations." />
      ) : (
        <div className="grid gap-3">
          {interpretations.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-1/10">
                        <BookOpen className="h-4 w-4 text-chart-1" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {row.interpretation_statement?.slice(0, 80) || 'Interpretation'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">Concept: {row.concept_id?.slice(0, 12)}...</span>
                          {row.interpretation_foundation && (
                            <span className="text-xs text-muted-foreground">Foundation: {row.interpretation_foundation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewInterp(row)}>
                        <Eye className="h-3.5 w-3.5" />
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

      {viewInterp && <InterpretationDrawer interpretation={viewInterp} onClose={() => setViewInterp(null)} />}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Interpretation"
        message="Are you sure you want to delete this interpretation?"
        onConfirm={() => { if (deleteId) deleteInterpretation.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
