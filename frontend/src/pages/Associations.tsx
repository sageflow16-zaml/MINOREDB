import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAssociations, useCreateAssociation, useDeleteAssociation } from '../hooks/useAssociations';
import { Link2, Trash2, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AssociationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: associations, isLoading, error, refetch } = useAssociations(projectId!);
  const createAssociation = useCreateAssociation(projectId!);
  const deleteAssociation = useDeleteAssociation(projectId!);

  const [claimId, setClaimId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [assocState, setAssocState] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = () => {
    if (!claimId || !conceptId) return;
    createAssociation.mutate({ claim_id: claimId, concept_id: conceptId, association_state: assocState || undefined });
    setClaimId(''); setConceptId(''); setAssocState(''); setShowCreate(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading associations." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Associations"
        description="Link claims to concepts"
      >
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New Association
        </Button>
      </PageHeader>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm font-medium">Create Association</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowCreate(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Input placeholder="Claim ID" value={claimId} onChange={(e) => setClaimId(e.target.value)} />
                  <Input placeholder="Concept ID" value={conceptId} onChange={(e) => setConceptId(e.target.value)} />
                </div>
                <select
                  value={assocState}
                  onChange={(e) => setAssocState(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
                >
                  <option value="">Any</option>
                  <option value="consistent">consistent</option>
                  <option value="inconsistent">inconsistent</option>
                  <option value="contradicts">contradicts</option>
                </select>
                <Button onClick={handleCreate} disabled={createAssociation.isPending || !claimId || !conceptId}>
                  <Plus className="mr-1.5 h-4 w-4" /> Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!associations || associations.length === 0 ? (
        <EmptyState message="No associations found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
                <th className="px-4 py-2.5">Claim ID</th>
                <th className="px-4 py-2.5">Concept ID</th>
                <th className="px-4 py-2.5">State</th>
                <th className="px-4 py-2.5">Ambiguity</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {associations.map((row: any) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-foreground text-[10px]">{row.claim_id?.slice(0, 12)}...</td>
                  <td className="px-4 py-2.5 font-mono text-foreground text-[10px]">{row.concept_id?.slice(0, 12)}...</td>
                  <td className="px-4 py-2.5">
                    {row.association_state && (
                      <Badge variant={
                        row.association_state === 'consistent' ? 'success' :
                        row.association_state === 'contradicts' ? 'destructive' : 'warning'
                      } size="sm">{row.association_state}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.ambiguity_metric ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(row.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Association"
        message="Are you sure you want to delete this association?"
        onConfirm={() => { if (deleteId) deleteAssociation.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
