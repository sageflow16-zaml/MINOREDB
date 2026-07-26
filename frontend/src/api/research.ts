import { callEdgeFunction } from '../lib/edgeFunctions';
import type { ResearchDetail, ResearchSession } from './types';

export { ResearchDetail, ResearchSession };
export type { };

export const researchService = {
  run: (projectId: string, question: string): Promise<{ session_id: string; status: string; message: string }> =>
    callEdgeFunction('ai', { operation: 'rag-chat', project_id: projectId, data: { conversation_id: '', message: question } }),

  getSession: async (_projectId: string, _sessionId: string): Promise<ResearchDetail> => {
    throw new Error('Research session detail not yet migrated');
  },

  getHistory: async (_projectId: string): Promise<ResearchSession[]> => {
    throw new Error('Research history not yet migrated');
  },
};
