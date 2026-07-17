import { useParams } from 'react-router-dom';
import { useConceptClaims } from '../hooks/useConcepts';

export const ClaimCount = ({ conceptId }: { conceptId: string }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: claims, isLoading } = useConceptClaims(projectId!, conceptId);
  return <>{isLoading ? '...' : claims?.length || 0}</>;
};
