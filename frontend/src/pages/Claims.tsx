import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClaims, useExtractConcepts, useInterpretClaim, useDeleteClaim } from '../hooks/useClaims';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FileText, ExternalLink, Trash2, Brain, RefreshCw } from 'lucide-react';

export default function ClaimsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: claims, isLoading, error, refetch } = useClaims(projectId!);
  const extractConcepts = useExtractConcepts(projectId!);
  const interpretClaim = useInterpretClaim(projectId!);
  const deleteClaim = useDeleteClaim(projectId!);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading claims." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims"
        description="Extracted claims and their interpretations"
      />

      {!claims || claims.length === 0 ? (
        <EmptyState message="No claims extracted yet." />
      ) : (
        <div className="grid gap-3">
          {claims.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-medium truncate">{row.id}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {row.verbatim_text || 'No text'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => extractConcepts.mutate(row.id)}
                      disabled={extractConcepts.isPending}
                      title="Extract concepts"
                    >
                      <Brain className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => interpretClaim.mutate(row.id)}
                      disabled={interpretClaim.isPending}
                      title="Interpret"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Link to={`/projects/${projectId}/claims/${row.id}/graph`}>
                      <Button variant="outline" size="icon-sm" title="View graph">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(row.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
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
