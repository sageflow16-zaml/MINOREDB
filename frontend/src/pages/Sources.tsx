import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSources, useUploadSource, useExtractClaims, useDetectConflicts, useDeleteSource } from '../hooks/useSources';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { SourceDrawer } from '../components/SourceDrawer';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SourceRead } from '../types';

export default function SourcesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sources, isLoading, error } = useSources(projectId!);
  const uploadSource = useUploadSource(projectId!);
  const extractClaims = useExtractClaims(projectId!);
  const detectConflicts = useDetectConflicts(projectId!);
  const deleteSource = useDeleteSource(projectId!);

  const [file, setFile] = useState<File | null>(null);
  const [viewSource, setViewSource] = useState<SourceRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadSource.mutate(formData, { onSuccess: () => setFile(null) });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading sources." />;

  return (
    <div>
      <PageHeader title="Sources">
        <div className="flex gap-2">
            <input type="file" accept=".txt,.pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button 
              onClick={handleUpload} 
              disabled={uploadSource.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {uploadSource.isPending ? 'Uploading...' : 'Upload'}
            </button>
        </div>
      </PageHeader>
      
      {!sources || sources.length === 0 ? (
        <EmptyState message="No sources found. Upload a file to begin." />
      ) : (
        <DataTable 
          data={sources} 
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Created At', accessor: 'created_at' },
            { header: 'Preview', accessor: (row) => row.raw_text?.substring(0, 50) + '...' },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button onClick={() => setViewSource(row)} className="text-slate-600">View</button>
                <button 
                  onClick={() => extractClaims.mutate(row.id)} 
                  disabled={extractClaims.isPending}
                  className="text-blue-500 disabled:opacity-50"
                >
                  Extract
                </button>
                <button 
                  onClick={() => detectConflicts.mutate(row.id)} 
                  disabled={detectConflicts.isPending}
                  className="text-orange-500 disabled:opacity-50"
                >
                  Detect
                </button>
                <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
              </div>
            )}
          ]} 
        />
      )}
      {viewSource && <SourceDrawer source={viewSource} onClose={() => setViewSource(null)} />}
      <ConfirmDialog 
        isOpen={!!deleteId} 
        title="Delete Source" 
        message="Are you sure you want to delete this source?" 
        onConfirm={() => { if (deleteId) deleteSource.mutate(deleteId); setDeleteId(null); }} 
        onCancel={() => setDeleteId(null)} 
      />
    </div>
  );
}
