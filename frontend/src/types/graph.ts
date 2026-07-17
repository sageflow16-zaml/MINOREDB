export type GraphNodeType = 
  | 'source' 
  | 'claim' 
  | 'concept' 
  | 'interpretation' 
  | 'conflict' 
  | 'research_question' 
  | 'hypothesis';

export interface NodeMetadata {
  title: string;
  description: string;
  created_at: string;
  updated_at?: string;
  extra: Record<string, any>;
}

export interface GraphNodeData {
  label: string;
  type: GraphNodeType;
  metadata: NodeMetadata;
}

export interface GraphEdgeData {
  label?: string;
  animated: boolean;
  color?: string;
}

export interface DrawerData {
  id: string;
  type: GraphNodeType;
  label: string;
  metadata: NodeMetadata;
  relations: {
    incoming: string[];
    outgoing: string[];
  };
}
