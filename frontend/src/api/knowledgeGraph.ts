import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { GraphData, KnowledgeNode, KnowledgeEdge, GraphSnapshot } from './types';

export const knowledgeGraphService = {
  data: async (projectId: string, nodeType?: string): Promise<GraphData> => {
    let nodeQuery = supabase.from('knowledge_node').select('*').eq('project_id', projectId);
    if (nodeType) nodeQuery = nodeQuery.eq('type', nodeType);
    const { data: nodes } = await nodeQuery;
    const { data: edges } = await supabase.from('knowledge_edge').select('*, source:source_node_id(*), target:target_node_id(*)').eq('project_id', projectId);
    const { data: snapshot } = await supabase.from('knowledge_graph_snapshot').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    return { nodes: nodes ?? [], edges: edges ?? [], snapshot: snapshot ?? null } as GraphData;
  },

  nodes: async (projectId: string, nodeType?: string): Promise<KnowledgeNode[]> => {
    let query = supabase.from('knowledge_node').select('*').eq('project_id', projectId);
    if (nodeType) query = query.eq('type', nodeType);
    const { data, error } = await query.order('weight', { ascending: false });
    if (error) throw error;
    return (data ?? []) as KnowledgeNode[];
  },

  edges: async (projectId: string): Promise<KnowledgeEdge[]> => {
    const { data, error } = await supabase.from('knowledge_edge').select('*').eq('project_id', projectId).order('strength', { ascending: false });
    if (error) throw error;
    return (data ?? []) as KnowledgeEdge[];
  },

  snapshot: async (projectId: string): Promise<GraphSnapshot> => {
    const { data, error } = await supabase.from('knowledge_graph_snapshot').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data as GraphSnapshot;
  },

  refresh: (projectId: string): Promise<GraphSnapshot> =>
    callEdgeFunction('ai', { operation: 'refresh-knowledge-graph', project_id: projectId }),
};
