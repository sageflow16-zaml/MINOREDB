import { callEdgeFunction } from '../lib/edgeFunctions';
import type { AnalystResponse, EvidenceItem } from './types';

export type { AnalystResponse, EvidenceItem };

export const analystService = {
  query: (projectId: string, question: string): Promise<AnalystResponse> =>
    callEdgeFunction('ai', { operation: 'rag-chat', project_id: projectId, data: { conversation_id: '', message: question } }),
};
