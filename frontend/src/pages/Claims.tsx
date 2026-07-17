import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClaims, useExtractConcepts, useInterpretClaim, useDeleteClaim } from '../hooks/useClaims';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Link } from 'react-router-dom';

export default function ClaimsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: claims, isLoading, error } = useClaims(projectId!);
  const extractConcepts = useExtractConcepts(projectId!);
  const interpretClaim = useInterpretClaim(projectId!);
  const deleteClaim = useDeleteClaim(projectId!);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading claims." />;

  return (
    <div>
      <PageHeader title="Claims" />
      
      {!claims || claims.length === 0 ? (
        <EmptyState message="No claims extracted yet." />
      ) : (
        <DataTable 
          data={claims} 
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Verbatim Text', accessor: (row) => (row.verbatim_text ? row.verbatim_text.substring(0, 50) : '') + '...' },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button 
                  onClick={() => extractConcepts.mutate(row.id)} 
                  disabled={extractConcepts.isPending}
                  className="text-blue-500 disabled:opacity-50"
                >
                  Extract
                </button>
                <button 
                  onClick={() => interpretClaim.mutate(row.id)} 
                  disabled={interpretClaim.isPending}
                  className="text-green-500 disabled:opacity-50"
                >
                  Interpret
                </button>
                <Link to={`/projects/${projectId}/claims/${row.id}/graph`} className="text-purple-500">Graph</Link>
                <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
              </div>
            )}
          ]} 
        />
      )}
      <ConfirmDialog 
        isOpen={!!deleteId} 
        title="Delete Claim" 
        message="Are you sure you want to delete this claim?" 
        onConfirm={() => { if (deleteId) deleteClaim.mutate(deleteId); setDeleteId(null); }} 
        onCancel={() => setDeleteId(null)} 
      />
    </div>
  );
}
