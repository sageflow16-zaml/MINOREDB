import { ConflictRead } from '../types';
import { useConflictClaims } from '../hooks/useConflicts';
import { useProject } from '../context/ProjectContext';
import { LoadingSpinner, EmptyState } from './ui/Feedback';

export const ConflictDrawer = ({ conflict, onClose }: { conflict: ConflictRead; onClose: () => void }) => {
  const { projectId } = useProject();
  const { data: claims, isLoading: claimsLoading } = useConflictClaims(projectId!, conflict.id);

  return (
    <div className="fixed inset-0 bg-black/50 z-overlay flex justify-end">
      <div className="bg-card text-card-foreground w-full max-w-lg p-6 shadow-xl overflow-y-auto border-l border-border">
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-bold">Conflict Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">Close</button>
        </div>
        <div className="space-y-4">
          <div><h4 className="font-semibold">Classification</h4><p>{conflict.conflict_classification}</p></div>
          <div><h4 className="font-semibold">Contextual Applicability</h4><p>{conflict.contextual_applicability_check}</p></div>
          <div><h4 className="font-semibold">Created At</h4><p>{conflict.created_at}</p></div>
          
          <div>
            <h4 className="font-semibold">Related Claims</h4>
            {claimsLoading ? <LoadingSpinner /> : claims && claims.length > 0 ? (
                <ul className="text-sm list-disc pl-4">{claims.map(c => <li key={c.id}>{(c.verbatim_text ? c.verbatim_text.substring(0,50) : '') + '...'}</li>)}</ul>
            ) : <EmptyState message="No related claims found." />}
          </div>
        </div>
      </div>
    </div>
  );
};
