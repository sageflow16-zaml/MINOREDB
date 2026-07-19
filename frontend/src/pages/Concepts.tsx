import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConcepts, useDeleteConcept } from '../hooks/useConcepts';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { ConceptDrawer } from '../components/ConceptDrawer';
import { ClaimCount } from '../components/ClaimCount';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ConceptRead } from '../types';

export default function ConceptsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: concepts, isLoading, error, refetch } = useConcepts(projectId!);
  const deleteConcept = useDeleteConcept(projectId!);
  
  const [viewConcept, setViewConcept] = useState<ConceptRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading concepts." onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Concepts" />
      
      {!concepts || concepts.length === 0 ? (
        <EmptyState message="No concepts found." />
      ) : (
        <DataTable 
          data={concepts} 
          columns={[
            { header: 'Concept', accessor: 'conceptual_term' },
            { header: 'Definition', accessor: (row) => row.definition ? row.definition.substring(0, 50) + '...' : '' },
            { header: 'Number of Claims', accessor: (row) => <ClaimCount conceptId={row.id} /> },
            { header: 'Created At', accessor: 'created_at' },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button onClick={() => setViewConcept(row)} className="text-slate-600">View</button>
                <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
              </div>
            )}
          ]} 
        />
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
