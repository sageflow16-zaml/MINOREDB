import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useConcepts, useDeleteConcept } from '../hooks/useConcepts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { ConceptDrawer } from '../components/ConceptDrawer';
import { ClaimCount } from '../components/ClaimCount';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Lightbulb, Eye, Trash2, FileText } from 'lucide-react';
import type { ConceptRead } from '../types';

export default function ConceptsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: concepts, isLoading, error, refetch } = useConcepts(projectId!);
  const deleteConcept = useDeleteConcept(projectId!);

  const [viewConcept, setViewConcept] = useState<ConceptRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading concepts." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Concepts"
        description="Manage trading concepts and their definitions"
      />

      {!concepts || concepts.length === 0 ? (
        <EmptyState message="No concepts found." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {concepts.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
                        <Lightbulb className="h-4.5 w-4.5 text-chart-3" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{c.conceptual_term}</CardTitle>
                        {c.definition && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{c.definition}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <ClaimCount conceptId={c.id} /> claims
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewConcept(c)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {viewConcept && <ConceptDrawer concept={viewConcept} onClose={() => setViewConcept(null)} />}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Concept"
        message="Are you sure you want to delete this concept?"
        onConfirm={() => { if (deleteId) deleteConcept.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
