import api from '../services/api';
import type { SearchResult } from './types';

export const searchService = {
  query: (projectId: string, q: string) =>
    api
      .get<SearchResult[]>(`/projects/${projectId}/search`, { params: { q } })
      .then((r) => r.data),
};