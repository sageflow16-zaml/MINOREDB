import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInterpretations, useDeleteInterpretation } from '../hooks/useInterpretations';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { InterpretationDrawer } from '../components/InterpretationDrawer';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { InterpretationRead } from '../types';

export default function InterpretationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: interpretations, isLoading, error, refetch } = useInterpretations(projectId!);
  const deleteInterpretation = useDeleteInterpretation(projectId!);
  
  const [viewInterp, setViewInterp] = useState<InterpretationRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading interpretations." onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Interpretations" />
      
      {!interpretations || interpretations.length === 0 ? (
        <EmptyState message="No interpretations found." />
      ) : (
        <DataTable 
          data={interpretations} 
          columns={[
            { header: 'Statement', accessor: (row) => (row.interpretation_statement ? row.interpretation_statement.substring(0, 50) : '') + '...' },
            { header: 'Concept ID', accessor: 'concept_id' },
            { header: 'Foundation', accessor: 'interpretation_foundation' },
            { header: 'Created At', accessor: 'created_at' },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button onClick={() => setViewInterp(row)} className="text-slate-600">View</button>
                <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
              </div>
            )}
          ]} 
        />
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
