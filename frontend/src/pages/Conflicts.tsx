import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useConflicts, useDeleteConflict, useGenerateRQ } from '../hooks/useConflicts';
import { PageHeader } from '../components/PageHeader';
import {Card, CardHeader, CardTitle} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { ConflictDrawer } from '../components/ConflictDrawer';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AlertTriangle, Eye, Trash2, Lightbulb } from 'lucide-react';
import type { ConflictRead } from '../types';

export default function ConflictsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: conflicts, isLoading, error, refetch } = useConflicts(projectId!);
  const deleteConflict = useDeleteConflict(projectId!);
  const generateRQ = useGenerateRQ(projectId!);

  const [viewConflict, setViewConflict] = useState<ConflictRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading conflicts." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conflicts"
        description="Detected conflicts between claims and concepts"
      />

      {!conflicts || conflicts.length === 0 ? (
        <EmptyState message="No conflicts detected." description="Add multiple sources with differing viewpoints to detect conflicts." />
      ) : (
        <div className="grid gap-3">
          {conflicts.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {row.conflict_classification?.split('.')[0] || 'Conflict'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" size="sm">HIGH</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewConflict(row)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => generateRQ.mutate(row.id)}
                          disabled={generateRQ.isPending}
                          title="Generate research question"
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(row.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {viewConflict && <ConflictDrawer conflict={viewConflict} onClose={() => setViewConflict(null)} />}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Conflict"
        message="Are you sure you want to delete this conflict?"
        onConfirm={() => { if (deleteId) deleteConflict.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
