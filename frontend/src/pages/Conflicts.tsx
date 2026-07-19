import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConflicts, useDeleteConflict, useGenerateRQ } from '../hooks/useConflicts';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { ConflictDrawer } from '../components/ConflictDrawer';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ConflictRead } from '../types';

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
    <div>
      <PageHeader title="Conflicts" />
      
      {!conflicts || conflicts.length === 0 ? (
        <EmptyState message="No conflicts detected." />
      ) : (
        <DataTable 
          data={conflicts} 
          columns={[
            { header: 'Classification', accessor: (row) => row.conflict_classification.split('.')[0] },
            { header: 'Severity', accessor: () => 'HIGH' },
            { header: 'Created At', accessor: 'created_at' },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button onClick={() => setViewConflict(row)} className="text-slate-600">View</button>
                <button 
                  onClick={() => generateRQ.mutate(row.id)}
                  disabled={generateRQ.isPending}
                  className="text-green-500 disabled:opacity-50"
                >
                  Generate RQ
                </button>
                <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
              </div>
            )}
          ]} 
        />
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
