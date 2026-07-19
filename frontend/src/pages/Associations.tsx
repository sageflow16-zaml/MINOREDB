import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAssociations, useCreateAssociation, useDeleteAssociation } from '../hooks/useAssociations';

export default function AssociationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: associations, isLoading, error, refetch } = useAssociations(projectId!);
  const createAssociation = useCreateAssociation(projectId!);
  const deleteAssociation = useDeleteAssociation(projectId!);

  const [claimId, setClaimId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [assocState, setAssocState] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!claimId || !conceptId) return;
    createAssociation.mutate({ claim_id: claimId, concept_id: conceptId, association_state: assocState || undefined });
    setClaimId('');
    setConceptId('');
    setAssocState('');
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading associations." onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Associations">
        <div className="flex gap-2 items-center">
          <input className="border px-2 py-1 rounded" placeholder="Claim id" value={claimId} onChange={(e) => setClaimId(e.target.value)} />
          <input className="border px-2 py-1 rounded" placeholder="Concept id" value={conceptId} onChange={(e) => setConceptId(e.target.value)} />
          <select className="border px-2 py-1 rounded" value={assocState} onChange={(e) => setAssocState(e.target.value)}>
            <option value="">--</option>
            <option value="consistent">consistent</option>
            <option value="inconsistent">inconsistent</option>
            <option value="contradicts">contradicts</option>
          </select>
          <button onClick={handleCreate} disabled={createAssociation.isPending} className="bg-blue-600 text-white px-3 py-1 rounded">{createAssociation.isPending ? 'Creating...' : 'Create'}</button>
        </div>
      </PageHeader>

      {!associations || associations.length === 0 ? (
        <EmptyState message="No associations found." />
      ) : (
        <DataTable
          data={associations}
          columns={[
            { header: 'Claim ID', accessor: 'claim_id' },
            { header: 'Concept ID', accessor: 'concept_id' },
            { header: 'State', accessor: (row: any) => row.association_state ?? '-' },
            { header: 'Ambiguity Metric', accessor: (row: any) => row.ambiguity_metric ?? '-' },
            { header: 'Actions', accessor: (row: any) => (<div className="flex gap-2"><button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button></div>) },
          ]}
        />
      )}

      <ConfirmDialog isOpen={!!deleteId} title="Delete Association" message="Are you sure you want to delete this association?" onConfirm={() => { if (deleteId) deleteAssociation.mutate(deleteId); setDeleteId(null); }} onCancel={() => setDeleteId(null)} />
    </div>
  );
}