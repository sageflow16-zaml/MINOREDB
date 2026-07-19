import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useHypotheses, useDeleteHypothesis } from '../hooks/useResearch';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function HypothesesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: hypotheses, isLoading, error, refetch } = useHypotheses(projectId!);
  const deleteHypothesis = useDeleteHypothesis(projectId!);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading hypotheses." onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Hypotheses" />
      
      {!hypotheses || hypotheses.length === 0 ? (
        <EmptyState message="No hypotheses found." />
      ) : (
        <DataTable 
          data={hypotheses} 
          columns={[
            { header: 'Statement', accessor: 'hypothesis_statement' },
            { header: 'Variables', accessor: 'variable_specification' },
            { header: 'Created At', accessor: 'created_at' },
            { header: 'Actions', accessor: (row) => (
              <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
            )}
          ]} 
        />
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
