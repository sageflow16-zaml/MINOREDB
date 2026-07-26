import { useParams } from 'react-router-dom';
import type { ConceptRead, ClaimRead, InterpretationRead } from '../types';
import { useConceptClaims, useConceptInterpretations } from '../hooks/useConcepts';
import { LoadingSpinner, EmptyState } from './ui/Feedback';

export const ConceptDrawer = ({ concept, onClose }: { concept: ConceptRead; onClose: () => void }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: claims, isLoading: claimsLoading } = useConceptClaims(projectId!, concept.id);
  const { data: interpretations, isLoading: interpsLoading } = useConceptInterpretations(projectId!, concept.id);

  return (
    <div className="fixed inset-0 bg-black/50 z-overlay flex justify-end">
      <div className="bg-card text-card-foreground w-full max-w-lg p-6 shadow-xl overflow-y-auto border-l border-border">
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-bold">Concept Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">Close</button>
        </div>
        <div className="space-y-4">
          <div><h4 className="font-semibold">Term</h4><p>{concept.conceptual_term}</p></div>
          <div><h4 className="font-semibold">Definition</h4><p>{concept.definition}</p></div>
          <div><h4 className="font-semibold">Created At</h4><p>{concept.created_at}</p></div>
          
          <div>
            <h4 className="font-semibold">Associated Claims</h4>
            {claimsLoading ? <LoadingSpinner /> : claims && claims.length > 0 ? (
                <ul className="text-sm list-disc pl-4">{claims.map((c: ClaimRead) => <li key={c.id}>{(c.verbatim_text ? c.verbatim_text.substring(0,50) : '') + '...'}</li>)}</ul>
            ) : <EmptyState message="No claims associated." />}
          </div>

          <div>
            <h4 className="font-semibold">Associated Interpretations</h4>
            {interpsLoading ? <LoadingSpinner /> : interpretations && interpretations.length > 0 ? (
                <ul className="text-sm list-disc pl-4">{interpretations.map((i: InterpretationRead) => <li key={i.id}>{i.interpretation_statement}</li>)}</ul>
            ) : <EmptyState message="No interpretations found." />}
          </div>
        </div>
      </div>
    </div>
  );
};
