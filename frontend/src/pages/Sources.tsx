import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSources, useUploadSource, useExtractClaims, useDetectConflicts, useDeleteSource } from '../hooks/useSources';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { SourceDrawer } from '../components/SourceDrawer';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Upload, FileText, Brain, AlertTriangle, Trash2, Eye, Sparkles, ChevronRight } from 'lucide-react';
import type { SourceRead } from '../types';

export default function SourcesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sources, isLoading, error, refetch } = useSources(projectId!);
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
  if (error) return <ErrorState message="Error loading sources." onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sources"
        description={`${sources?.length ?? 0} documents uploaded`}
        actions={
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent max-w-[200px]"
            />
            <Button
              onClick={handleUpload}
              disabled={!file || uploadSource.isPending}
              isLoading={uploadSource.isPending}
              size="sm"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
            </Button>
          </div>
        }
      />

      {!sources || sources.length === 0 ? (
        <EmptyState
          title="No sources found"
          description="Upload a file to begin extracting trading intelligence."
          icon={<FileText className="h-6 w-6" />}
          action={
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent max-w-[200px]"
              />
              <Button onClick={handleUpload} disabled={!file} size="sm">
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
              </Button>
            </div>
          }
        />
      ) : (
        <DataTable
          data={sources}
          columns={[
            {
              header: 'Preview',
              accessor: (row: any) => (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[200px] text-xs">
                    {row.raw_text?.substring(0, 60) || row.id?.substring(0, 8) || '-'}
                    {row.raw_text?.length > 60 ? '...' : ''}
                  </span>
                </div>
              ),
              sortable: true,
            },
            { header: 'ID', accessor: (row: any) => <span className="font-mono text-[10px] text-muted-foreground">{row.id?.substring(0, 8)}</span>, hideOnMobile: true },
            { header: 'Date', accessor: (row: any) => new Date(row.created_at).toLocaleDateString(), hideOnMobile: true },
            {
              header: 'Actions',
              accessor: (row: any) => (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setViewSource(row); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => { e.stopPropagation(); extractClaims.mutate(row.id); }}
                    disabled={extractClaims.isPending}
                  >
                    <Brain className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => { e.stopPropagation(); detectConflicts.mutate(row.id); }}
                    disabled={detectConflicts.isPending}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ),
              className: 'w-[140px]',
            },
          ]}
          searchable
          searchFields={['raw_text']}
          searchPlaceholder="Search source content..."
        />
      )}

      {viewSource && <SourceDrawer source={viewSource} onClose={() => setViewSource(null)} />}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Source"
        message="Are you sure you want to delete this source? This action cannot be undone."
        onConfirm={() => { if (deleteId) deleteSource.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
